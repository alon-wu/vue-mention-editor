# 常见问题

## 输入 @ 没有弹出面板？

Tiptap suggestion 默认要求触发符出现在**行首或空格之后**（`allowedPrefixes: [' ']`），所以「你好@」不会触发。中文场景通常需要放宽：

```ts
{
  char: "@",
  items: members,
  allowedPrefixes: [" ", "。", "，", "、", "；", "：", "！", "？", "\n", null],
}
```

其中 `null` 代表行首。详见 [触发符与数据源](../guide/triggers.md#触发规则什么时候会弹出面板)。

## 样式没生效 / 提及节点没有高亮？

1. 确认入口引入了样式：`import "vue-mention-editor/style.css";`
2. 候选面板默认挂载在 `document.body` 下：如果你把主题令牌写在局部容器上，面板不会继承。推荐把 `trigger.container` 指向该容器（面板会继承容器上的令牌），或把面板相关令牌写到全局作用域（`:root`、`html.dark`）。
3. 使用 `v-html` 单独渲染历史内容时，同样需要引入该样式文件。

## 中文输入法按回车把消息发出去了？

组件已处理输入法组词状态：`submitOnEnter` 在 `event.isComposing`（或 `keyCode === 229`）时不会触发 `submit`。若你自定义了全局快捷键，也需要加上同样的判断。

## 如何让头像、邮箱等信息随内容一起保存？

用 `extraAttributes` 声明节点属性即可，插入时会自动带上，回显时通过 `parseHTML` 读回。见 [数据与持久化](../guide/data-persistence.md#保存自定义字段-extraattributes)。

## 占位内容可以放组件吗？

可以，三种写法：`placeholder="文案"`、`:placeholder="h('span', ...)"`（可在里面放 `kbd`、图标等行内块）、或使用 `#placeholder` 插槽（推荐，放任意组件）。占位内容由组件自己的浮层渲染，内容非空或 `disabled` 时自动隐藏。

见 [Props：placeholder](../api/props.md#placeholder) 与 [示例](../dev/examples/PlaceholderExample.vue)。

## 怎么控制高度 / 让输入框自动擑开？

用 `min-rows` / `max-rows`：不足最小行数保持最小行高，超过最小行数自动擑开，超过最大行数出现滚动条。行高按编辑区实际计算行高换算，改字体后仍然准确。也可以直接用 `min-height` / `max-height`（优先级更高）。见 [按行数自适应高度示例](../dev/examples/RowsExample.vue)。

## 怎么彻底禁用输入框？

`disabled` 会自动置灰、不可聚焦（优先级高于 `editable`）；只想「不可编辑但可复制」时用 `:editable="false"`。两者对比如见 [示例](../dev/examples/DisabledExample.vue)。

## 怎么自定义「选中后的提及块」结构？

用 `mention-render-html`（配合 `extraAttributes` 声明需要保存的字段）自定义 DOM 结构，例如「缩略图 + 文件名」的资源 chip；只想改样式时重写 `--vme-mention-*` 变量即可。见 [外观定制](../guide/customizing.md#四自定义提及块选中后的节点)。

> 注意属性名写作 `:mention-render-html`（kebab-case），不要写成 `:mention-render-h-t-m-l`。

## AI 项目里想 @ 已上传的图片 / 视频 / 文件，怎么让 v-model 是 `@+src`？

v-model 默认就是文本值：提及会序列化为 `@` + `id`（把 `id` 设为 src 即可），并可通过 `textValue.resolve` 根据 src 还原文件名 / 缩略图。见 [AI 资源提及](../guide/ai-resources.md)。

## 删除已上传的文件后，内容里 @ 过它的地方怎么一并删除？

传入 `mention-pool` 后，资源池变化（或外部恢复内容）时会自动清理池中不存在的引用，同一资源被 @ 多次也会全部删除，并连同后面的空格一起清理；也可手动调用 `removeMentions([src])`。见 [联动清理](../guide/ai-resources.md#四删除已上传文件时的联动清理)。

## 弹窗 / 抽屉里面板位置不对或被裁剪？

把面板挂到弹窗内部，并给容器加相对定位：

```ts
{ char: "@", items: members, container: ".modal-body" }
```

```css
.modal-body {
  position: relative;
  overflow: visible;
}
```

见 [场景配方](../guide/recipes.md#4-弹窗--抽屉内使用)。

## 面板出现在光标下方看不见？

调 `placement: 'top-start'`，或减小 `offset`。面板使用 Floating UI 定位，空间不足时会自动翻转。

## 支持 Nuxt / SSR 吗？

支持，但必须在客户端渲染：用 `<ClientOnly>` 包裹，或使用 `.client.vue` 组件。

## 如何在富文本里保留加粗、列表？

`base-extensions="false"` + 自己传入 `StarterKit`（或其它扩展）。见 [场景配方](../guide/recipes.md#3-与-starterkit-组合成富文本)。

## 能限制最大字符数吗？

当前版本可用 `@change` 自行判断并回滚（见 [与表单集成](../guide/data-persistence.md#与表单集成)）；内置 `maxlength` 在[路线图](../README.md)中。

## 想点击提及节点时打开卡片 / 跳转页面？

当前可用 `editor` 实例监听 DOM 事件并命中 `data-id`（若自定义了 `mention-render-html`，请保留 `data-type="mention"` 与 `data-id`）：

```ts
editor.view.dom.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest('[data-type="mention"]');
  if (target) openUserCard(target.getAttribute("data-id"));
});
```

内置的 NodeView 交互（悬浮卡片、可点击节点）在路线图里。

## 能只用 mention 扩展，不引入整个组件吗？

可以，用 `createMentionExtension` 把提及能力装到你自己的 tiptap 编辑器里，见 [扩展与底层能力](../api/extensions.md)。

## 和官方 `@tiptap/extension-mention` 会冲突吗？

本包基于官方扩展封装。请勿在同一个编辑器里重复注册 `Mention` 或 `Placeholder`（包括通过 `extensions` 属性重复传入），否则会出现重复节点名警告。Tiptap 版本要求 3.x。

## `id` 是数字可以吗？

`MentionItem.id` 声明为 `string`。由于节点属性最终写入 `data-*` 属性（字符串），建议统一用字符串，展示/提交时再按业务转换。

## 支持 Vue 2 吗？

不支持。组件使用 Vue 3 的组合式 API 与 `defineExpose`，仅支持 Vue 3.5+。
