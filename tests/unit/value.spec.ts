import { describe, expect, it } from "vitest";
import { Schema } from "@tiptap/pm/model";
import {
  idMentionText,
  mentionTextRenderer,
  parseTextToContent,
  serializeDocText,
} from "../../src/core/value";

/** 与组件一致的迷你 schema，用于构造文档 */
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0] },
    text: { group: "inline" },
    hardBreak: { inline: true, group: "inline", selectable: false, toDOM: () => ["br"] },
    mention: {
      inline: true,
      group: "inline",
      atom: true,
      selectable: false,
      attrs: {
        id: { default: null },
        label: { default: null },
        mentionSuggestionChar: { default: "@" },
      },
      toDOM: () => ["span", { class: "vme-mention" }],
    },
  },
});

function mention(attrs: Record<string, unknown>) {
  return schema.node("mention", attrs);
}

describe("serializeDocText", () => {
  it("默认序列化为「触发符 + label」（可读文本）", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [
        schema.text("看看这张 "),
        mention({ id: "/uploads/a.png", label: "海边.png" }),
        schema.text(" 和 "),
        mention({ id: "/uploads/demo.mp4", label: "视频.mp4", mentionSuggestionChar: "#" }),
      ]),
    ]);

    expect(serializeDocText(doc)).toBe("看看这张 @海边.png 和 #视频.mp4");
  });

  it("可通过 renderMention 切换为 id（文本值模式用的 token）", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [
        schema.text("看看这张 "),
        mention({ id: "/uploads/a.png", label: "海边.png" }),
        schema.text(" 和 "),
        mention({ id: "/uploads/demo.mp4", label: "视频.mp4", mentionSuggestionChar: "#" }),
      ]),
    ]);

    expect(serializeDocText(doc, { renderMention: idMentionText })).toBe(
      "看看这张 @/uploads/a.png 和 #/uploads/demo.mp4",
    );
  });

  it("label 缺失时退回 id", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [mention({ id: "/uploads/a.png" })]),
    ]);

    expect(serializeDocText(doc)).toBe("@/uploads/a.png");
  });

  it("支持自定义 blockSeparator", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("第一段")]),
      schema.node("paragraph", null, [schema.text("第二段")]),
    ]);

    expect(serializeDocText(doc)).toBe("第一段\n第二段");
    expect(serializeDocText(doc, { blockSeparator: " | " })).toBe("第一段 | 第二段");
  });

  it("硬换行序列化为 \\n", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [
        schema.text("第一行"),
        schema.node("hardBreak"),
        schema.text("第二行"),
      ]),
    ]);

    expect(serializeDocText(doc)).toBe("第一行\n第二行");
  });

  it("空文档序列化为空字符串", () => {
    const doc = schema.node("doc", null, [schema.node("paragraph")]);
    expect(serializeDocText(doc)).toBe("");
  });

  it("支持自定义 renderMention", () => {
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [mention({ id: "/a.png", label: "a.png" })]),
    ]);

    expect(serializeDocText(doc, { renderMention: (attrs) => `[${attrs.label}]` })).toBe("[a.png]");
  });
});

describe("parseTextToContent", () => {
  it("把 @token 还原为 mention 节点，其余为普通文本", () => {
    const result = parseTextToContent("看看这张 @/uploads/a.png 谢谢", {
      resolve: (token) => ({ id: token, label: "海边.png", kind: "image" }),
    });

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "看看这张 " },
            {
              type: "mention",
              attrs: {
                id: "/uploads/a.png",
                label: "海边.png",
                kind: "image",
                mentionSuggestionChar: "@",
              },
            },
            { type: "text", text: " 谢谢" },
          ],
        },
      ],
    });
  });

  it("未命中 resolve 时 label 退化为 token", () => {
    const result = parseTextToContent("@/uploads/unknown.bin");
    const attrs = result.content?.[0]?.content?.[0]?.attrs;

    expect(attrs).toMatchObject({ id: "/uploads/unknown.bin", label: "/uploads/unknown.bin" });
  });

  it("id 固定为 token，保证与文本值往返一致", () => {
    const result = parseTextToContent("@/uploads/a.png", {
      resolve: () => ({ id: "resource-1", label: "海边.png" }),
    });

    expect(result.content?.[0]?.content?.[0]?.attrs).toMatchObject({
      id: "/uploads/a.png",
      label: "海边.png",
    });
  });

  it("支持多个触发符", () => {
    const result = parseTextToContent("@user #tag", { triggers: ["@", "#"] });
    const content = result.content?.[0]?.content ?? [];

    expect(content[0]?.attrs?.mentionSuggestionChar).toBe("@");
    expect(content[1]?.type).toBe("text");
    expect(content[2]?.attrs?.mentionSuggestionChar).toBe("#");
  });

  it("多行文本按 blockSeparator 拆成多个段落", () => {
    const result = parseTextToContent("第一行\n第二行");
    expect(result.content).toHaveLength(2);
    expect(result.content?.[1]?.content?.[0]?.text).toBe("第二行");
  });

  it("支持自定义 tokenPattern（例如排除竖线）", () => {
    const result = parseTextToContent("@a.png|tail", { tokenPattern: "[^\\s|]+" });
    const content = result.content?.[0]?.content ?? [];

    expect(content[0]?.attrs?.id).toBe("a.png");
    expect(content[1]).toEqual({ type: "text", text: "|tail" });
  });

  it("空字符串解析为单个空段落", () => {
    expect(parseTextToContent("")).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("与 serializeDocText 往返一致（文本值模式用 id 作 token）", () => {
    const text = "帮我处理 @/uploads/a.png 和 @/uploads/b.mp4";
    const parsed = parseTextToContent(text, {
      resolve: (token) => ({ id: token, label: token.split("/").pop() ?? token }),
    });

    const doc = schema.node(
      "doc",
      null,
      (parsed.content ?? []).map((paragraph) =>
        schema.node(
          "paragraph",
          null,
          (paragraph.content ?? []).map((node) =>
            node.type === "mention" ? mention(node.attrs ?? {}) : schema.text(node.text ?? ""),
          ),
        ),
      ),
    );

    expect(serializeDocText(doc, { renderMention: idMentionText })).toBe(text);
  });
});

