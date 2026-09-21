# AI 场景：资源提及（值为 `@ + src`）

在 AI 对话 / 生成类项目里，`@` 提到的通常不是「人」，而是**已上传的图片、视频、音频、文件**。这类场景有两个硬性要求：

1. **双向绑定的值是纯文本**，形如 `@/uploads/a.png 帮我把它做成海报`，而不是 HTML；
2. **文件被删除后，内容里所有 `@` 了该文件的位置都要一并清理**，并且能用这个值**完整恢复**出带缩略图的资源 chip。

组件通过三个开关原样支持：

| 能力           | 配置                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| 值格式为纯文本 | 无需配置：`value-format` 默认就是 `text`（提及序列化为 `@ + id`，id 即 src） |
| 恢复展示信息   | `:text-value="{ resolve }"`（用 src 换回文件名 / 缩略图 / 类型）             |
| 删除联动       | `:mention-pool="resources"` + `pruneMentions`（默认开启）                    |

## 一、最小可用示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionItem, MentionTrigger } from "vue-mention-editor";
import "vue-mention-editor/style.css";

/** 已上传资源：id 就是服务端返回的 src */
const resources = ref<MentionItem[]>([
  { id: "/uploads/beach.png", label: "海边清晨.png", kind: "image", thumb: "/thumbs/beach.png" },
  { id: "/uploads/demo.mp4", label: "演示视频.mp4", kind: "video", thumb: "/thumbs/demo.png" },
]);

/** 服务端保存的值：@ + src */
const value = ref("@/uploads/beach.png 帮我做成 4K 壁纸");

const triggers: MentionTrigger[] = [
  { char: "@", label: "选择已上传资源", items: () => resources.value },
];
</script>

<template>
  <MentionEditor
    v-model="value"
    :triggers="triggers"
    :mention-pool="resources"
    :text-value="{ resolve: (token) => resources.find((item) => item.id === token) }"
    :extra-attributes="extraAttributes"
    :mention-render-html="renderMentionHtml"
  />
</template>
```

完整可运行版本：[dev/examples/AiResourceExample.vue](../../dev/examples/AiResourceExample.vue)

## 二、值格式：为什么是 `@ + src`

`valueFormat` 默认就是 `'text'`，此格式下：

- **输出**：文档序列化为纯文本，mention 节点写成 `@` + `id`，其它内容原样保留；段落之间用 `\n` 分隔（可用 `textValue.blockSeparator` 调整）。
- **输入**：文本按 `@token` 解析回文档，`token` 即 `id`（默认匹配 `\S+`，可用 `textValue.tokenPattern` 调整）。

```
"看看这张 @/uploads/beach.png 和 @/uploads/demo.mp4"
      └── 文本 ──┘└──── mention（id=/uploads/beach.png）────┘└── 文本 ──┘
