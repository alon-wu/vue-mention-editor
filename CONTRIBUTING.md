# 贡献指南

感谢你愿意参与改进 `vue-mention-editor`！

## 环境要求

- Node.js >= 20
- [bun](https://bun.sh/)（本项目使用 bun 安装依赖与运行脚本）

## 本地开发

```bash
bun install        # 安装依赖
bun run dev        # 启动 playground（示例画廊）：http://localhost:5173
bun run test       # vitest 单元 + 组件测试
bun run typecheck  # vue-tsc 类型检查（含 tests/）
bun run build      # 类型检查 + 构建库产物到 dist/
bun run format     # prettier 统一代码风格
```

## 测试约定

- 新增功能必须配套测试，放在 `tests/` 下：
  - 纯函数 / 扩展逻辑 → `tests/unit/`
  - 组件行为 → `tests/components/`
- 测试只断言**对外行为**（DOM、事件、返回值），不去断言内部实现细节；
- 涉及交互链路的改动（输入触发符 → 面板 → 选择）请在 `MentionEditor.suggestion.spec.ts` 补充用例；
- jsdom 与浏览器存在差异的 API，统一在 `tests/setup.ts` 里打垫片，不在用例里写绕过逻辑。

## 持续集成

`.github/workflows/ci.yml` 会在 push 到 `main` 与发起 PR 时自动执行：

```bash
bun install --frozen-lockfile   # 锁文件与 package.json 必须一致
bun run format:check            # prettier
bun run typecheck               # vue-tsc（含 tests/）
bun run test                    # vitest run
bun run build                   # 类型检查 + 库构建（dist/ 会作为 artifact 上传）
```

提交前把这几条在本地跑一遍即可。注意两点：

- 改动过依赖就必须一并提交 `bun.lock`，否则 CI 的 `--frozen-lockfile` 会直接失败；
- 浏览器手感类问题（chip 垂直对齐、Backspace 删除时机等）CI 测不出来，涉及这些改动的 PR 请附上本地验证说明。

## 分支与合并流程

`main` 已启用分支保护，规则如下：

- 合入 `main` 必须通过 PR：PR 分支需与 `main` 保持同步，且 CI 的 **「格式 / 类型 / 测试 / 构建」** 检查为绿；
- 未开启「必须他人 approve」——单人维护时自己合并即可；
- 仓库所有者保留直推与强制合并权限，改文档、抢修可自行决定是否走 PR；
- 建议分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`（PR 合并后删除分支）。

## 目录结构

```
src/
├── components/
│   ├── MentionEditor.vue       # 主组件：编辑器装配、props/emits、ref 方法
│   └── MentionList.vue         # 默认候选面板：键盘导航、空/加载态、插槽渲染
├── core/
│   ├── suggestionRenderer.ts   # 面板渲染器：VueRenderer + 定位托管
│   ├── value.ts                # 文本值（默认格式）序列化 / 解析
│   ├── markdown.ts             # Markdown 扩展输出
│   └── vnodeView.ts            # 外部传入 VNode 的稳定渲染组件
├── extensions/
│   └── mention.ts              # mention 扩展工厂：多触发符、数据源解析、自定义结构
├── styles/tokens.css           # 设计令牌：基础层 + 语义层 + 深色预设
├── types/index.ts              # 全部对外类型
└── index.ts                    # 库入口 + Vue 插件

dev/                            # 本地 playground（示例画廊）
├── App.vue                     # 画廊外壳：侧边栏 + 示例卡片
├── examples/                   # 每个示例一个文件 + ?raw 源码展示
├── components/                 # ExampleCard / CodeBlock
├── style.css                   # 演示页设计令牌
└── mock.ts                     # 共享示例数据与异步模拟接口

docs/                           # 文档（指南 + API 参考 + FAQ）
tests/                          # vitest：unit + components
```

## 新增一个示例

1. 在 `dev/examples/` 新建 `XxxExample.vue`，从包名导入（`import { MentionEditor } from "vue-mention-editor"`），保持与使用者写法一致；
2. 在 `dev/examples/index.ts` 中登记：`group`（用 `ExampleGroup` 常量）/ `title` / `description` / `tags` / `fileName` / `component` / `source`（源码用 `?raw` 导入）；
3. **必须填写 `usage` 元信息**，画廊会统一渲染成「用法速览」面板：
   - `bindings`：绑定了哪些值（v-model、本地 state），各自承载什么（`v-model` 只写在这一项里）；
   - `events`：监听了哪些事件及用途（写清事件名）；
   - `props` / `slots` / `methods` / `triggerOptions` / `tokens`：用到的组件 API 与设计令牌；
   - `highlights`：实现要点——“这个效果是怎么来的”，每一条都应当可在 Demo 里验证。
4. 按分组顺序插入数组（入门 → 外观定制 → 交互与状态 → 集成与持久化 → AI 场景），编号会自动递增；
5. 在 `docs/README.md` 的示例索引中补一行（序号 / 链接 / 讲什么 / 关键 API）。

## 代码约定

- TypeScript strict + `verbatimModuleSyntax`：类型导入请使用 `import type`。
- 中文注释，公开 API 必须有 JSDoc 说明。
- 组件属性、事件、类型统一在 `src/types/index.ts` 维护，并从入口导出。
- **样式**：组件内不写裸值（颜色 / 间距 / 圆角 / 字号），一律使用 `src/styles/tokens.css` 里的语义令牌；新增令牌需同步 `docs/guide/customizing.md` 的令牌表。
- **VNode 渲染**：要渲染外部传入的 VNode（插槽、`placeholder` 等）时用 `src/core/vnodeView.ts` 的 `VNodeView`，不要写 `<component :is="() => vnode" />`——后者每次渲染都会新建组件类型，导致子树反复卸载重建。
- 不要引入新的运行时依赖（运行时仅依赖 Vue 与 Tiptap）。
- 提交前跑一次 `bun run format`（prettier 配置见 `.prettierrc.json`）。

## 提交前检查清单

- [ ] `bun run typecheck` 通过
- [ ] `bun run test` 全部通过（新增功能已补测试）
- [ ] `bun run build` 通过，`dist/` 产物正常
- [ ] `bun run format` 已执行，`bun run format:check` 无差异
- [ ] 新增/修改的功能在 playground 中实测通过（含键盘操作与中文输入法场景）
- [ ] 新增示例已填写 `usage`，画廊中「用法速览」显示正确且与源码一致
- [ ] 影响的文档（`README.md`、`docs/**`、`CHANGELOG.md`）已同步更新

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 支持按分组展示候选面板
fix: 修复面板在弹窗内被裁剪的问题
docs: 补充 extraAttributes 回显示例
```

## 发布（维护者）

```bash
bun run build
npm version patch|minor|major
npm publish
```

`prepublishOnly` 会再次执行构建；发布内容仅包含 `dist/`。
