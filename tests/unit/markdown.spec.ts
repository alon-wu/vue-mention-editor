import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { serializeDocMarkdown } from "../../src/core/markdown";
import { createMentionExtension } from "../../src/extensions/mention";

/** 用 StarterKit 建一个“富文本 + 提及”的编辑器，直接序列化它的文档 */
function markdownOf(html: string): string {
  const editor = new Editor({
    content: html,
    extensions: [StarterKit, createMentionExtension({ triggers: [{ char: "@", items: [] }] })],
  });
  const markdown = serializeDocMarkdown(editor.state.doc);
  editor.destroy();
  return markdown;
}

describe("serializeDocMarkdown", () => {
  it("段落之间用空行分隔", () => {
    expect(markdownOf("<p>第一段</p><p>第二段</p>")).toBe("第一段\n\n第二段");
  });

  it("标题按 level 生成 # 前缀", () => {
    expect(markdownOf("<h1>一级</h1><h3>三级</h3>")).toBe("# 一级\n\n### 三级");
  });

  it("常见 mark：粗体 / 斜体 / 行内代码 / 删除线", () => {
    expect(markdownOf("<p><strong>粗</strong> 与 <em>斜</em> 与 <code>码</code></p>")).toBe(
      "**粗** 与 *斜* 与 `码`",
    );
  });

  it("无序列表与有序列表（含起始序号）", () => {
    expect(markdownOf("<ul><li><p>甲</p></li><li><p>乙</p></li></ul>")).toBe("- 甲\n- 乙");
    expect(markdownOf('<ol start="3"><li><p>丙</p></li></ol>')).toBe("3. 丙");
  });

  it("引用与代码块", () => {
    expect(markdownOf("<blockquote><p>引用一行</p></blockquote>")).toBe("> 引用一行");
    expect(markdownOf('<pre><code class="language-ts">const a = 1;</code></pre>')).toBe(
      "```ts\nconst a = 1;\n```",
    );
  });

  it("硬换行与分割线", () => {
    expect(markdownOf("<p>上<br>下</p>")).toBe("上  \n下");
    expect(markdownOf("<hr>")).toBe("---");
  });

  it("提及序列化为 `@ + label`（可读形式），缺 label 时回退 id", () => {
    expect(
      markdownOf(
        '<p><span data-type="mention" data-id="u1" data-label="张三" data-mention-suggestion-char="@">@张三</span> 请查收</p>',
      ),
    ).toBe("@张三 请查收");

    expect(
      markdownOf(
        '<p><span data-type="mention" data-id="u2" data-mention-suggestion-char="@">@u2</span></p>',
      ),
    ).toBe("@u2");
  });

  it("可通过 renderMention 自定义提及的 Markdown 形式", () => {
    const editor = new Editor({
      content:
        '<p><span data-type="mention" data-id="u1" data-label="张三" data-mention-suggestion-char="@">@张三</span></p>',
      extensions: [StarterKit, createMentionExtension({ triggers: [{ char: "@", items: [] }] })],
    });

    const markdown = serializeDocMarkdown(editor.state.doc, {
      renderMention: (attrs) => `[${String(attrs.label)}](mention://${String(attrs.id)})`,
    });
    editor.destroy();

    expect(markdown).toBe("[张三](mention://u1)");
  });

  it("空文档返回空字符串", () => {
    expect(markdownOf("<p></p>")).toBe("");
  });
});
