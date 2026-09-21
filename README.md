# vue-mention-editor

[![CI](https://github.com/alon-wu/vue-mention-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/alon-wu/vue-mention-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

基于 **Tiptap 3 + Vue 3 + TypeScript** 的提及（@mention）编辑器组件，可直接通过 npm 安装到 Vue 项目中使用。

## 特性

- **默认就是纯文本**：v-model 直接是可以提交给后端 / 大模型的字符串（提及写成 `@ + id`）；只有需要保留富文本时才用 `valueFormat: 'html'`，而 HTML / Markdown / JSON 随时用 `getHTML()` / `getMarkdown()` / `getJSON()` 取
- **多触发符**：`@` 提及成员、`#` 插入标签……同一编辑器内自由组合
- **数据源灵活**：静态数组或异步函数，内置防抖、查询串中断（`AbortSignal`）、自定义过滤
- **面板定位托管**：由 tiptap suggestion 的 `mount()`（Floating UI）负责，滚动 / 缩放 / 空间不足自动跟随与翻转
- **占位内容可组件化**：`placeholder` 支持字符串、VNode（行内块 `kbd` / 图标）与 `#placeholder` 插槽
- **高度按行自适应**：`minRows` / `maxRows` 控制最小与最大行数，不足保持、超出擑开、超过滚动
- **禁用与只读**：`disabled` 置灰不可聚焦，`editable=false` 保留选中复制
- **样式与结构全可定制**：`#item` / `#empty` 插槽、`popupClass`、`mentionRenderHtml`（提及块结构）、内置胶囊样式 `vme-mention--pill`、`--vme-*` 主题变量
- **AI 资源场景**：`@` 上传的图片 / 视频 / 音频 / 文件，值是 `@ + src` 纯文本；删除已上传文件时自动清理内容中对应提及，并可根据绑定值完整恢复（含异步数据到位后的补齐）
- **悬浮预览**：提供 `#mention-tip` 插槽即可为任意提及块加悬浮提示（图片等比、视频/音频 16:9 可播放、长文本滚动查看），命中与定位由组件负责
- **引用数量上限**：`triggers[].limit` 声明上限（如技能只能选一个），超出时自动替换已有引用，面板选择与程序化插入均生效
- **v-model 双向绑定**，同时暴露 `ref` 方法（聚焦、插入 / 清理提及、清空、取 HTML / JSON 等）
- 库以 ESM + CJS 双格式发布，自带类型声明；`vue` 与所有 `@tiptap/*` 均外部化，不会产生重复实例

## 文档与示例

在线地址（GitHub Pages，随 `main` 自动更新）：

- 示例画廊：<https://alon-wu.github.io/vue-mention-editor/> —— 18 个可交互示例，地址栏 `#01`–`#18` 可深链到具体示例
- 文档站：<https://alon-wu.github.io/vue-mention-editor/docs/>

| 入口                                             | 内容                                           |
| ------------------------------------------------ | ---------------------------------------------- |
| [文档总览](./docs/README.md)                     | 指南 + API 参考 + FAQ 目录                     |
| [快速开始](./docs/guide/getting-started.md)      | 安装、样式引入、最小示例、SSR                  |
| [触发符与数据源](./docs/guide/triggers.md)       | 多触发符、异步数据源、防抖与请求中断、面板方位 |
| [外观定制](./docs/guide/customizing.md)          | `#item` 插槽、CSS 变量主题、完全自绘面板       |
| [数据与持久化](./docs/guide/data-persistence.md) | HTML 结构、`extraAttributes`、回显与表单集成   |
| [AI 资源提及](./docs/guide/ai-resources.md)      | 值为 `@+src`、上传文件删除联动、根据绑定值恢复 |
| [场景配方](./docs/guide/recipes.md)              | 聊天输入、富文本组合、弹窗内使用、外部按钮插入 |
| [API 参考](./docs/api/props.md)                  | Props / 事件 / 插槽与方法 / 类型 / 底层扩展    |
| [常见问题](./docs/faq.md)                        | 面板不弹出、样式不生效、IME、版本冲突……        |

本地 `bun run dev` 后打开的 playground 提供 **18 个可运行示例**（入门 → 外观定制 → 交互与状态 → 集成与持久化 → AI 场景，编号 01–18）：每个示例下方都有 **用法速览**，说明它绑定了什么值、触发了什么事件、用到哪些 props / 插槽 / ref 方法 / 设计令牌，以及效果是怎么实现的；源码可一键展开（`?raw` 实时读取，不会与实现脱节）。

站点构建：`bun run build:site`（示例画廊 + 文档站 → `dist-site/`，与线上完全一致）；单独调文档用 `bun run docs:dev`。

## 安装

```bash
npm install vue-mention-editor
# 或
bun add vue-mention-editor
```

要求：`vue >= 3.5`；Tiptap 3.x 依赖（`@tiptap/core`、`@tiptap/vue-3` 等）会随组件一并安装。

## 快速开始

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionItem, MentionTrigger } from "vue-mention-editor";
import "vue-mention-editor/style.css";

const content = ref("输入 @ 试试提及成员");

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员",
    debounce: 200,
    // 异步数据源：query 变化会自动中断上一次请求
    items: async ({ query, signal }) => {
      const res = await fetch(`/api/members?kw=${encodeURIComponent(query)}`, {
        signal,
      });
      return (await res.json()) as MentionItem[];
    },
  },
  {
    char: "#",
    label: "插入标签",
    items: [
      { id: "t1", label: "前端", description: "12 篇文档" },
      { id: "t2", label: "后端", description: "8 篇文档" },
    ],
  },
];
</script>

