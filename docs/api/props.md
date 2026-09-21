# Props

`MentionEditor` 的全部属性如下（均可在模板中以 kebab-case 书写，如 `:min-height`）。

| 属性                | 类型                      | 默认值                                             | 说明                                                                    |
| ------------------- | ------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `modelValue`        | `string`                  | `''`                                               | 编辑器内容（v-model）：默认纯文本（提及为 `@ + id`）                    |
| `placeholder`       | `string \| VNodeChild`    | `''`                                               | 空内容时的占位内容，支持字符串、VNode 行内块与 `#placeholder` 插槽      |
| `triggers`          | `MentionTrigger[]`        | `[{ char: '@', items: [] }]`                       | 触发符配置，详见 [触发符与数据源](../guide/triggers.md)                 |
| `baseExtensions`    | `Extensions \| false`     | `[Document, Paragraph, Text, HardBreak, UndoRedo]` | 基础扩展；传 `false` 表示不注入（由你自行提供，如 StarterKit）          |
| `extensions`        | `Extensions`              | `[]`                                               | 追加的扩展，用于加粗、列表等能力                                        |
| `editable`          | `boolean`                 | `true`                                             | 是否可编辑，可动态切换                                                  |
| `disabled`          | `boolean`                 | `false`                                            | 是否禁用：置灰且不可聚焦（优先级高于 `editable`）                       |
| `autofocus`         | `boolean`                 | `false`                                            | 挂载后聚焦到内容末尾                                                    |
| `submitOnEnter`     | `boolean`                 | `false`                                            | Enter（不含 Shift）时派发 `submit` 并阻止换行                           |
| `minRows`           | `number`                  | —                                                  | 编辑区最小行数，不足时按此高度展示                                      |
| `maxRows`           | `number`                  | —                                                  | 编辑区最大行数，超过后出现滚动条                                        |
| `minHeight`         | `string \| number`        | `96px`                                             | 编辑区最小高度（显式设置时优先于 `minRows`）                            |
| `maxHeight`         | `string \| number`        | —                                                  | 编辑区最大高度（显式设置时优先于 `maxRows`）                            |
| `emptyText`         | `string`                  | `无匹配结果`                                       | 候选面板的默认空状态文案（可被单个触发符覆盖）                          |
| `mentionClass`      | `string`                  | `''`                                               | 追加到文内提及节点上的 class                                            |
| `extraAttributes`   | `MentionAttributes`       | —                                                  | 追加到 mention 节点的自定义属性声明                                     |
| `mentionRenderHtml` | `MentionRenderHTML`       | —                                                  | 自定义提及块（选中后的节点）的 HTML 结构                                |
| `mentionRenderText` | `MentionRenderText`       | —                                                  | 自定义提及块的文本化规则                                                |
| `valueFormat`       | `'text' \| 'html'`        | `'text'`                                           | 值格式：默认文本（`@ + id`）；需要富文本时改为 `'html'`                 |
| `textValue`         | `MentionTextValueOptions` | —                                                  | 文本值的解析 / 序列化规则（`token` / `resolve` / `allowedPrefixes` 等） |
| `mentionPool`       | `MentionItem[]`           | —                                                  | 资源池；传入后池中不存在的提及会被自动清理                              |
| `pruneMentions`     | `boolean`                 | `true`                                             | 是否随 `mentionPool` / 外部内容变化自动清理失效提及                     |

## 详细说明

### `modelValue`

- 默认类型：`string`（纯文本，提及写成 `@ + id`）
- 双向绑定；外部修改时会与编辑器当前内容比对，内容相同则不重置，避免光标跳动。
- 需要富文本时设 `valueFormat: 'html'`：此时内容以 HTML 与编辑器互传，未知包裹会丢失，建议始终提交编辑器输出的 HTML。
- 无论哪种格式，HTML / Markdown / JSON 都属于**扩展输出**：`getHTML()` / `getMarkdown()` / `getJSON()`，详见 [data-persistence](../guide/data-persistence.md)。

### `textValue`

文本值（默认格式）的解析 / 序列化规则：

| 字段              | 默认值   | 说明                                                                              |
| ----------------- | -------- | --------------------------------------------------------------------------------- |
| `token`           | `'id'`   | 提及在文本里用什么：`'id'`（`@u1`，稳定可往返）/ `'label'`（`@张三`，值直接可读） |
| `resolve`         | —        | token → 候选项；`token: 'label'` 时还负责把 label 换回真实 `id`                   |
| `blockSeparator`  | `'\n'`   | 段落分隔符                                                                        |
| `tokenPattern`    | `'\S+'`  | 触发符之后 token 的正则（不含触发符）                                             |
| `renderMention`   | `@ + id` | 自定义「节点 → 文本」的写法（优先级高于 `token`）                                 |
| `allowedPrefixes` | `[' ']`  | 解析时触发符前允许出现的字符；`null` 不限制                                       |

```vue
<!-- 值直接可读：@张三；回显时用 label 换回真实 id -->
<MentionEditor
  v-model="value"
  :triggers="triggers"
  :text-value="{ token: 'label', resolve: (token) => members.find((m) => m.label === token) }"
/>
```

> 只想在某一处拿到另一种形态时不用改配置：`editorRef.value?.getText({ token: 'id' })`。

### `placeholder`

空内容时展示的占位内容，支持三种写法：

```vue
<!-- ① 字符串 -->
<MentionEditor placeholder="说点什么…" />

<!-- ② VNode：可以放行内块组件（kbd、图标、徽标……） -->
<MentionEditor :placeholder="h('span', null, ['按 ', h('kbd', null, '@'), ' 提及'])" />

<!-- ③ 插槽：任意组件 -->
<MentionEditor>
  <template #placeholder>
    <MyPlaceholder />
  </template>
</MentionEditor>
```

