# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **在线示例与文档站（GitHub Pages）**：示例画廊 <https://alon-wu.github.io/vue-mention-editor/> + 文档站 `/docs/`；`bun run build:site` 把两者合并成一个站点，`.github/workflows/deploy-pages.yml` 在 `main` 上自动部署（PR 上只做构建验证）
- **示例画廊支持深链**：地址栏 `#01`–`#18` 对应具体示例，可复制分享；文档里的示例链接也直接指向在线示例
- **文档站的链接改写**：docs 内部链接仍写相对路径（GitHub / 编辑器里照常可用），构建时把「指向 docs 之外」的链接改写成在线示例或 GitHub 源码地址，改写发生在死链检查之前，写错的相对链接依然会拦住构建
- **GitHub Actions CI**：`.github/workflows/ci.yml` —— push 到 `main` / 发起 PR 时自动跑 `format:check` → `typecheck` → `test` → `build`，并把 `dist/` 作为构建产物上传，避免坏代码合入
- **`vme-mention--pill`**：内置的胶囊型提及块类——在 `renderHTML` 的根元素上追加这个类，尺寸 / 内边距 / 圆角 / 垂直对齐都由组件处理，使用者只写配色；自己写固定高度时用 `vertical-align: middle; position: relative; top: -0.12em;`（单个 `vertical-align` 值的参考点是元素自身基线，无法适配所有 chip 结构）
- **文本 token 开关**：`textValue.token: 'id' | 'label'` —— 一处配置即可让 v-model 变成 `@张三` 这样直接可读的形式（回显时 `resolve` 负责换回真实 id，节点里存的仍是 id）；`getText({ token })` / `getMarkdown({ token })` 可随时在两种形态间取值，像 `getHTML()` 一样按需调用
- **Markdown 导出（扩展输出）**：新增实例方法 `getMarkdown()` 与底层 `serializeDocMarkdown()`，覆盖段落 / 标题 / 列表 / 引用 / 代码块 / 行内标记 / 硬换行 / 分割线 / 提及
- **底层导出**：`serializeDocText`、`parseTextToContent`、`serializeDocMarkdown`、`idMentionText`、`defaultRenderMentionText` 从入口导出，便于自己拼数据
- **恢复时机可异步**：新增实例方法 `refreshMentions()`——按 `textValue.resolve` 重新解析文档中的提及并补齐标题 / 缩略图等展示字段，解决「绑定值先到、资源数据后到」时 chip 只显示 src 的问题；传了 `mention-pool` 时资源池变化会自动执行（只补非空字段、不写入撤销历史、不改动 v-model 值）

### Changed

- **默认值格式改为纯文本（破坏性变更）**：`valueFormat` 默认从 `'html'` 改为 `'text'` —— v-model 直接是能提交给后端 / 大模型的字符串（提及写成 `@ + id`）；需要保留富文本时显式写 `value-format="html"`。HTML / Markdown / JSON 改为**扩展输出**，用 `getHTML()` / `getMarkdown()` / `getJSON()` 取
- `--vme-primary-color` 现在真正驱动聚焦边框（`--vme-focused-border-color` 引用它），深色预设只需覆盖这一个值
- 文本值解析默认只认「行首或空格后」的 `@token`（可用 `textValue.allowedPrefixes` 调整），避免把 `zhangsan@example.com` 这类普通文本误判成提及
- 文本格式下不再覆盖 mention 的 `renderText`：`getText()` 与 `editor.getText()` 统一返回可读的 `@ + label`，`id` 只出现在 v-model 与文内 token 中
- **示例与文档体系**：`dev/examples/index.ts` 为每个示例增加 `usage` 元信息（绑定值 / 事件 / props / 插槽 / ref 方法 / `triggers[]` 配置 / 设计令牌 / 实现要点），画廊统一渲染成「用法速览」面板；示例按「入门 → 外观定制 → 交互与状态 → 集成与持久化 → AI 场景」重排并编号 01–18
- **VNode 渲染**：新增 `core/vnodeView.ts`（`VNodeView`）替代 `<component :is="() => vnode" />` 写法，避免每次渲染新建组件类型导致候选面板与占位内容子树反复卸载重建
- 需求梳理与验收标准（含原始需求原文与实现对照表）整理进 `prompt.txt`

### Removed

- 从未生效的令牌：`--vme-primary-hover-color`、`--vme-popup-width`、`--vme-danger-500`（定义但无任何消费者，覆盖它们不会有任何效果）

### Fixed

- 光标紧贴提及节点时按 Backspace / Delete 需要按两次（第一次只是选中节点）：提及扩展现在优先级高于内置 keymap，一次即可删除，并顺手吞掉相邻的一个空格
- 固定高度的 pill chip 与文字 / 光标垂直错位（示例与文档原先建议的 `vertical-align: text-bottom` / 单一负值都不对）；现由 `vme-mention--pill` 统一处理
- 悬浮提示内容超出气泡：提示宽度上限为 `--vme-tip-max-width`（默认 260px），示例里写死 288px 的内容会横溢出气泡；组件现在会约束插槽内容不超过气泡宽度，文档补充 `--vme-tip-*` 令牌说明
- `src/types/index.ts` 中 `filter`、`pruneMentions` 的注释与上一行粘连的排版错误
- `MentionEditor.insertMention()` 中 `find` 回调参数与外层同名参数造成变量遮蔽
- 示例中的本地变量统一为 `renderMentionHtml`，与 prop 名 `mention-render-html` 保持一致
- 面板兜底定位（旧版 tiptap）现在同样遵守 `triggers[].container`，不再强制挂到 body
- `docs/README.md` 与 `docs/faq.md` 里的示例链接多退了一层目录（`../../dev/...`），在仓库页与文档站上都是坏链；已改为 `../dev/...`（由文档站的死链检查发现）
- 示例「用法速览」中两处与实际不符的描述（06 自定义提及块、09 聊天输入框的值格式）已修正