<template>
  <MentionEditor
    v-model="content"
    :triggers="triggers"
    placeholder="输入 @ 提及成员，输入 # 插入标签"
    :min-height="120"
    :max-height="280"
    submit-on-enter
    @submit="({ text, html }) => console.log(text, html)"
    @mention:select="({ item, trigger }) => console.log(trigger, item)"
  />
</template>
```

## Props

| 属性                | 类型                             | 默认值                                             | 说明                                                                   |
| ------------------- | -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `modelValue`        | `string`                         | `''`                                               | 编辑器内容（v-model）：默认纯文本（提及为 `@ + id`）                   |
| `placeholder`       | `string \| VNodeChild`           | `''`                                               | 占位内容：字符串 / VNode 行内块 / `#placeholder` 插槽                  |
| `triggers`          | `MentionTrigger[]`               | `[{ char: '@', items: [] }]`                       | 触发符配置，见下表                                                     |
| `baseExtensions`    | `Extensions \| false`            | `[Document, Paragraph, Text, HardBreak, UndoRedo]` | 基础扩展；传 `false` 则自行提供（如配合 StarterKit）                   |
| `extensions`        | `Extensions`                     | `[]`                                               | 追加扩展（加粗、列表等能力自行添加）                                   |
| `editable`          | `boolean`                        | `true`                                             | 是否可编辑                                                             |
| `disabled`          | `boolean`                        | `false`                                            | 是否禁用：置灰且不可聚焦（优先级高于 `editable`）                      |
| `autofocus`         | `boolean`                        | `false`                                            | 挂载后聚焦到末尾                                                       |
| `submitOnEnter`     | `boolean`                        | `false`                                            | Enter（不含 Shift）触发 `submit`；候选面板展开时自动让位给面板         |
| `minRows`           | `number`                         | —                                                  | 编辑区最小行数（不足时保持该高度）                                     |
| `maxRows`           | `number`                         | —                                                  | 编辑区最大行数（超过后滚动）                                           |
| `minHeight`         | `string \| number`               | `96px`                                             | 编辑区最小高度，数字按 px 处理（优先于 `minRows`）                     |
| `maxHeight`         | `string \| number`               | —                                                  | 超出后编辑区滚动（优先于 `maxRows`）                                   |
| `emptyText`         | `string`                         | `无匹配结果`                                       | 候选面板空状态文案                                                     |
| `mentionClass`      | `string`                         | `''`                                               | 追加到文内提及节点上的 class                                           |
| `extraAttributes`   | `MentionAttributes`              | —                                                  | 追加到 mention 节点的自定义属性（见下方“保存自定义字段”）              |
| `mentionRenderHtml` | `MentionRenderHTML`              | —                                                  | 自定义提及块（选中后）的 HTML 结构                                     |
| `mentionRenderText` | `MentionRenderText`              | —                                                  | 自定义提及块的文本化规则                                               |
| `valueFormat`       | `'text' \| 'html'`               | `'text'`                                           | 值格式：默认文本（`@ + id`）；需要富文本时设 `'html'`                  |
| `textValue`         | `MentionTextValueOptions`        | —                                                  | 文本值规则：`token`（`id` / `label`）、`resolve`、`allowedPrefixes` 等 |
| `mentionPool`       | `MentionItem[]`                  | —                                                  | 资源池；池中被删除的项会自动从内容里清理                               |
| `pruneMentions`     | `boolean`                        | `true`                                             | 是否随资源池 / 外部内容变化自动清理失效提及                            |
| `mentionHover`      | `boolean \| MentionHoverOptions` | —                                                  | 提及块悬浮提示配置（配合 `#mention-tip` 插槽）                         |