- 由组件自身的浮层实现（不依赖 Tiptap Placeholder 扩展），内容非空时自动隐藏，`pointer-events: none` 不影响点击聚焦；
- `disabled` 时占位内容会自动隐藏；
- 样式变量：`--vme-placeholder-color`。

示例：[占位内容](../../dev/examples/PlaceholderExample.vue)

### `disabled` 与 `editable`

| 配置                    | 表现                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `editable`（默认 true） | 正常编辑                                                   |
| `editable="false"`      | 只读：可选中复制，不可输入                                 |
| `disabled`              | 禁用：置灰、`not-allowed`、不可聚焦；优先级高于 `editable` |

```vue
<MentionEditor :editable="canEdit" :disabled="loading" v-model="content" />
```

实例方法（如 `insertMention`）在禁用态下仍可调用，如需完全锁住请同时关闭调用入口。

### `minRows` / `maxRows` 与 `minHeight` / `maxHeight`

```vue
<!-- 最少 2 行、最多 5 行：不足 2 行时保持 2 行高，超过则自动擑开，超过 5 行滚动 -->
<MentionEditor v-model="content" :min-rows="2" :max-rows="5" />
```

- 行数按编辑区**实际计算行高**（含字体大小、行高与内边距）换算成像素，主题改字体后依然准确；
- 显式传入 `minHeight` / `maxHeight` 时以其为准；
- 都不传则最小高度为 `96px`，无最大高度。

示例：[按行数自适应高度](../../dev/examples/RowsExample.vue)

### `mentionPool` / `pruneMentions`

传入资源池后，池中已不存在的提及会在「池变化」或「外部恢复内容」时被自动清理（连同其后一个空格），用于「删掉已上传文件后内容里的 @ 一并消失」：

```vue
<MentionEditor v-model="value" :mention-pool="resources" />
```

更多见 [AI 资源提及](../guide/ai-resources.md#四删除已上传文件时的联动清理)。

### `triggers`

```ts
const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members, debounce: 300 },
  { char: "#", label: "标签", items: tags },
];
```

完整的触发符选项见 [MentionTrigger](./types.md#mentiontrigger)。

### `baseExtensions` 与 `extensions`

默认基础节点集为 `Document` / `Paragraph` / `Text` / `HardBreak`（Shift + Enter 换行）/ `UndoRedo`，组件额外自动注入 `Mention`（提及节点 + 候选面板）与内置占位内容。

```vue
<!-- 1. 默认：够用即省心 -->
<MentionEditor v-model="content" :triggers="triggers" />

<!-- 2. 追加能力（保留默认基础节点）-->
<MentionEditor v-model="content" :triggers="triggers" :extensions="[Underline]" />

<!-- 3. 完全接管基础节点（例如 StarterKit）-->
<MentionEditor
  v-model="content"
  :triggers="triggers"
  :base-extensions="false"
  :extensions="[StarterKit]"
/>
```

> 注意：`extensions` 里不要再重复引入 `Mention`，否则会出现重复节点名警告。

### `submitOnEnter`

- 面板展开时，Enter 优先交给面板（选择候选项），`submit` 不会触发。
- 输入法组词状态（`isComposing`）下不会触发 `submit`。
- 想保留换行行为时不要开启该属性，改用 `Shift + Enter` 语义或自定义按钮。

### `minHeight` / `maxHeight`

```vue
<MentionEditor :min-height="120" :max-height="'40vh'" />
```

数字会被转换为 `px`，字符串原样使用。高度作用在编辑区（`.vme-content`）上。

### `mentionHover` / `#mention-tip`

编辑区内的提及块支持悬浮提示（hover card）。组件只负责**命中检测、延迟、定位与「移入浮层不关闭」**，显示什么完全由 `#mention-tip` 插槽决定：

```vue
<MentionEditor v-model="value" :triggers="triggers" :mention-hover="{ delay: 120 }">
  <template #mention-tip="{ attrs, id, label, trigger, hide }">
    <img v-if="attrs.kind === 'image'" :src="String(attrs.preview)" style="width: 200px" />
    <video v-else-if="attrs.kind === 'video'" :src="String(attrs.preview)" controls />
    <p v-else>{{ label }}</p>
  </template>
</MentionEditor>
```

- 不提供插槽（或 `mention-hover="false"`）时完全不注册监听，零开销；
- 可选配置：`{ delay, hideDelay, placement, offset, container }`；
- 浮层默认挂到 `body`（可用 `container` 改），定位使用 Floating UI（自动翻转 / 跟随滚动）；
- 鼠标从提及块移入浮层不会关闭，因此可以在浮层里播放视频 / 音频。

完整示例：[资源提及（媒体预览）](../../dev/examples/AiResourceExample.vue)、[技能引用](../../dev/examples/AiSkillExample.vue)、[长文本引用](../../dev/examples/AiTextRefExample.vue)

### `extraAttributes`

```ts
import type { MentionAttributes } from "vue-mention-editor";

const extraAttributes: MentionAttributes = {
  avatar: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-avatar"),
    renderHTML: (attrs) => ({ "data-avatar": attrs.avatar }),
  },
};
```

详见 [数据与持久化](../guide/data-persistence.md#保存自定义字段-extraattributes)。

## 相关

- [事件](./events.md)
- [插槽与实例方法](./slots-methods.md)
- [类型定义](./types.md)
