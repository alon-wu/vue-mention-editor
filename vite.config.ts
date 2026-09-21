import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

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
    // 示例代码用包名导入，与使用者的写法保持一致
    alias: [
      {
        find: /^vue-mention-editor$/,
        replacement: new URL("./src/index.ts", import.meta.url).pathname,
      },
      {
        find: /^vue-mention-editor\/style\.css$/,
        replacement: new URL("./dev/lib-style.css", import.meta.url).pathname,
      },
      { find: "@", replacement: new URL("./src", import.meta.url).pathname },
    ],
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
