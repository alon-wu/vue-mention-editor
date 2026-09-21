# 扩展与底层能力

除了直接使用 `<MentionEditor />`，包内还导出了构建它所需的全部零件，方便你在自己的 tiptap 编辑器里复用。

```ts
import {
  MentionEditor,
  MentionList,
  createMentionExtension,
  createSuggestionRenderer,
  resolveMentionItems,
} from "vue-mention-editor";
```

---

## createMentionExtension

创建 mention 节点扩展，一次性声明多个触发符、数据源解析与自定义属性。

```ts
import { createMentionExtension } from "vue-mention-editor";

const mention = createMentionExtension({
  triggers: [
    { char: "@", label: "提及成员", items: members, debounce: 300 },
    { char: "#", items: tags },
  ],
  extraAttributes: {
    avatar: { default: null },
  },
  HTMLAttributes: { class: "vme-mention" },
  render: (trigger, index) => myRendererFactory(trigger),
});

useEditor({ extensions: [Document, Paragraph, Text, mention] });
```

### 参数

| 参数              | 类型                                                         | 说明                                                     |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `triggers`        | `MentionTrigger[]`                                           | 触发符配置（必填）                                       |
| `render`          | `(trigger, index) => MentionSuggestionRenderer \| undefined` | 候选面板渲染器工厂                                       |
| `extraAttributes` | `MentionAttributes`                                          | 追加到 mention 节点的自定义属性                          |
| `HTMLAttributes`  | `Record<string, unknown>`                                    | 追加到 mention 节点 DOM 上的属性（默认带 `vme-mention`） |
| `renderHTML`      | `MentionRenderHTML`                                          | 自定义提及块的 HTML 结构（如资源 chip）                  |
| `renderText`      | `MentionRenderText`                                          | 自定义提及块的文本化规则（影响 `getText` / 文本值）      |
| `renderLabel`     | `MentionRenderLabel`                                         | （弃用）旧版标签渲染，建议用 `renderText`                |

### 与官方 Mention 的差异

- `suggestions` 由 `triggers` 数组自动生成，无需手写 `suggestion` 对象。
- `items` 支持直接传数组（内置包含匹配过滤）或异步函数（自动处理 `AbortSignal` 中断）。
- 支持 `extraAttributes` 直接扩展节点 schema。

---

## createSuggestionRenderer

创建「默认候选面板 + 定位托管」的 suggestion 渲染器。用于你已经有自己的编辑器实例，但想复用本包的面板时。

```ts
import { createSuggestionRenderer, createMentionExtension } from "vue-mention-editor";

const mention = createMentionExtension({
  triggers: [{ char: "@", items: members }],
  render: (trigger, index) =>
    createSuggestionRenderer({
      trigger,
      index,
      emptyText: "无匹配结果",
      onSelect: (item, triggerConfig) => console.log("选中", item.label, triggerConfig.char),
    }),
});
```

| 参数             | 类型                        | 说明                                     |
| ---------------- | --------------------------- | ---------------------------------------- |
| `trigger`        | `MentionTrigger`            | 当前触发符配置（标题、空状态等从中读取） |
| `index`          | `number`                    | 触发符下标                               |
| `emptyText`      | `string`                    | 兜底空状态文案                           |
| `renderItem`     | `MentionItemRenderer`       | 自定义候选项渲染函数                     |
| `onSelect`       | `(item, trigger) => void`   | 选中回调                                 |
| `onActiveChange` | `(active: boolean) => void` | 面板开/关回调（用于与快捷键互斥）        |

返回值即 tiptap suggestion 的 `render` 回调对象（`onStart` / `onUpdate` / `onExit` / `onKeyDown`）。定位优先使用 tiptap 的 `props.mount()`（Floating UI 托管），旧版本回退到手动监听 `scroll`/`resize` 定位。

---

## resolveMentionItems

独立的数据源解析工具，把「数组 / 异步函数」统一解析为 `MentionItem[]`。

```ts
import { resolveMentionItems } from "vue-mention-editor";

const items = await resolveMentionItems(
  members, // 数组或函数
  { query: "zh", trigger: "@", signal: controller.signal },
  (item, query) => item.label.startsWith(query), // 可选：自定义过滤
);
```

