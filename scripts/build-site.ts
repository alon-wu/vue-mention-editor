/**
 * 把「示例画廊」与「文档站」合并成一个 GitHub Pages 站点：
 *
 * ```
 * dist-site/
 * ├── index.html      ← 示例画廊（站点根，来自 dist-demo/）
 * ├── assets/**
 * └── docs/           ← VitePress 文档站（来自 docs/.vitepress/dist/）
 * ```
 *
 * 用法：`bun run build:site`（会先跑 build:demo 与 docs:build）
 */
import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("..", import.meta.url).pathname;
const demoDir = `${root}dist-demo`;
const docsDir = `${root}docs/.vitepress/dist`;
const outDir = `${root}dist-site`;

const missing = [demoDir, docsDir].filter((dir) => !existsSync(dir));
if (missing.length > 0) {
  console.error(`✗ 缺少构建产物：${missing.join("、")}`);
  console.error("  请先执行 bun run build:demo 与 bun run docs:build");
  process.exit(1);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(demoDir, outDir, { recursive: true });
await cp(docsDir, `${outDir}/docs`, { recursive: true });

console.log(`✓ 站点已生成：dist-site/（示例画廊在根目录，文档在 docs/）`);
