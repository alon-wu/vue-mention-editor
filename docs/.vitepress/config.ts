import { defineConfig, type UserConfig } from "vitepress";
import { offsiteLinksPlugin } from "./offsite-links";

/**
 * VitePress 自带一份 vite（^5）依赖，其插件类型与根目录的 vite（^7）不互认，
 * 因此这里按 VitePress 期望的类型断言一次。插件只用到 name / enforce / transform
 * 这几个长期稳定的字段，不影响构建行为。
 */
const sitePlugins = [offsiteLinksPlugin()] as unknown as NonNullable<UserConfig["vite"]>["plugins"];

const repo = "https://github.com/alon-wu/vue-mention-editor";
const site = "https://alon-wu.github.io/vue-mention-editor";

/** 指南侧边栏 */
const guide = [
  { text: "快速开始", link: "/guide/getting-started" },
  { text: "触发符与数据源", link: "/guide/triggers" },
  { text: "外观定制", link: "/guide/customizing" },
  { text: "数据与持久化", link: "/guide/data-persistence" },
  { text: "AI 资源提及", link: "/guide/ai-resources" },
  { text: "场景配方", link: "/guide/recipes" },
];

/** API 参考侧边栏 */
const api = [
  { text: "Props", link: "/api/props" },
  { text: "事件", link: "/api/events" },
  { text: "插槽与实例方法", link: "/api/slots-methods" },
  { text: "类型定义", link: "/api/types" },
  { text: "扩展与底层能力", link: "/api/extensions" },
];

/**
 * 文档站配置。
 *
 * 站点结构：`https://<user>.github.io/<repo>/docs/`——示例画廊在站点根目录
 * （由 vite.demo.config.ts 构建），文档挂在其下的 `docs/` 子路径，两者由
 * `bun run build:site` 合并成同一个 Pages 站点。
 *
 * `docs/` 内的相对链接（`./xxx.md`）由 VitePress 自动解析；指向仓库其它目录
 * （`dev/examples/*.vue`、根目录 README / CHANGELOG 等）的链接一律写成绝对
 * 地址，这样在 GitHub 仓库页与文档站里都能正确跳转（dead link 检查会拦住漏改的）。
 */
export default defineConfig({
  lang: "zh-CN",
  title: "vue-mention-editor",
  description: "基于 Tiptap 3 + Vue 3 的提及（@mention）编辑器组件",
  base: "/vue-mention-editor/docs/",

  // 站点图标在站点根目录（由示例站的构建从根目录 public/ 复制过来，见 build-site.ts）；
  // 因此这里用的是站点绝对路径：线上有效，本地 `bun run docs:dev` 下图标会 404（不影响功能）
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/vue-mention-editor/favicon.svg" }]],

  // 把文档里指向 docs 之外的相对链接改写成绝对地址（在线示例 / GitHub），
  // 改写发生在 VitePress 的死链检查之前，见 offsite-links.ts
  // 文档索引沿用 docs/README.md（GitHub 仓库页会直接渲染它），
  // 在站点里把它映射成首页 /（VitePress 默认只认 index.md）
  rewrites: {
    "README.md": "index.md",
  },

  // 文档里出现的本地开发地址（http://localhost:5173）不参与死链检查：
  // 构建时它当然是不通的，但文档需要展示它
  ignoreDeadLinks: [/^https?:\/\/localhost/],

  vite: {
    plugins: sitePlugins,
  },

  markdown: {
    lineNumbers: true,
  },
  sitemap: {
    hostname: `${site}/docs/`,
  },

  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/props", activeMatch: "/api/" },
      { text: "示例画廊", link: `${site}/` },
      { text: "GitHub", link: repo },
    ],

    sidebar: [
      { text: "指南", items: guide },
      { text: "API 参考", items: api },
      {
        text: "其它",
        items: [
          { text: "常见问题 FAQ", link: "/faq" },
          { text: "文档首页", link: "/" },
        ],
      },
    ],

    outline: { label: "本页目录", level: [2, 3] },
    docFooter: { prev: "上一篇", next: "下一篇" },
    darkModeSwitchLabel: "主题",
    sidebarMenuLabel: "目录",
    returnToTopLabel: "回到顶部",
    lastUpdated: { text: "最后更新" },

    search: { provider: "local" },

    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: "在 GitHub 上编辑此页",
    },

    socialLinks: [{ icon: "github", link: repo }],

    footer: {
      message: "基于 MIT 许可发布",
      copyright: "vue-mention-editor",
    },
  },
});
