# 快速开始

## 安装

```bash
npm install vue-mention-editor
# 或
pnpm add vue-mention-editor
# 或
bun add vue-mention-editor
```

组件依赖 Vue 3.5+ 与 Tiptap 3.x（作为组件自身的依赖自动安装，无需你手动添加）。若你的项目本身也使用 Tiptap，请保证版本在 3.x。

## 引入样式

组件的结构样式（编辑区、提及节点、候选面板）以独立 CSS 文件发布，需要显式引入一次：

```ts
// main.ts
import "vue-mention-editor/style.css";
```

> 只引入一次即可。若你使用按需加载/自动导入，样式同样只需在入口引入。
>
> 在本地 playground 中由 Vite 从 SFC 自动注入，因此 `dev/` 里的示例仍保留这行导入，以保证示例源码与真实用法一致。

## 最小可用示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionItem, MentionTrigger } from "vue-mention-editor";

const content = ref("输入 @ 试试提及");

const members: MentionItem[] = [
  { id: "u1", label: "张三", description: "zhangsan@example.com" },
  { id: "u2", label: "李四", description: "lisi@example.com" },
];

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];
</script>

<template>
  <MentionEditor
    v-model="content"
    :triggers="triggers"
    placeholder="输入 @ 提及成员"
    :min-height="96"
  />

  <!-- 输出（默认文本值）：输入 @ 试试提及 @u1 -->
  <pre>{{ content }}</pre>
</template>
```

完整可运行版本：[dev/examples/BasicExample.vue](../../dev/examples/BasicExample.vue)

## 两种使用方式

```ts
// 1. 按需引入（推荐）
import { MentionEditor } from "vue-mention-editor";

// 2. 作为插件全局注册，模板中直接用 <MentionEditor /> 与 <MentionList />
import VueMentionEditor from "vue-mention-editor";
app.use(VueMentionEditor);
```

## 关键行为说明

| 行为          | 说明                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 触发条件      | 默认只在**行首或空格之后**输入触发符才会弹出面板，可用 `allowedPrefixes` 调整（见 [触发符](./triggers.md)）                                                      |
| 插入内容      | 选中候选项后插入一个 `mention` 节点，并自动补一个空格，便于继续输入                                                                                              |
| Enter 的角色  | 面板展开时 Enter 用于选择候选项；未展开时若开启了 `submitOnEnter` 才会触发 `submit`                                                                              |
| Shift + Enter | 换行（默认基础扩展已包含 `HardBreak`）                                                                                                                           |
| v-model 同步  | 外部修改 `modelValue` 时会与编辑器内容比对，内容一致则不重置（避免光标跳动）                                                                                     |
| 提及节点      | 是一个原子行内节点（`atom: true`），光标不会进入其中，退格可整体删除                                                                                             |
| 高度          | 可用 `min-rows` / `max-rows` 按行数控制（超出最大行数出现滚动条），也可直接用 `min-height` / `max-height`                                                        |
| 占位内容      | `placeholder` 支持字符串、VNode 行内块与 `#placeholder` 插槽，非空时自动隐藏                                                                                     |
| 禁用          | `disabled` 置灰且不可聚焦；`editable="false"` 只读可复制                                                                                                         |
| 值格式        | 默认纯文本（v-model 是可直接提交的字符串）；需要富文本时用 `value-format="html"`，HTML / Markdown / JSON 则用 `getHTML()` / `getMarkdown()` / `getJSON()` 随时取 |

## SSR / Nuxt

组件内部使用 Tiptap 的 `EditorContent` 与 `VueRenderer`，都依赖浏览器环境。在 Nuxt 中请仅在客户端渲染：

```vue
<template>
  <ClientOnly>
    <MentionEditor v-model="content" :triggers="triggers" />
  </ClientOnly>
</template>
```

或在 `.client.vue` 后缀的组件中使用。

## 下一步

- [触发符与数据源](./triggers.md)：接入接口、防抖与请求中断
- [外观定制](./customizing.md)：换肤、自定义候选项与提及块
- [数据与持久化](./data-persistence.md)：把提及存起来并在回显时还原
- [AI 资源提及](./ai-resources.md)：值为 `@ + src`、删除文件联动清理