特性：数组按关键词本地过滤（`label` / `id` / `description`）；函数异常若为 `AbortError` 或 `signal.aborted` 则返回空数组。

---

## 取值 / 序列化工具

不经过组件、自己处理文本时可以直接用这些纯函数（都从入口导出）：

```ts
import {
  serializeDocText, // 文档 → 文本（默认 `@ + label`；可传 renderMention 自定义）
  parseTextToContent, // 文本 → tiptap JSON（提及节点以 token 作 id）
  serializeDocMarkdown, // 文档 → Markdown（扩展输出）
  idMentionText, // `@ + id`（文本值模式用）
  defaultRenderMentionText, // `@ + label`（可读文本用）
} from "vue-mention-editor";

const text = serializeDocText(editor.state.doc);
const content = parseTextToContent(text, {
  triggers: ["@", "#"],
  resolve: (token) => members.find((item) => item.id === token),
  allowedPrefixes: [" ", "，"], // 可选：触发符前允许出现的字符
});
const markdown = serializeDocMarkdown(editor.state.doc);
```

| 函数                              | 说明                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `serializeDocText(doc, opts)`     | 按 `renderMention` 把文档序列化为文本；默认 `@ + label`（缺 label 回退 id）                                   |
| `parseTextToContent(text, o)`     | 逐行解析 `@token`；`allowedPrefixes` 默认 `[' ']`（行首或空格后），`token: 'label'` 时节点 id 取 resolve 结果 |
| `serializeDocMarkdown(doc, o)`    | 覆盖段落 / 标题 / 列表 / 引用 / 代码块 / 行内标记 / 硬换行 / 分割线 / 提及                                    |
| `mentionTextRenderer(token)`      | 按 `'id'` / `'label'` 取「节点 → 文本」渲染函数（默认 `'id'`）                                                |
| `idMentionText(attrs)`            | `${触发符}${id}`，用于文本值往返                                                                              |
| `defaultRenderMentionText(attrs)` | `${触发符}${label}`，用于可读文本                                                                             |

---

## MentionList

默认候选面板组件，可单独使用（例如替换 `createSuggestionRenderer` 的内部实现）。

| Prop          | 类型                  | 说明                                                            |
| ------------- | --------------------- | --------------------------------------------------------------- |
| `items`       | `MentionItem[]`       | 候选项（必填）                                                  |
| `query`       | `string`              | 查询串（必填）                                                  |
| `trigger`     | `string`              | 触发符（必填）                                                  |
| `command`     | `(item) => void`      | 选中回调（必填）                                                |
| `title`       | `string`              | 头部标题                                                        |
| `emptyText`   | `string`              | 空状态文案                                                      |
| `loading`     | `boolean`             | 加载态                                                          |
| `renderItem`  | `MentionItemRenderer` | 自定义候选项渲染                                                |
| `renderEmpty` | `() => VNodeChild`    | 自定义空状态渲染（对应 `#empty` 插槽）                          |
| `popupClass`  | `string`              | 面板根元素追加的 class（可由 `MentionTrigger.popupClass` 传入） |

通过 `ref` 暴露：`onKeyDown({ event })`（供 suggestion 键盘转发）、`selectItem(index)`、`selectedIndex`。

---

## Vue 插件

```ts
import VueMentionEditor from "vue-mention-editor";

app.use(VueMentionEditor);
// 全局组件：<MentionEditor />、<MentionList />
```

```ts
// 默认导出即插件对象
import VueMentionEditor from "vue-mention-editor";
VueMentionEditor.install(app);
```

---

## 构建产物

| 文件             | 说明                                              |
| ---------------- | ------------------------------------------------- |
| `dist/index.mjs` | ESM 入口                                          |
| `dist/index.cjs` | CommonJS 入口                                     |
| `dist/style.css` | 样式（需显式引入 `vue-mention-editor/style.css`） |
| `dist/types/**`  | 类型声明                                          |

`vue` 与 `@tiptap/*` 均被外部化，不会打进产物，因此不会出现多份 Tiptap 实例。