### MentionTrigger

| 字段              | 类型                                                                  | 说明                                                |
| ----------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `char`            | `string`                                                              | 触发字符，如 `@`、`#`                               |
| `items`           | `MentionItem[] \| ((ctx) => MentionItem[] \| Promise<MentionItem[]>)` | 数据源                                              |
| `label`           | `string`                                                              | 面板头部标题                                        |
| `emptyText`       | `string`                                                              | 覆盖全局空状态文案                                  |
| `allowSpaces`     | `boolean`                                                             | 允许查询串包含空格                                  |
| `allowedPrefixes` | `string[] \| null`                                                    | 触发符前的合法字符，默认 `[' ']`；`null` 表示不限制 |
| `minQueryLength`  | `number`                                                              | 最少输入字符数后才查询                              |
| `debounce`        | `number`                                                              | 异步查询防抖毫秒数                                  |
| `placement`       | `'bottom-start' \| 'top-start' \| ...`                                | 面板弹出方位                                        |
| `offset`          | `{ mainAxis?: number; crossAxis?: number }`                           | 面板偏移                                            |
| `container`       | `string \| HTMLElement`                                               | 面板挂载容器，弹窗内使用时应指向弹窗内部            |
| `popupClass`      | `string`                                                              | 面板根元素追加的 class（按触发符定制样式）          |
| `filter`          | `(item, query) => boolean`                                            | 自定义过滤（默认匹配 `label`/`id`/`description`）   |

`MentionItem`：`{ id: string; label: string; avatar?: string; description?: string; [key: string]: unknown }`

## 事件

| 事件                       | 载荷                                           | 说明                                             |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `update:modelValue`        | `value: string`                                | v-model 更新（默认文本，`valueFormat` 决定格式） |
| `change`                   | `{ value, html, text, json, editor, isEmpty }` | 内容变化（`html` 为扩展输出，随时可取）          |
| `mention:select`           | `{ item, trigger, editor }`                    | 选中某个候选项                                   |
| `submit`                   | `{ value, html, text, json, editor, isEmpty }` | `submitOnEnter` 触发                             |
| `ready` / `focus` / `blur` | `editor: Editor`                               | 生命周期                                         |

## 插槽

```vue
<MentionEditor v-model="content" :triggers="triggers">
  <template #item="{ item, index, query, selected, trigger }">
    <div class="my-item" :class="{ active: selected }">
      <img :src="item.avatar" />
      <span>{{ item.label }}</span>
    </div>
  </template>
</MentionEditor>
```

