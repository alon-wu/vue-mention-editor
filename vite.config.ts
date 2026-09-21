import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { resolveAliases } from "./vite.shared";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: "./tsconfig.json",
      outDirs: "dist/types",
      entryRoot: "src",
      include: ["src"],
      // 打包阶段跳过 vue 文件类型收集，避免多余产物
      cleanVueFileName: true,
    }),
  ],
  resolve: {
    // 与示例站点构建（vite.demo.config.ts）共用同一份别名，避免两处漂移
    alias: resolveAliases,
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "VueMentionEditor",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
      cssFileName: "style",
    },
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      // vue 与 tiptap 全部外部化，避免使用者项目出现多份实例
      external: ["vue", /^@tiptap\//, /^prosemirror-/, /^@floating-ui\//],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
