import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolveAliases } from "./vite.shared";

/**
 * 示例画廊的静态站点构建（部署到 GitHub Pages）。
 *
 * 入口是仓库根目录的 `index.html` → `dev/main.ts`，产物落在 `dist-demo/`，
 * 与库构建（`vite.config.ts` → `dist/`）互不影响。
 *
 * `base` 必须是 Pages 的站点路径：站点地址为
 * `https://<user>.github.io/<repo>/`，不设 base 时资源会 404。
 */
export default defineConfig({
  base: "/vue-mention-editor/",
  plugins: [vue()],
  resolve: { alias: resolveAliases },
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    sourcemap: true,
  },
});
