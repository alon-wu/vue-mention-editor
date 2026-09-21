# 外观定制

## 一、`#item` 插槽：自定义候选项

默认候选项是「头像 + 主标题 + 描述」。用 `#item` 插槽可以完全接管其结构：

```vue
<MentionEditor v-model="content" :triggers="triggers">
  <template #item="{ item, index, query, selected, trigger }">
    <div class="member-item" :class="{ 'is-selected': selected }">
      <img :src="item.avatar" />
      <span>{{ item.label }}</span>
      <small>{{ item.description }}</small>
    </div>
  </template>
</MentionEditor>
```

插槽参数：

| 参数       | 类型          | 说明                     |
| ---------- | ------------- | ------------------------ |
| `item`     | `MentionItem` | 当前候选项               |
| `index`    | `number`      | 在候选列表中的下标       |
| `query`    | `string`      | 当前查询串（不含触发符） |
| `selected` | `boolean`     | 是否为键盘高亮项         |
| `trigger`  | `string`      | 命中的触发符，如 `@`     |

实现要点：

- 插槽内容由**父组件作用域**渲染，因此可以直接使用父组件的响应式数据、子组件与 scoped 样式（写普通 class 即可，不需要 `:deep`）。
- 高亮样式建议用 `selected` 判断，不要依赖 `:hover`，键盘操作时也能看到当前项。
- 点击事件不用自己处理，面板已在 `mousedown` 阶段处理选中。

完整示例（含关键词高亮）：[dev/examples/CustomItemSlot.vue](../../dev/examples/CustomItemSlot.vue)

## 二、内置面板的结构与类名

默认面板（`MentionList`）渲染出的结构与类名如下，便于你按需覆盖样式：

```html
<div class="vme-popup" data-trigger="@">
  <div class="vme-popup__header">
    <span class="vme-popup__title">提及成员</span>
    <span class="vme-popup__query">@zh</span>
  </div>
  <ul class="vme-popup__list" role="listbox">
    <li class="vme-popup__item is-selected" role="option" aria-selected="true">
      <img class="vme-popup__avatar" />
      <span class="vme-popup__label">张三</span>
      <span class="vme-popup__desc">zhangsan@example.com</span>
    </li>
    <li class="vme-popup__hint">无匹配结果</li>
  </ul>
</div>
```

> 面板默认被挂载到 `document.body` 下（可通过 `trigger.container` 改变），因此**样式覆盖要写在全局作用域**，scoped 样式需要 `:deep` 或全局选择器。

除了覆盖内置类名，还提供两个结构级定制入口：

```vue
<!-- ① 按触发符给面板加 class，方便分别写样式 -->
<script setup lang="ts">
const triggers: MentionTrigger[] = [
  { char: "@", items: members, popupClass: "my-popup--member" },
  { char: "#", items: tags, popupClass: "my-popup--tag" },
];
</script>

<!-- ② #empty 插槽：接管空状态 -->
<MentionEditor v-model="content" :triggers="triggers">
  <template #empty>
    <div class="my-empty">没有找到匹配项</div>
  </template>
</MentionEditor>
```

## 三、设计令牌（CSS 变量）

样式系统分两层，**定制主题只需要覆盖第二层**：

1. **基础令牌**（`--vme-gray-*` / `--vme-brand-*` / `--vme-space-*` / `--vme-radius-*` / `--vme-font-size-*`）：调色板与尺度，一般不用改；
2. **语义令牌**：组件真正读取的变量，也是主题入口。

### 语义令牌速查