```

注意：**src 中不要包含空格**（必要时做 URL 编码），否则会被 token 规则截断。若你的 id 不是 src（例如 `resourceId` 形式），把 `id` 设为该 id，并在 `resolve` 里换回 src 即可，文本值仍然是 `@ + id`。

## 三、恢复：`textValue.resolve`

传入的文本值只有 id，展示所需的信息（文件名、缩略图、类型、体积）需要自己找回：

```ts
const textValue = {
  // token 即 id（src）
  resolve: (token: string) => resources.value.find((item) => item.id === token),
};
```

- 返回的 `label` 会成为 chip 上的文案；
- 其它字段（如 `kind` / `thumb`）只要用 `extraAttributes` 声明过，就会写进节点属性并渲染；
- 找不到资源时也不会报错，会退化为「id 即文案」的普通提及块——如果你希望此时直接丢弃该引用，见下一节的清理规则。

### 资源列表比绑定值晚到（异步恢复）

恢复发生在两个时刻：**组件挂载**与**外部改动 v-model**。如果那一刻资源数据还没到，`resolve` 返回
`undefined`，chip 会先退化成「只显示 src」的普通提及块；数据到位后需要再解析一次：

```vue
<!-- 方式一（推荐）：把资源池交给组件，池一变就自动清理失效引用 + 补齐展示信息 -->
<MentionEditor v-model="value" :mention-pool="resources" ... />
```

```ts
// 方式二：手动补齐（资源来自其它 store、详情接口按需请求时）
await fetchResources();
editorRef.value?.refreshMentions(); // 返回补齐的节点数量；不写入撤销历史，也不改动 v-model 值
```

两个注意点：

- **资源列表没就绪时先别传 `mention-pool`**：一旦传入，池内 id 就是「有效集合」，还没加载到的引用会被当作失效引用删掉。先 `:mention-pool="ready ? resources : undefined"`，加载完再传；
- `refreshMentions()` 只补 `resolve` 返回的**非空字段**，不会拿局部数据抹掉已有展示信息。

完整演示见示例顶部的「① 先恢复绑定值 → ② 资源加载完成」两个按钮：
[dev/examples/AiResourceExample.vue](../../dev/examples/AiResourceExample.vue)。

## 四、删除已上传文件时的联动清理

### 自动清理（推荐）

传入 `mentionPool` 后，组件会在**资源池变化**或**外部恢复内容**时，自动删除内容里引用了不存在资源的提及：

```vue
<MentionEditor v-model="value" :mention-pool="resources" ... />
```

```ts
function removeFile(id: string) {
  resources.value = resources.value.filter((item) => item.id !== id); // 提及会被自动清理
}
```

清理会连同提及后面的一个空格一起删除，避免留下悬空空格；同一资源被 `@` 了多次时，**所有位置都会被删除**。若不想自动清理，可显式关闭：

```vue
<MentionEditor :mention-pool="resources" :prune-mentions="false" ... />
```

### 手动清理

需要更精细的控制（例如按 `thumb`、按类型清理）时，用实例方法：

```ts
// 按 id 批量删除
editorRef.value?.removeMentions(["/uploads/beach.png"]);

// 自定义判定：删除所有引用已被删除文件的提及
editorRef.value?.removeMentions((attrs) => !resources.value.some((item) => item.id === attrs.id));
```

返回值是实际删除的数量；删除操作只会触发一次编辑器更新，`v-model` 会立刻同步为清理后的文本值。

## 五、把提及块渲染成资源 chip

`mention-render-html` 决定选中后的提及块长什么样：

```ts
import type { MentionAttributes, MentionRenderHTML } from "vue-mention-editor";

const extraAttributes: MentionAttributes = {
  kind: {
    default: "file",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-kind"),
    renderHTML: (attrs) => ({ "data-kind": attrs.kind }),
  },
  thumb: {
    default: "",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-thumb"),
    renderHTML: (attrs) => ({ "data-thumb": attrs.thumb }),
  },
};

const renderMentionHtml: MentionRenderHTML = ({ node }) => [
  "span",
  {
    class: "vme-mention vme-mention--resource",
    "data-type": "mention",
    "data-id": node.attrs.id,
    "data-label": node.attrs.label,
    "data-kind": node.attrs.kind,
    "data-thumb": node.attrs.thumb,
  },
  node.attrs.kind === "image"
    ? ["img", { class: "vme-mention__thumb", src: node.attrs.thumb }]
    : ["span", { class: "vme-mention__icon" }, node.attrs.kind === "video" ? "🎬" : "📄"],
  ["span", { class: "vme-mention__label" }, node.attrs.label],
];
```

配色与尺寸在项目样式里覆盖即可（提及块位于编辑器内容区内，scoped 样式用 `:deep`，并带上 `.vme-content` 提高权重；布局与垂直对齐交给内置的 `vme-mention--pill`）：

```css
/* 胶囊型 chip：只需要写配色，尺寸 / 圆角 / 垂直对齐由 vme-mention--pill 处理 */
:deep(.vme-content .vme-mention--resource) {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12.5px;
}

:deep(.vme-content .vme-mention__thumb) {
  flex-shrink: 0;
  width: 1.3em;
  height: 1.3em;
  border-radius: 50%;
  object-fit: cover;
}

