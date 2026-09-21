import { dirname, relative, resolve } from "node:path";
import type { Plugin } from "vite";

/** 文档站地址（与 config.ts 的 base 对应） */
export const SITE_URL = "https://alon-wu.github.io/vue-mention-editor";

/** 仓库地址 */
export const REPO_URL = "https://github.com/alon-wu/vue-mention-editor";

/**
 * 示例文件 → 画廊编号。
 *
 * 顺序必须与 `dev/examples/index.ts` 中登记示例的顺序一致，`tests/unit/offsite-links.spec.ts`
 * 会守住这一点。有了它，文档里的 `../../dev/examples/XxxExample.vue`
 * 在文档站上会跳到对应的**在线示例**（示例卡片里自带源码与用法速览）。
 */
export const EXAMPLE_SERIALS: Record<string, string> = {
  BasicExample: "01",
  MultiTriggerExample: "02",
  AsyncSourceExample: "03",
  PlaceholderExample: "04",
  RowsExample: "05",
  MentionChipExample: "06",
  CustomItemSlot: "07",
  ThemingExample: "08",
  ChatInputExample: "09",
  EditableExample: "10",
  DisabledExample: "11",
  ProgrammaticExample: "12",
  RichTextExample: "13",
  ExtraAttributesExample: "14",
  ModalExample: "15",
  AiResourceExample: "16",
  AiSkillExample: "17",
  AiTextRefExample: "18",
};

/**
 * `docs/` 的绝对路径。
 *
 * 这里用工作目录而不是 `import.meta.url`：VitePress 会先把配置打包到临时目录再执行，
 * `import.meta.url` 指向的是打包产物，据此推导目录不可靠。
 * 本项目的文档构建统一从仓库根目录发起（`vitepress build docs`，见 package.json）。
 */
const DOCS_ROOT = resolve(process.cwd(), "docs");

/**
 * 把「指向 docs 之外」的相对链接改写成绝对地址，返回 `undefined` 表示不用改。
 *
 * - `dev/examples/*.vue` → 示例画廊的深链（如 `…/#06`）
 * - 其它仓库文件（CHANGELOG / CONTRIBUTING / prompt.txt / 根 README …）→ GitHub 源码页
 * - docs 内部的链接原样保留，交给 VitePress 解析（它还会检查死链）
 *
 * 之所以在构建期改写而不是直接把文档里的链接写成绝对地址：文档在 GitHub
 * 仓库页、编辑器里仍然保持相对链接可用，站点上又能跳到更合适的目标。
 */
export function rewriteOffsiteLink(filePath: string, href: string): string | undefined {
  if (!href.startsWith(".")) return undefined; // http(s)、站内绝对路径、纯锚点

  const hashIndex = href.indexOf("#");
  const rawPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  if (!rawPath) return undefined;

  const target = resolve(dirname(filePath), rawPath);
  if (target === DOCS_ROOT || target.startsWith(`${DOCS_ROOT}/`)) return undefined; // docs 内部

  const repoRelative = relative(dirname(DOCS_ROOT), target);
  if (repoRelative.startsWith("..")) return undefined; // 仓库之外，保持原样（由死链检查兜底）

  const example = /^dev\/examples\/(\w+)\.vue$/.exec(repoRelative);
  if (example) {
    const serial = EXAMPLE_SERIALS[example[1]];
    if (serial) return `${SITE_URL}/#${serial}`;
  }
  return `${REPO_URL}/blob/main/${repoRelative}${hash}`;
}

/**
 * Vite 插件：在 VitePress 渲染 Markdown **之前**改写 docs 之外的相对链接。
 *
 * 必须用 `enforce: "pre"`：VitePress 的 markdown 编译与死链检查都在其后运行，
 * 这样死链检查看到的是改写后的绝对地址，而真正的死链（写错的 docs 内部链接）
 * 依然会拦住构建。
 */
export function offsiteLinksPlugin(): Plugin {
  return {
    name: "vme:rewrite-offsite-links",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".md")) return null;

      const next = code.replace(/\]\(([^)\s]+)\)/g, (whole, href: string) => {
        const rewritten = rewriteOffsiteLink(id, href);
        return rewritten ? `](${rewritten})` : whole;
      });

      return next === code ? null : next;
    },
  };
}