describe("parseTextToContent · 触发符前缀规则（allowedPrefixes）", () => {
  /** 取出解析结果里的提及 token */
  const mentionIds = (text: string, options?: Parameters<typeof parseTextToContent>[1]) =>
    (parseTextToContent(text, options).content?.[0]?.content ?? [])
      .filter((node) => node.type === "mention")
      .map((node) => node.attrs?.id);

  it("默认只认「行首或空格后」的 @token：邮箱不会被误判成提及", () => {
    expect(mentionIds("联系 zhangsan@example.com 了解详情")).toEqual([]);
    expect(mentionIds("zhangsan@example.com")).toEqual([]);
  });

  it("行首与空格后的 @token 正常解析", () => {
    expect(mentionIds("@u1 你好")).toEqual(["u1"]);
    expect(mentionIds("你好 @u1 请查收")).toEqual(["u1"]);
  });

  it("多个提及与普通字符混排时，只解析合法的那些", () => {
    expect(mentionIds("hi @a.png 和 @b.png")).toEqual(["a.png", "b.png"]);
    expect(mentionIds("a@b.png @c.png")).toEqual(["c.png"]);
  });

  it("allowedPrefixes 可自定义（例如允许中文标点后触发）", () => {
    expect(mentionIds("你好，@u1 请查收", { allowedPrefixes: [" ", "，"] })).toEqual(["u1"]);
    expect(mentionIds("你好，@u1", { allowedPrefixes: [" "] })).toEqual([]);
  });

  it("allowedPrefixes: null 表示不限制", () => {
    expect(mentionIds("zhangsan@example.com", { allowedPrefixes: null })).toEqual(["example.com"]);
  });
});

describe("文本 token（id / label）", () => {
  const attrs = { id: "u1", label: "张三", mentionSuggestionChar: "@" };

  it("mentionTextRenderer：按 token 形式选择渲染函数", () => {
    expect(mentionTextRenderer()(attrs)).toBe("@u1");
    expect(mentionTextRenderer("id")).toBe(idMentionText);
    expect(mentionTextRenderer("label")(attrs)).toBe("@张三");
  });

  it("parseTextToContent：token='label' 时节点 id 取 resolve 换回的真实 id", () => {
    const result = parseTextToContent("@张三 请看", {
      token: "label",
      resolve: (token) => (token === "张三" ? { id: "u1", label: "张三" } : undefined),
    });

    expect(result.content?.[0]?.content?.[0]?.attrs).toMatchObject({
      id: "u1",
      label: "张三",
      mentionSuggestionChar: "@",
    });
  });

  it("parseTextToContent：token='label' 且解析不到时退化为 token", () => {
    const result = parseTextToContent("@李四", { token: "label" });
    expect(result.content?.[0]?.content?.[0]?.attrs).toMatchObject({ id: "李四", label: "李四" });
  });

  it("token='label' 时多触发符 / 前缀规则照常生效", () => {
    const result = parseTextToContent("你好 @张三 和 #前端", {
      token: "label",
      triggers: ["@", "#"],
    });
    const content = result.content?.[0]?.content ?? [];
    const ids = content.filter((node) => node.type === "mention").map((node) => node.attrs?.id);

    expect(ids).toEqual(["张三", "前端"]);
  });
});