| 变量                         | 默认值                           | 作用                                       |
| ---------------------------- | -------------------------------- | ------------------------------------------ |
| `--vme-bg`                   | `#fff`                           | 编辑区背景                                 |
| `--vme-text-color`           | `--vme-gray-900`                 | 正文颜色                                   |
| `--vme-muted-color`          | `--vme-gray-500`                 | 次要文字（描述、空状态）                   |
| `--vme-border-color`         | `--vme-gray-200`                 | 边框颜色                                   |
| `--vme-border-strong-color`  | `--vme-gray-300`                 | hover 态边框                               |
| `--vme-primary-color`        | `--vme-brand-600`                | 强调色（驱动聚焦边框；深色预设只需覆盖它） |
| `--vme-focused-border-color` | `--vme-primary-color`            | 聚焦态边框                                 |
| `--vme-focus-ring`           | `0 0 0 3px rgb(79 70 229 / 14%)` | 聚焦外发光                                 |
| `--vme-radius`               | `8px`                            | 圆角                                       |
| `--vme-padding-x` / `-y`     | `12px` / `10px`                  | 编辑区内边距                               |
| `--vme-font-size`            | `14px`                           | 字号                                       |
| `--vme-content-min-height`   | `96px`                           | 默认最小高度                               |
| `--vme-placeholder-color`    | `--vme-gray-400`                 | 占位内容颜色                               |
| `--vme-readonly-bg`          | `--vme-gray-50`                  | `editable=false` 背景                      |
| `--vme-disabled-bg`          | `--vme-gray-100`                 | `disabled` 背景                            |
| `--vme-disabled-text-color`  | `--vme-gray-400`                 | `disabled` 文字色                          |
| `--vme-mention-bg`           | `--vme-brand-50`                 | 提及块背景                                 |
| `--vme-mention-color`        | `--vme-brand-800`                | 提及块文字色                               |
| `--vme-mention-radius`       | `4px`                            | 提及块圆角                                 |
| `--vme-popup-bg`             | `#fff`                           | 面板背景                                   |
| `--vme-popup-radius`         | `12px`                           | 面板圆角                                   |
| `--vme-popup-shadow`         | 两级阴影                         | 面板阴影                                   |
| `--vme-popup-min-width`      | `240px`                          | 面板最小宽度（宽度随内容撑开）             |
| `--vme-popup-max-width`      | `380px`                          | 面板最大宽度                               |
| `--vme-popup-max-height`     | `288px`                          | 面板最大高度（超出滚动）                   |
| `--vme-item-height`          | `36px`                           | 候选项最小高度                             |
| `--vme-item-active-bg`       | `--vme-brand-50`                 | 候选项高亮背景                             |
| `--vme-item-active-color`    | `--vme-brand-800`                | 候选项高亮文字色                           |
| `--vme-avatar-size`          | `20px`                           | 候选项头像尺寸                             |
| `--vme-scrollbar-thumb`      | `--vme-gray-300`                 | 滚动条滑块颜色                             |
| `--vme-z-tip`                | `1100`                           | 悬浮提示层级                               |
| `--vme-tip-bg`               | `#fff`                           | 悬浮提示背景                               |
| `--vme-tip-radius`           | `8px`                            | 悬浮提示圆角                               |
| `--vme-tip-padding`          | `6px`                            | 悬浮提示内边距                             |
| `--vme-tip-max-width`        | `260px`                          | 悬浮提示最大宽度                           |
| `--vme-tip-media-width`      | `200px`                          | 提示内媒体的推荐宽度                       |
| `--vme-tip-media-ratio`      | `16 / 9`                         | 视频 / 音频容器宽高比                      |

> 面板宽度由内容决定（tiptap 会给浮层写入 `width: max-content`），用 `--vme-popup-min-width` / `--vme-popup-max-width` 控制区间。

> 悬浮提示同理：气泡宽度上限是 `--vme-tip-max-width`（默认 260px），插槽内容比它宽就会被挤到气泡外面（组件会约束内容不超过气泡）。想更宽 / 换色时，在全局作用域覆盖 `--vme-tip-*` 令牌，或给 `mention-hover` 指定 `container` 让浮层待在主题容器里。

### 深色主题

令牌内置了深色预设，给容器加 `data-vme-theme="dark"` 即可：

```html
<div data-vme-theme="dark">
  <!-- 面板挂载在 body 下，需要让 trigger.container 指向这个容器才能继承令牌 -->
</div>
```

```ts
const triggers: MentionTrigger[] = [{ char: "@", items: members, container: ".my-theme-scope" }];
```

完整可运行示例：[dev/examples/ThemingExample.vue](../../dev/examples/ThemingExample.vue)

### 作用域注意

- **编辑区**：变量加在组件根元素（或其祖先）上即可局部生效。

```css
.dark-form :deep(.vme-root) {
  --vme-bg: #1f2937;
  --vme-text-color: #e5e7eb;
  --vme-border-color: #374151;
}
```

- **面板**：面板被挂载到 `document.body` 之外时不会继承局部变量，两种做法：
  1. **推荐**：把 `trigger.container` 指向主题容器，面板直接继承容器上的令牌；
  2. 或把面板相关令牌写在全局作用域（`html.dark`、`:root`）。

```css
/* 全局样式表：仅当没有使用 container 时才需要 */
html.dark {
  --vme-popup-bg: #1f2937;
  --vme-item-active-bg: #312e81;
  --vme-muted-color: #9ca3af;
}
```

完整示例（明暗切换）：[dev/examples/ThemingExample.vue](../../dev/examples/ThemingExample.vue)

## 四、自定义提及块（选中后的节点）

选中候选项后，编辑器里插入的是一个原子行内节点，默认渲染为：

```html
<span class="vme-mention" data-type="mention" data-id="u1" data-label="张三">@张三</span>
```

三种定制粒度：

| 需求                  | 做法                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| 只改样式              | 重写 `--vme-mention-*` 变量，或 `:deep(.vme-mention)` + `mentionClass` |
| 改结构（如头像 chip） | `mention-render-html` + `extraAttributes`                              |
| 改纯文本形式          | `mention-render-text`（影响 `getText` 与文本值模式）                   |

示例：把提及渲染成「缩略图 + 文件名」的资源 chip。

