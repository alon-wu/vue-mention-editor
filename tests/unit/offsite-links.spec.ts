import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXAMPLE_SERIALS,
  REPO_URL,
  SITE_URL,
  rewriteOffsiteLink,
} from "../../docs/.vitepress/offsite-links";

/** 构造 docs 下某个文档的绝对路径（与构建时传进来的 id 一致） */
const docsFile = (...segments: string[]) => resolve(process.cwd(), "docs", ...segments);

describe("rewriteOffsiteLink", () => {
  it("示例文件改写成在线示例的深链（# + 编号）", () => {
    // depth 2（docs/guide/*.md）：../../dev/…
    expect(
      rewriteOffsiteLink(
        docsFile("guide", "recipes.md"),
        "../../dev/examples/ChatInputExample.vue",
      ),
    ).toBe(`${SITE_URL}/#09`);

    // depth 1（docs/README.md）：../dev/…
    expect(rewriteOffsiteLink(docsFile("README.md"), "../dev/examples/BasicExample.vue")).toBe(
      `${SITE_URL}/#01`,
    );
  });

  it("仓库根目录的其它文件改写成 GitHub 源码页，并保留锚点", () => {
    expect(rewriteOffsiteLink(docsFile("README.md"), "../CHANGELOG.md")).toBe(
      `${REPO_URL}/blob/main/CHANGELOG.md`,
    );
    expect(
      rewriteOffsiteLink(docsFile("guide", "data-persistence.md"), "../../README.md#路线图"),
    ).toBe(`${REPO_URL}/blob/main/README.md#路线图`);
    expect(rewriteOffsiteLink(docsFile("README.md"), "../prompt.txt")).toBe(
      `${REPO_URL}/blob/main/prompt.txt`,
    );
  });

  it("仍未登记的 dev 文件：宁可指向 GitHub 源码页，也不留死链", () => {
    expect(rewriteOffsiteLink(docsFile("README.md"), "../dev/examples/FutureExample.vue")).toBe(
      `${REPO_URL}/blob/main/dev/examples/FutureExample.vue`,
    );
  });

  it("docs 内部的链接原样保留（交给 VitePress 解析与死链检查）", () => {
    // docs/guide/recipes.md 里的 ../README.md 指的是文档首页
    expect(rewriteOffsiteLink(docsFile("guide", "recipes.md"), "../README.md")).toBeUndefined();
    expect(rewriteOffsiteLink(docsFile("api", "props.md"), "../guide/triggers.md")).toBeUndefined();
    expect(rewriteOffsiteLink(docsFile("README.md"), "./guide/getting-started.md")).toBeUndefined();
  });

  it("外部链接、站内绝对路径与纯锚点不动", () => {
    expect(rewriteOffsiteLink(docsFile("README.md"), "https://example.com")).toBeUndefined();
    expect(rewriteOffsiteLink(docsFile("README.md"), "#目录")).toBeUndefined();
    expect(rewriteOffsiteLink(docsFile("README.md"), "#vue-mention-editor-文档")).toBeUndefined();
  });

  it("仓库之外的相对路径与多余层级的链接不动（避免拼出错误地址）", () => {
    // docs/README.md 写 ../../dev/… 会退到仓库外：保持原样，交给死链检查报错
    expect(
      rewriteOffsiteLink(docsFile("README.md"), "../../dev/examples/BasicExample.vue"),
    ).toBeUndefined();
    expect(rewriteOffsiteLink(docsFile("README.md"), "../../../somewhere/file.md")).toBeUndefined();
  });
});

describe("EXAMPLE_SERIALS", () => {
  it("编号顺序与 dev/examples/index.ts 的登记顺序一致", async () => {
    const source = (await import("../../dev/examples/index.ts?raw")).default as string;
    const registered = [...source.matchAll(/fileName: "dev\/examples\/(\w+)\.vue"/g)].map(
      (match) => match[1],
    );

    expect(registered.length).toBeGreaterThan(0);
    expect(Object.keys(EXAMPLE_SERIALS)).toEqual(registered);
    // 编号必须是 01、02 …… 连续的两位数字
    expect(Object.values(EXAMPLE_SERIALS)).toEqual(
      registered.map((_, index) => String(index + 1).padStart(2, "0")),
    );
  });
});
