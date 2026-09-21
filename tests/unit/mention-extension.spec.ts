import { describe, expect, it, vi } from "vitest";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { createMentionExtension, resolveMentionItems } from "../../src/extensions/mention";
import type { MentionItem, MentionQueryContext, MentionTrigger } from "../../src/types";

const members: MentionItem[] = [
  { id: "u1", label: "张三", description: "zhangsan@example.com" },
  { id: "u2", label: "李四", description: "lisi@example.com" },
  { id: "u3", label: "Zoe Chen" },
];

function context(query: string, signal?: AbortSignal): MentionQueryContext {
  return { query, trigger: "@", signal: signal ?? new AbortController().signal };
}

describe("resolveMentionItems", () => {
  it("数组数据源：空查询返回全部候选项", async () => {
    await expect(resolveMentionItems(members, context(""))).resolves.toHaveLength(3);
    await expect(resolveMentionItems(members, context("   "))).resolves.toHaveLength(3);
  });

  it("数组数据源：label / id / description 任一命中即可，且忽略大小写", async () => {
    await expect(resolveMentionItems(members, context("张"))).resolves.toEqual([members[0]]);
    await expect(resolveMentionItems(members, context("U2"))).resolves.toEqual([members[1]]);
    await expect(resolveMentionItems(members, context("zoe"))).resolves.toEqual([members[2]]);
    await expect(resolveMentionItems(members, context("example.com"))).resolves.toHaveLength(2);
  });

  it("支持自定义过滤函数", async () => {
    const result = await resolveMentionItems(members, context("李"), (item, query) =>
      item.label.startsWith(query),
    );

    expect(result).toEqual([members[1]]);
  });

  it("函数数据源：透传 query / trigger / signal", async () => {
    const source = vi.fn(async ({ query, trigger }: MentionQueryContext) => [
      { id: `${trigger}${query}`, label: query },
    ]);

    await expect(resolveMentionItems(source, context("zh"))).resolves.toEqual([
      { id: "@zh", label: "zh" },
    ]);
    expect(source).toHaveBeenCalledTimes(1);
    expect(source.mock.calls[0][0]).toMatchObject({ query: "zh", trigger: "@" });
  });

  it("同步函数数据源：同样做本地过滤（适配响应式列表 getter）", async () => {
    const list = [...members];
    const source = () => list;

    await expect(resolveMentionItems(source, context("张"))).resolves.toEqual([members[0]]);
    await expect(resolveMentionItems(source, context(""))).resolves.toHaveLength(3);
  });

  it("异步函数数据源：结果原样使用（视为服务端已过滤）", async () => {
    const source = async () => members;

    await expect(resolveMentionItems(source, context("张"))).resolves.toHaveLength(3);
    await expect(resolveMentionItems(source, context(""))).resolves.toHaveLength(3);
  });

  it("函数数据源返回非数组时退化为空数组", async () => {
    const result = await resolveMentionItems((() => undefined) as never, context(""));
    expect(result).toEqual([]);
  });

  it("请求被中断时静默返回空数组（不产生未捕获异常）", async () => {
    const controller = new AbortController();
    const source = () => {
      controller.abort();
      return Promise.reject(new DOMException("aborted", "AbortError"));
    };

    await expect(
      resolveMentionItems(source, { query: "x", trigger: "@", signal: controller.signal }),
    ).resolves.toEqual([]);
  });

  it("其它异常继续抛出，交给业务处理", async () => {
    await expect(
      resolveMentionItems(() => Promise.reject(new Error("boom")), context("x")),
    ).rejects.toThrow("boom");
  });
});

function createTestEditor(options: {
  triggers: MentionTrigger[];
  extraAttributes?: Record<string, unknown>;
  renderHTML?: (props: { node: { attrs: Record<string, unknown> } }) => unknown;
  content?: string;
}) {
  return new Editor({
    element: document.createElement("div"),
    content: options.content ?? "<p></p>",
    extensions: [
      Document,
      Paragraph,
      Text,
      createMentionExtension({
        triggers: options.triggers,
        extraAttributes: options.extraAttributes as never,
        renderHTML: options.renderHTML as never,
      }),
    ],
  });
}

describe("createMentionExtension", () => {
  it("为每个触发符生成一条 suggestion 配置", () => {
    const extension = createMentionExtension({
      triggers: [
        { char: "@", items: members },
        { char: "#", items: [] },
      ],
    });

    expect(extension.options.suggestions.map((suggestion) => suggestion.char)).toEqual(["@", "#"]);
  });

  it("触发符选项透传给 tiptap suggestion", () => {
    const extension = createMentionExtension({
      triggers: [
        {
          char: "@",
          items: members,
          debounce: 300,
          minQueryLength: 2,
          allowedPrefixes: [" ", "。"],
          container: ".modal-body",
        },
      ],
    });

    expect(extension.options.suggestions[0]).toMatchObject({
      char: "@",
      debounce: 300,
      minQueryLength: 2,
      allowedPrefixes: [" ", "。"],
      container: ".modal-body",
    });
  });

  it("extraAttributes 会合并进 mention 节点 schema", () => {
    const editor = createTestEditor({
      triggers: [{ char: "@", items: members }],
      extraAttributes: {
        kind: { default: "file" },
        thumb: { default: "" },
      },
    });

    const attrs = Object.keys(editor.schema.nodes.mention.spec.attrs ?? {});
    expect(attrs).toEqual(
      expect.arrayContaining(["id", "label", "mentionSuggestionChar", "kind", "thumb"]),
    );
    editor.destroy();
  });

  it("自定义 renderHTML 决定提及块的 DOM 结构", () => {
    const editor = createTestEditor({
      triggers: [{ char: "@", items: members }],
      renderHTML: ({ node }) => ["span", { class: "custom-chip" }, `[${node.attrs.label}]`],
      content:
        '<p><span class="vme-mention" data-type="mention" data-id="u1" data-label="张三">@张三</span></p>',
    });

    const html = editor.getHTML();
    expect(html).toContain('class="custom-chip"');
    expect(html).toContain("[张三]");
    editor.destroy();
  });

  it("自定义 HTMLAttributes 会合并到提及块上", () => {
    const editor = createTestEditor({
      triggers: [{ char: "@", items: members }],
      content:
        '<p><span class="vme-mention" data-type="mention" data-id="u1" data-label="张三">@张三</span></p>',
    });

    expect(editor.getHTML()).toContain('class="vme-mention"');
    editor.destroy();
  });
});