`#item` 未提供时使用内置样式（头像 + 主标题 + 描述）。此外：

- `#empty`：自定义候选面板空状态
- `#placeholder`：自定义占位内容（也可直接给 `placeholder` 传字符串或 VNode）
- `#mention-tip`：编辑区内提及块的悬浮提示（图片 / 视频 / 音频预览、完整技能名、长文本等）

## ref 方法

```ts
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);

editorRef.value?.editor; // tiptap Editor | undefined
editorRef.value?.focus();
editorRef.value?.blur();
editorRef.value?.clear();
editorRef.value?.setContent("hi");
editorRef.value?.getHTML(); // 扩展输出：'<p>hi</p>'
editorRef.value?.getText(); // 可读文本：'@张三'
editorRef.value?.getText({ token: "id" }); // 与 v-model 一致：'@u1'
editorRef.value?.getMarkdown(); // 扩展输出：Markdown
editorRef.value?.getJSON();
editorRef.value?.insertMention({ id: "u1", label: "张三" }); // 也可传第二个参数指定触发符
editorRef.value?.getMentions(); // 内容中全部提及节点的属性
editorRef.value?.removeMentions(["/uploads/a.png"]); // 或传 (attrs) => boolean
editorRef.value?.refreshMentions(); // 按 resolve 补齐展示字段（绑定值先到、资源后到时）
```

## 输出结构与自定义字段

默认情况下 v-model 就是纯文本（如 `你好 @u1 请查收`）；需要落库或渲染富文本时再用 `getHTML()` 取 HTML（`getMarkdown()` 取 Markdown）。HTML 结构如下：

```html
<p>
  你好
  <span class="vme-mention" data-type="mention" data-id="u1" data-label="张三">@张三</span>
  请查收
</p>
```

需要把 `items` 里的额外字段（如头像）一起存进文档时，用 `extraAttributes` 声明节点属性：

```ts
const extraAttributes = {
  avatar: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-avatar"),
    renderHTML: (attrs: Record<string, unknown>) => ({
      "data-avatar": attrs.avatar,
    }),
  },
};
```

```vue
<MentionEditor v-model="content" :triggers="triggers" :extra-attributes="extraAttributes" />
```

## 样式与主题

样式系统分两层：**基础令牌**（调色板 / 间距 / 圆角）与**语义令牌**（组件真正读取的变量）。定制主题只需覆盖语义令牌：

```css
/* 局部换肤：直接改语义令牌 */
.my-form {
  --vme-bg: #fff;
  --vme-border-color: #e5e7eb;
  --vme-radius: 8px;
  --vme-mention-bg: #eef2ff;
  --vme-mention-color: #4f46e5;
  --vme-popup-bg: #fff;
}
```

内置深色预设，给容器加 `data-vme-theme="dark"` 即可（候选面板挂在 `body` 下，配合 `trigger.container` 指向该容器）：

```html
<div class="my-scope" data-vme-theme="dark">…</div>
```

```ts
const triggers: MentionTrigger[] = [{ char: "@", items: members, container: ".my-scope" }];
```