```ts
import type { MentionAttributes, MentionRenderHTML } from "vue-mention-editor";

// 1) 先声明需要随节点保存的字段
const extraAttributes: MentionAttributes = {
  thumb: {
    default: "",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-thumb"),
    renderHTML: (attrs) => ({ "data-thumb": attrs.thumb }),
  },
};

// 2) 再决定渲染成什么结构（vme-mention--pill 是内置的胶囊样式，可选）
const renderMentionHtml: MentionRenderHTML = ({ node }) => [
  "span",
  {
    class: "vme-mention vme-mention--pill vme-mention--resource",
    "data-type": "mention",
    "data-id": node.attrs.id,
    "data-label": node.attrs.label,
    "data-thumb": node.attrs.thumb,
  },
  ["img", { class: "vme-mention__thumb", src: node.attrs.thumb }],
  ["span", { class: "vme-mention__label" }, node.attrs.label],
];
```

```vue
<MentionEditor
  v-model="content"
  :triggers="triggers"
  :extra-attributes="extraAttributes"
  :mention-render-html="renderMentionHtml"
/>
```

注意点：

- 模板里请写 `:mention-render-html`（而不是 `:mention-render-h-t-m-l`），属性名已避开连续大写；
- 渲染出的 DOM 请保留 `data-type="mention"` 与 `data-id`，方便回显解析与点击命中；
- 提及块在编辑器内容区内，项目里的 scoped 样式要用 `:deep(.vme-content .vme-mention--xxx)`：带上 `.vme-content` 才能稳定压过库默认样式（否则两者同权重，结果取决于样式注入顺序）；
- 需要重启时才生效的场景：`mention-render-html` 在编辑器初始化时装配，动态切换请配合 `:key` 重新挂载。

写样式时的几个经验点：

```css
/* ① 胶囊型提及块：加 vme-mention--pill，尺寸 / 内边距 / 圆角 / 垂直对齐都由组件处理 */
:deep(.vme-content .vme-mention--resource) {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12.5px;
}

/* ② 内部元素用 em 定尺寸，跟随字号缩放，且不要被压缩 */
:deep(.vme-content .vme-mention__thumb) {
  flex-shrink: 0;
  width: 1.3em;
  height: 1.3em;
  border-radius: 50%;
  object-fit: cover;
}

/* ③ 只截断标签：文字太长时图标与开头的标识始终可见 */
:deep(.vme-content .vme-mention__label) {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

同理，想让 chip 带一个「来源 / 类型」前缀时，把标识写成结构里的第一个子元素（如 `["span", { class: "vme-mention__badge" }, "#"]`），它就不会跟着标题一起被省略。

> **垂直对齐别自己算**：固定高度的 chip 会让默认的 `baseline` 对齐失效，而 `vertical-align: <长度>` 的参考点是元素自身的基线——它会随内部结构（缩略图 / 徒标 / 纯文字）变化，没有一个值能适配所有 chip。要么直接用 `vme-mention--pill`，要么按组件内部的写法来：`vertical-align: middle; position: relative; top: -0.12em;`（实测三种 chip 结构偏差均 < 0.1px）。

完整示例：[自定义提及块结构](../../dev/examples/MentionChipExample.vue)

## 五、自定义编辑区内容样式

```css
/* 提及节点：可用 mentionClass 追加自定义 class 再单独覆盖 */
.my-editor :deep(.vme-mention) {
  border-radius: 999px;
  padding: 0 8px;
}

/* 编辑区内容（ProseMirror 根元素） */
.my-editor :deep(.vme-content) {
  font-size: 15px;
  line-height: 1.8;
}

/* 段落间距 */
.my-editor :deep(.vme-content p) {
  margin: 0 0 8px;
}
```

## 六、完全自绘面板（进阶）

如果你希望面板结构、渲染方式完全自己控制（例如直接复用项目里的 UI 组件库下拉），可以绕过默认面板，自己实现 suggestion 渲染器：

```ts
import { createMentionExtension } from "vue-mention-editor";
import { VueRenderer } from "@tiptap/vue-3";
import MyPopup from "./MyPopup.vue";

const mention = createMentionExtension({
  triggers: [{ char: "@", label: "提及成员", items: members }],
  render: () => {
    let renderer: VueRenderer | undefined;
    return {
      onStart: (props) => {
        renderer = new VueRenderer(MyPopup, { props, editor: props.editor });
        // props.mount 负责定位（滚动/缩放自动跟随）
        if (renderer.element) props.mount(renderer.element as HTMLElement);
      },
      onUpdate: (props) => renderer?.updateProps(props),
      onExit: () => {
        renderer?.destroy();
        renderer = undefined;
      },
      onKeyDown: (props) => (props.event.key === "Escape" ? true : false),
    };
  },
});

useEditor({ extensions: [mention /* ... */] });
```

`render` 的返回值与 Tiptap suggestion 完全一致（`onStart` / `onUpdate` / `onExit` / `onKeyDown`），因此可以直接参照 [Tiptap 官方 suggestion 文档](https://tiptap.dev/docs/editor/api/utilities/suggestion) 自行实现。

## 下一步

- [数据与持久化](./data-persistence.md)
- [API：扩展与底层能力](../api/extensions.md)
