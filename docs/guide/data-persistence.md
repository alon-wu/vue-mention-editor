# 数据与持久化

## 默认值：纯文本（提及写成 `@ + id`）

v-model 默认就是一条能直接提交的字符串：

```
"你好 @u1 请查收"
```

- `@u1` 里的 `u1` 就是候选项的 `id`：后端 / 大模型收到的就是一条普通文本，不需要解析 HTML；
- 展示信息（`label` / 头像等）回显时用 `textValue.resolve` 补回：`resolve: (token) => members.find((m) => m.id === token)`；
- 只有「行首或空格后」的 `@token` 会被识别为提及，因此 `zhangsan@example.com` 这类普通文本不会被误判（可用 `textValue.allowedPrefixes` 调整）；
- 段落之间用 `\n` 分隔（可用 `textValue.blockSeparator` 调整）。

### 想让值直接可读：`token: 'label'`

如果提交出去的那一条字符串需要人类直接读（或展示在别的只读位置），把 token 换成 `label`：

```vue
<script setup lang="ts">
// v-model → “指派给 @张三 跟进”（而不是 “指派给 @u1 跟进”）
const textValue = {
  token: "label" as const,
  // 回显时用 label 换回真实 id，节点里保存的仍然是 id
  resolve: (token: string) => members.find((member) => member.label === token),
};
</script>

<template>
  <MentionEditor v-model="value" :triggers="triggers" :text-value="textValue" />
</template>
```

要点：

- 节点属性里**依然是真实 `id`**（`resolve` 负责换回），所以 `getMentions()` / 后端关联不受影响；
- 解析不到时 token 会退化为 label 本身，不会报错；
- 不想改配置、只想在某一处换形态：`editorRef.value?.getText({ token: "id" })` / `getMarkdown({ token: "id" })`。

需要保留加粗 / 列表等富文本时，把 `value-format` 设为 `"html"`。

## 扩展输出：HTML / Markdown / JSON

无论值格式是什么，都可以随时取富文本形式；插入提及后的 HTML 结构如下：

```html
<p>
  你好
  <span
    class="vme-mention"
    data-type="mention"
    data-id="u1"
    data-label="张三"
    data-mention-suggestion-char="@"
    >@张三</span
  >
  请查收
</p>
```

| 属性                           | 含义                               |
| ------------------------------ | ---------------------------------- |
| `data-type="mention"`          | 固定值，用于识别提及节点           |
| `data-id`                      | 候选项的 `id`，业务侧据此关联实体  |
| `data-label`                   | 展示文本（`label`）                |
| `data-mention-suggestion-char` | 触发符，多触发符场景下用于区分来源 |

回显时把这段 HTML 直接交给 `v-model` 即可，提及节点会自动还原（不会退化成普通文本）。

## 存储建议

| 方式                | 取值                             | 适用场景                                            |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| 存纯文本（默认）    | `content`（v-model）             | 聊天 / 评论 / AI 输入框：直接发接口，回显用 resolve |
| 存 HTML（扩展）     | `editorRef.value?.getHTML()`     | 需要保留富文本，或要直接 `v-html` 渲染              |
| 存 JSON（扩展）     | `editorRef.value?.getJSON()`     | 需要结构化数据、二次加工时                          |
| 存 Markdown（扩展） | `editorRef.value?.getMarkdown()` | 内容要进 Prompt / 知识库 / Markdown 文档            |

```ts
// 提取被提及的成员（用于发通知）
const mentions: string[] = [];
editor.state.doc.descendants((node) => {
  if (node.type.name === "mention") mentions.push(node.attrs.id);
  return true;
});
```

> 提交到接口前建议做一次服务端校验：`data-id` 是用户可控内容，务必按不可信数据处理。

## 保存自定义字段（extraAttributes）

默认只有 `id` / `label` 会写进节点。若还需要头像、邮箱、类型等信息随文档一起保存，用 `extraAttributes` 声明节点属性：

```ts
import type { MentionAttributes } from "vue-mention-editor";

const extraAttributes: MentionAttributes = {
  avatar: {
    default: null,
    // 回显：从 HTML 属性读回
    parseHTML: (element: HTMLElement) => element.getAttribute("data-avatar"),
    // 输出：写进 HTML 属性
    renderHTML: (attrs) => ({ "data-avatar": attrs.avatar }),
  },
  email: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-email"),
    renderHTML: (attrs) => ({ "data-email": attrs.email }),
  },
};
```

```vue
<MentionEditor v-model="content" :triggers="triggers" :extra-attributes="extraAttributes" />
```

声明之后，`items` 里的同名字段会在插入时自动写入节点属性：

```ts
const members = [
  {
    id: "u1",
    label: "张三",
    avatar: "https://i.pravatar.cc/40?img=12",
    email: "zhangsan@example.com",
  },
];
```

输出的 HTML：

```html
<span
  class="vme-mention"
  data-type="mention"
  data-id="u1"
  data-label="张三"
  data-avatar="https://i.pravatar.cc/40?img=12"
  data-email="zhangsan@example.com"
  >@张三</span
>
```

读取全部提及节点的属性：

```ts
const mentions: Record<string, unknown>[] = [];
editor.state.doc.descendants((node) => {
  if (node.type.name === "mention") mentions.push(node.attrs);
  return true;
});
```

完整示例：[dev/examples/ExtraAttributesExample.vue](../../dev/examples/ExtraAttributesExample.vue)

## 与表单集成

编辑器通过 `v-model` 暴露的是 HTML 字符串，可以直接接入表单校验：

```vue
<script setup lang="ts">
import { computed, ref } from "vue";

const content = ref("");
const touched = ref(false);

const error = computed(() => {
  if (!touched.value) return "";
  const editor = editorRef.value?.editor;
  if (!editor || editor.isEmpty) return "请输入内容";
  if (content.value.replace(/<[^>]*>/g, "").length > 200) return "最多 200 字";
  return "";
});
</script>

<template>
  <MentionEditor ref="editorRef" v-model="content" :triggers="triggers" @blur="touched = true" />
  <p v-if="error" class="error">{{ error }}</p>
</template>
```

> 想按字符数限制输入，可在 `@change` 中判断后回滚内容，或等待后续内置的 `maxlength` 支持（见 [路线图](../../README.md#路线图)）。

## 常见坑

- **不要用 `v-html` 编辑**：展示历史内容时若需要交互（点击提及查看详情、继续编辑），请使用组件而不是 `v-html`。
- **回显内容缺少提及样式**：确认已引入 `vue-mention-editor/style.css`，并且展示容器内能看到 `.vme-mention` 规则。
- **`data-id` 与业务 ID 类型**：`id` 统一按字符串处理（`data-*` 属性本身就是字符串），数字 ID 请在提交时再转换。

## 下一步

- [场景配方](./recipes.md)
- [API：类型定义](../api/types.md)