完整令牌清单见 [外观定制 · 设计令牌](./docs/guide/customizing.md#三设计令牌css-变量)，
可运行示例见 [ThemingExample](../../dev/examples/ThemingExample.vue)。

## 本地开发与构建

```bash
bun install
bun run dev        # 启动 playground（http://localhost:5173）
bun run test       # vitest 单元 + 组件测试（131 个用例）
bun run test:watch # 监听模式
bun run typecheck  # vue-tsc 类型检查（含 src / dev / tests）
bun run build      # 类型检查 + 构建 dist（ESM + CJS + CSS + 类型）
bun run format     # prettier 统一风格
```

发布：`npm publish`（`prepublishOnly` 会自动执行构建），包内仅包含 `dist`。

## 测试

测试运行在 **vitest + jsdom + @vue/test-utils** 上，无需启动浏览器：

| 测试文件                                            | 覆盖内容                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `tests/unit/value.spec.ts`                          | 文本值序列化 / 解析、往返一致性、触发符前缀规则、自定义分隔符与 token 规则                    |
| `tests/unit/markdown.spec.ts`                       | Markdown 扩展输出：段落 / 标题 / 列表 / 引用 / 代码块 / 标记 / 硬换行 / 提及                  |
| `tests/unit/mention-extension.spec.ts`              | 数据源解析（数组 / 异步 / 中断 / 异常）、扩展选项透传、自定义属性与渲染                       |
| `tests/components/MentionList.spec.ts`              | 键盘导航、鼠标选择、空/加载态、插槽渲染、popupClass                                           |
| `tests/components/MentionEditor.spec.ts`            | v-model 双向、默认文本格式与 HTML 扩展格式、占位内容、只读/禁用、高度换算、实例方法与资源清理 |
| `tests/components/MentionEditor.suggestion.spec.ts` | 真实交互链路：输入触发符 → 面板 → 键盘/鼠标选择 → 插入与关闭面板                              |
| `tests/components/MentionEditor.limit.spec.ts`      | `triggers[].limit` 的上限与替换语义                                                           |
| `tests/components/MentionEditor.tip.spec.ts`        | 悬浮提示：命中检测、延迟、移入浮层不关闭、自定义容器                                          |
| `tests/components/MentionEditor.restore.spec.ts`    | 按绑定值恢复：挂载 / 手动 `refreshMentions()` / 资源池变化自动补齐                            |
| `tests/components/MentionEditor.keyboard.spec.ts`   | 删除手感：Backspace / Delete 一键删除提及、不误吞相邻提及                                     |
| `tests/components/MentionEditor.props.spec.ts`      | 属性细节：autofocus 透传、mentionClass、mentionRenderText、baseExtensions、allowSpaces        |

```bash
bun run test                      # 全部用例
bun run test -- tests/unit        # 只跑单元测试
bun run test -- -t "insertMention" # 按名称过滤
```

## 目录结构

```
src/
├── components/
│   ├── MentionEditor.vue   # 主组件：编辑器 + 扩展装配 + 事件桥接
│   └── MentionList.vue     # 默认候选面板（键盘导航、空状态、插槽渲染）
├── core/
│   ├── suggestionRenderer.ts # 面板渲染器：VueRenderer + 定位托管
│   ├── value.ts            # 文本值序列化 / 解析（默认值格式）
│   └── markdown.ts         # Markdown 扩展输出
├── extensions/
│   └── mention.ts          # mention 扩展工厂（多触发符、数据源解析、自定义结构）
├── styles/tokens.css       # 设计令牌（基础层 + 语义层 + 深色预设）
├── types/index.ts          # 全部对外类型
└── index.ts                # 库入口 + Vue 插件安装
dev/                        # playground（示例画廊）
├── App.vue                 # 侧边栏导航 + 示例渲染
├── examples/               # 18 个可运行示例 + usage 元信息 + ?raw 源码展示
├── components/             # ExampleCard / CodeBlock
├── style.css               # 演示页设计令牌
docs/                       # 文档：guide / api / faq
tests/                      # vitest 单元 + 组件测试
```

## 路线图

- [ ] 提及节点的悬浮卡片 / 点击回调（NodeView）
- [ ] 字符数统计与 `maxlength`（CharacterCount）
- [ ] 面板分组与「最近使用」置顶
- [ ] 端到端测试（Playwright）覆盖更多浏览器差异

## 其它

- [完整文档](./docs/README.md)
- [常见问题](./docs/faq.md)
- [更新日志](./CHANGELOG.md)
- [贡献指南](./CONTRIBUTING.md)
- [MIT License](./LICENSE)
