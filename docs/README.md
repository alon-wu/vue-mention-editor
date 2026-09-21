# vue-mention-editor 文档

基于 **Tiptap 3 + Vue 3 + TypeScript** 的提及（@mention）编辑器组件。

## 目录

### 指南

| 文档                                        | 内容                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| [快速开始](./guide/getting-started.md)      | 安装、引入样式、最小可用示例、SSR / Nuxt 注意事项                  |
| [触发符与数据源](./guide/triggers.md)       | 多触发符、静态与异步数据源、防抖、请求中断、自定义过滤、面板方位   |
| [外观定制](./guide/customizing.md)          | `#item` 插槽、提及块结构、CSS 变量主题、面板结构，以及完全自绘面板 |
| [数据与持久化](./guide/data-persistence.md) | v-model 输出的 HTML 结构、`extraAttributes` 自定义字段、回显与提交 |
| [AI 资源提及](./guide/ai-resources.md)      | 值为 `@+src`、上传资源删除联动、根据绑定值恢复、媒体悬浮预览       |
| [场景配方](./guide/recipes.md)              | 聊天输入框、评论框、富文本组合、弹窗内使用、外部按钮插入、表单集成 |

### API 参考

| 文档                                     | 内容                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| [Props](./api/props.md)                  | `MentionEditor` 全部属性与默认值                                                 |
| [事件](./api/events.md)                  | 事件列表与载荷类型                                                               |
| [插槽与实例方法](./api/slots-methods.md) | `#item` / `#empty` / `#placeholder` / `#mention-tip` 插槽、通过 `ref` 调用的方法 |
| [类型定义](./api/types.md)               | `MentionItem`、`MentionTrigger`、事件载荷等                                      |
| [扩展与底层能力](./api/extensions.md)    | `createMentionExtension`、`createSuggestionRenderer`、插件安装                   |

### 其它

- [常见问题 FAQ](./faq.md)
- [更新日志](../CHANGELOG.md)
- [贡献指南](../CONTRIBUTING.md)

## 可运行的完整示例

在线示例：<https://alon-wu.github.io/vue-mention-editor/>（随 `main` 自动更新，地址栏 `#01`–`#18` 可深链到具体示例）。本地 `dev/` 是同一套 playground（`bun run dev` 后访问 http://localhost:5173），共 **18 个示例**，按 `01`–`18` 编号、五组排列。

每个示例都包含三部分：

1. **可交互的 Demo** —— 直接操作，看行为；
2. **用法速览** —— 绑定了什么值、触发了什么事件、用到了哪些 props / 插槽 / ref 方法 / 触发符配置 / 设计令牌，以及「这个效果是怎么来的」；
3. **源码**（`?raw` 实时读取，永远与实现一致）。

### 01–03 · 入门

| #   | 示例                                                 | 讲什么                                     | 关键 API / 事件                                                            |
| --- | ---------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| 01  | [基础用法](../dev/examples/BasicExample.vue)         | 最小可用：触发符 + 静态数据源 + 默认文本值 | `v-model`、`triggers[].items`、`text-value`、`getHTML()` / `getMarkdown()` |
| 02  | [多触发符](../dev/examples/MultiTriggerExample.vue)  | `@` / `#` / `/` 共存                       | `triggers[].char`、`@mention:select`                                       |
| 03  | [异步数据源](../dev/examples/AsyncSourceExample.vue) | 防抖、请求中断、服务端过滤                 | `items: async ({ query, signal })`、`debounce`、`minQueryLength`           |

### 04–08 · 外观定制

| #   | 示例                                                       | 讲什么                               | 关键 API / 令牌                                            |
| --- | ---------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| 04  | [占位内容](../dev/examples/PlaceholderExample.vue)         | 字符串 / VNode 行内块 / 插槽三种占位 | `placeholder`、`#placeholder`                              |
| 05  | [按行数自适应高度](../dev/examples/RowsExample.vue)        | 最小行、自动撑开、最大行滚动         | `min-rows` / `max-rows`、`@change`、`getText()`            |
| 06  | [自定义提及块结构](../dev/examples/MentionChipExample.vue) | chip 结构：图标 + 文件名 + 体积      | `mention-render-html`、`extra-attributes`                  |
| 07  | [自定义候选项](../dev/examples/CustomItemSlot.vue)         | 候选项结构、关键词高亮               | `#item`（`item / query / selected`）、`popupClass`         |
| 08  | [主题与 CSS 变量](../dev/examples/ThemingExample.vue)      | 明暗换肤、面板跟随容器令牌           | `data-vme-theme="dark"`、`--vme-*`、`triggers[].container` |

### 09–12 · 交互与状态

| #   | 示例                                                           | 讲什么                         | 关键 API / 事件                                                                                 |
| --- | -------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| 09  | [聊天输入框](../dev/examples/ChatInputExample.vue)             | Enter 发送、Shift+Enter 换行   | `submit-on-enter`、`@submit`、`clear()`                                                         |
| 10  | [只读与自动聚焦](../dev/examples/EditableExample.vue)          | 只读展示、挂载聚焦、重新聚焦   | `editable`、`autofocus`、`:key`                                                                 |
| 11  | [正常 / 只读 / 禁用](../dev/examples/DisabledExample.vue)      | 三种状态语义差异               | `disabled`（优先级高于 `editable`）                                                             |
| 12  | [通过 ref 操作编辑器](../dev/examples/ProgrammaticExample.vue) | 插入、覆盖、清空、取值全量演示 | `insertMention` / `setContent` / `clear` / `getHTML` / `getText` / `getJSON` / `focus` / `blur` |

### 13–15 · 集成与持久化

| #   | 示例                                                             | 讲什么                         | 关键 API / 事件                                                                          |
| --- | ---------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| 13  | [与 StarterKit 组合](../dev/examples/RichTextExample.vue)        | 加粗 / 列表 / 撤销等富文本能力 | `base-extensions="false"`、`extensions`、`value-format="html"`、`editor` 实例            |
| 14  | [自定义字段存进文档](../dev/examples/ExtraAttributesExample.vue) | 头像、邮箱随节点落库           | `value-format="html"`、`extra-attributes`（`parseHTML` / `renderHTML`）、`getMentions()` |
| 15  | [弹窗 / 抽屉内使用](../dev/examples/ModalExample.vue)            | 面板挂载容器与层级             | `triggers[].container`                                                                   |

### 16–18 · AI 场景

| #   | 示例                                                              | 讲什么                                      | 关键 API / 事件                                                   |
| --- | ----------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| 16  | [资源提及（值为 @ + src）](../dev/examples/AiResourceExample.vue) | `@` 图片 / 视频 / 音频 / 文件，媒体悬浮预览 | `text-value`、`mention-pool`、`refreshMentions()`、`#mention-tip` |
| 17  | [技能引用（只能引用一个）](../dev/examples/AiSkillExample.vue)    | `/` 技能、超出自动替换                      | `triggers[].limit`、`onLimit`、`@mention:select`                  |
| 18  | [长文本引用（# 资料片段）](../dev/examples/AiTextRefExample.vue)  | chip 只显示标题、正文悬浮查看               | `mention-hover`、`#mention-tip`、`extra-attributes`               |

> 需求与验收标准见仓库根目录的 [`prompt.txt`](../prompt.txt)。

## 30 秒上手

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import "vue-mention-editor/style.css";

const content = ref("");

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员",
    items: [
      { id: "u1", label: "张三" },
      { id: "u2", label: "李四" },
    ],
  },
];
</script>

<template>
  <MentionEditor v-model="content" :triggers="triggers" placeholder="输入 @ 提及成员" />
</template>
```
