/**
 * 库构建（vite.config.ts）与示例站点构建（vite.demo.config.ts）共享的解析配置。
 *
 * 示例代码统一用包名导入，保持与使用者的写法一致；`@` 指向 `src/`，
 * 方便示例直接引用内部类型。
 */
export const resolveAliases = [
  {
    find: /^vue-mention-editor$/,
    replacement: new URL("./src/index.ts", import.meta.url).pathname,
  },
  {
    find: /^vue-mention-editor\/style\.css$/,
    replacement: new URL("./dev/lib-style.css", import.meta.url).pathname,
  },
  { find: "@", replacement: new URL("./src", import.meta.url).pathname },
];