### 计划中

- 提及节点 NodeView：点击回调、悬浮卡片
- 字符数统计与 `maxlength`（基于 CharacterCount）
- 候选面板分组与「最近使用」置顶
- 端到端测试（Playwright）覆盖更多浏览器差异

## [0.1.0] - 2026-09-20

首个版本。

### Added

- **悬浮预览**：新增 `mentionHover` 配置与 `#mention-tip` 插槽——组件负责提及块的命中检测、延迟、定位（Floating UI）与「移入浮层不关闭」，内容由插槽决定（图片等比 200px、视频 / 音频 16:9 可播放、技能名与长文本完整展示）
- **引用数量上限**：`triggers[].limit` + `onLimit`（默认 `replace`），面板选择与 `insertMention()` 均生效，实现「技能只能引用一个，再次引用即替换」
- **自定义插入命令**：`createMentionExtension` 支持 `selectCommand`，便于接管选中后的插入行为
- **设计令牌体系**：`src/styles/tokens.css` 分基础层（调色板 / 尺度）与语义层（组件读取的变量），并提供 `[data-vme-theme="dark"]` 深色预设；组件样式不再出现裸值
- **测试体系**：vitest + jsdom + @vue/test-utils，`tests/` 下 7 个文件 92 个用例（纯函数、扩展、面板、编辑器行为、真实交互链路、上限替换、悬浮提示）
- **工程规范**：prettier 配置与 `format` / `format:check` 脚本，测试纳入 `vue-tsc` 类型检查
- `MentionEditor` 组件：Tiptap 3 + Vue 3 + TypeScript，支持 `v-model`、`submitOnEnter`、`editable`、`autofocus`
- 占位内容：`placeholder` 支持普通字符串、VNode（如 `kbd` 行内块）与 `#placeholder` 插槽，由组件内置浮层实现（不再依赖 Tiptap Placeholder 扩展）
- 高度控制：`minRows` / `maxRows` 按行数自适应（不足最小行保持、超出擑开、超过最大行滚动），与 `minHeight` / `maxHeight` 共存
- 禁用态：`disabled`（置灰、不可聚焦），与只读（`editable=false`）区分
- 提及块结构定制：`mentionRenderHtml` / `mentionRenderText`，可把提及渲染成「缩略图 + 文件名」等自定义结构
- 候选面板定制：`trigger.popupClass` 与 `#empty` 插槽
- 文本值模式（AI 资源场景）：`valueFormat: 'text'` 让 v-model 为 `@ + id/src` 纯文本；`textValue.resolve` 根据 token 还原展示信息；`mentionPool` + `pruneMentions` 在资源被删除时自动清理对应提及；`getMentions()` / `removeMentions()` 实例方法
- 多触发符支持：`triggers` 数组可配置多个 `char`，支持 `allowedPrefixes`
- 数据源：静态数组（内置 `label` / `id` / `description` 过滤）与异步函数（`debounce`、`minQueryLength`、`AbortSignal` 中断）
- 面板：默认候选面板（头像 + 标题 + 描述）、键盘导航、空状态与加载态、`#item` 插槽自定义渲染
- 定位：复用 Tiptap suggestion 的 `mount()`（Floating UI），旧版本回退手动定位；支持 `placement` / `offset` / `container`
- 数据持久化：`extraAttributes` 自定义节点属性（含 `parseHTML` / `renderHTML` 回显）
- 基础扩展默认包含 `Document` / `Paragraph` / `Text` / `HardBreak`（Shift + Enter 换行）/ `UndoRedo`
- 实例方法：`focus` / `blur` / `clear` / `setContent` / `getHTML` / `getText` / `getJSON` / `insertMention`（必要时自动补空格）
- 事件：`change` / `submit` 载荷新增 `value` 与 `text` 字段
- 底层导出：`createMentionExtension`（`renderHTML` / `renderText`）、`createSuggestionRenderer`、`resolveMentionItems`、`MentionList`、Vue 插件安装
- 构建：Vite 库模式产出 ESM + CJS + CSS + 类型声明；`vue` 与 `@tiptap/*` 外部化
- 文档与示例：`docs/` 完整文档（含 AI 资源指南），`dev/` playground 提供 16 个可运行示例（含源码查看）

### Fixed

- 同步函数型数据源（如 `items: () => resources.value`）不做本地过滤，导致输入关键词仍列出全部候选；现在与数组数据源一致
- `getText()` / `change.text` 默认改为「触发符 + label」的可读文本（文本值模式仍用 `@ + id` 保证往返一致）
- 加载中 / 空状态下仍会渲染上一轮的候选项（`v-for` 未接入 `v-if` 链）
- `insertMention` 紧跟其它节点时不补空格，导致文本值出现 `@a@b` 粘连
- 默认基础扩展缺少 `HardBreak`，文档承诺的 Shift + Enter 换行实际不生效
- 含连续大写的 prop（`mentionRenderHTML`）在模板 kebab-case 写法下匹配不到，已更名为 `mentionRenderHtml`