/* 只截断文件名，图标与扩展名标识不会被省略 */
:deep(.vme-content .vme-mention__label) {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

> 长文件名 / 长标题场景的通用建议：chip 用 `vme-mention--pill`（内置的胶囊样式，自带正确的垂直对齐），并**只给标签加省略号**，不要给整个 chip 加 `max-width` + `overflow: hidden`（那会把图标一起截掉，也会撑乱行高）。自己写固定高度时用 `vertical-align: middle; position: relative; top: -0.12em;`，不要用 `text-bottom` 或单个负长度值。

## 六、悬浮预览（图片 / 视频 / 音频 / 完整文本）

编辑区内的提及块支持悬浮提示。组件负责**命中检测、延迟、定位**以及「移入浮层不关闭」，你只需提供 `#mention-tip` 插槽决定显示什么：

```vue
<MentionEditor v-model="value" :triggers="triggers">
  <template #mention-tip="{ attrs, label }">
    <!-- 图片：200px 宽，高度等比 -->
    <img v-if="attrs.kind === 'image'" :src="String(attrs.preview)" class="tip-media" />

    <!-- 视频：200px × 16:9，可直接播放 -->
    <video v-else-if="attrs.kind === 'video'" :src="String(attrs.preview)" controls playsinline />

    <!-- 音频：同样是 200px × 16:9 的容器 -->
    <div v-else-if="attrs.kind === 'audio'" class="tip-audio-box">
      <audio :src="String(attrs.preview)" controls />
    </div>

    <p v-else>📄 {{ label }}</p>
  </template>
</MentionEditor>
```

```css
.tip-media {
  display: block;
  width: 200px;
  height: auto; /* 图片等比 */
}

.tip-audio-box {
  display: flex;
  align-items: center;
  width: 200px;
  aspect-ratio: 16 / 9; /* 视频 / 音频统一 16:9 */
  background: #0f172a;
}
```

要点：

- 插槽拿到的 `attrs` 是节点上**全部** `data-*` 属性（只需用 `extraAttributes` 声明过 `preview` 等字段）；
- 浮层可交互，所以视频 / 音频能直接播放、长文本能滚动；
- **气泡宽度上限是 `--vme-tip-max-width`（默认 260px）**：内容建议控制在 240px 以内（组件也会约束内容不超出气泡）；需要更宽时在全局作用域覆盖该令牌，或给 `mention-hover` 配 `container` 让浮层继承容器令牌；
- 长文本（如 `#` 引用的资料）不建议全部写进 `data-*`：只存 id，在 `attrs.id` 基础上再请求详情；
- 延迟、方位、容器可配置：`mention-hover="{ delay: 120, placement: 'top-start', container: '.modal-body' }"`。

示例：

- [资源提及（图片 / 视频 / 音频预览）](../../dev/examples/AiResourceExample.vue)
- [技能引用（/ 单例 + 名称省略 + 完整描述）](../../dev/examples/AiSkillExample.vue)
- [长文本引用（# 资料片段）](../../dev/examples/AiTextRefExample.vue)

## 七、常见交互与注意事项

| 场景                          | 做法                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 上传完成后自动 @ 新文件       | `resources.value = [...resources.value, item]` 后调用 `editorRef.value?.insertMention(item)`（会自动补空格） |
| 绑定值先到、资源后到          | 传 `mention-pool`（池变化自动补齐）或手动 `editorRef.value?.refreshMentions()`                               |
| 清空后重新开始                | `editorRef.value?.clear()`                                                                                   |
| 提交前取用到的资源 id         | `editorRef.value?.getMentions()` 返回全部提及节点属性                                                        |
| 读取纯文本                    | `editorRef.value?.getText()`（可读形式，mention 序列化为 `@ + label`）                                       |
| 多个触发符（@ 图片 / # 技能） | `triggers` 里配置多个 `char`，`resolve` 里按触发符区分                                                       |
| 面板被弹窗裁剪                | 给对应触发符配置 `container: ".modal-body"`                                                                  |

> `insertMention` 只对「当前光标处」生效：如果用户正在输入框中间，提及会插入到光标位置，而不是末尾。需要固定插入到末尾时，先 `editorRef.value?.focus()`（会聚焦到末尾）再插入。

## 下一步

- [数据与持久化](./data-persistence.md)：HTML 结构的持久化与表单集成
- [外观定制](./customizing.md)：候选面板与提及块的样式
- [API：Props](../api/props.md)
