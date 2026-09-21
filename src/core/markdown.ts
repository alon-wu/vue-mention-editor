import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { defaultRenderMentionText } from "./value";

export interface SerializeMarkdownOptions {
  /** 块之间的分隔，默认空行（`\n\n`） */
  blockSeparator?: string;
  /** mention 节点 → Markdown 文本，默认 `@ + label`（缺省回退 id） */
  renderMention?: (attrs: Record<string, unknown>) => string;
}

type MentionRenderer = (attrs: Record<string, unknown>) => string;

/** 行内节点：文本（含常见 mark）、提及、硬换行 */
function serializeInline(node: ProseMirrorNode, renderMention: MentionRenderer): string {
  if (node.type.name === "mention") {
    return renderMention(node.attrs as Record<string, unknown>);
  }
  if (node.type.name === "hardBreak") return "  \n";
  if (node.isText) {
    return applyMarks(node);
  }

  let result = "";
  node.forEach((child) => {
    result += serializeInline(child, renderMention);
  });
  return result;
}

/** 文本节点 + mark → Markdown 标记 */
function applyMarks(node: ProseMirrorNode): string {
  let text = node.text ?? "";
  const names = node.marks.map((mark) => mark.type.name);

  if (names.includes("code")) text = `\`${text}\``;
  if (names.includes("bold")) text = `**${text}**`;
  if (names.includes("italic")) text = `*${text}*`;
  if (names.includes("strike")) text = `~~${text}~~`;

  const link = node.marks.find((mark) => mark.type.name === "link");
  if (link?.attrs?.href) text = `[${text}](${String(link.attrs.href)})`;

  return text;
}

/** 列表：逐项加标记，续行按标记宽度缩进 */
function serializeList(
  list: ProseMirrorNode,
  renderMention: MentionRenderer,
  markerAt: (index: number) => string,
): string {
  const lines: string[] = [];
  let index = 0;

  list.forEach((item) => {
    const marker = markerAt(index);
    index += 1;
    const [first = "", ...rest] = serializeBlocks(item, renderMention).split("\n");
    lines.push(`${marker}${first}`);
    for (const line of rest) lines.push(`${" ".repeat(marker.length)}${line}`);
  });

  return lines.join("\n");
}

/** 块级节点 */
function serializeBlock(node: ProseMirrorNode, renderMention: MentionRenderer): string {
  switch (node.type.name) {
    case "paragraph":
      return serializeInline(node, renderMention);

    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs.level ?? 1), 1), 6);
      return `${"#".repeat(level)} ${serializeInline(node, renderMention)}`;
    }

    case "codeBlock": {
      const language = String(node.attrs.language ?? "");
      return `\`\`\`${language}\n${node.textContent}\n\`\`\``;
    }

    case "blockquote":
      return serializeBlocks(node, renderMention)
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");

    case "bulletList":
      return serializeList(node, renderMention, () => "- ");

    case "orderedList": {
      const start = Number(node.attrs.start ?? 1);
      return serializeList(node, renderMention, (index) => `${start + index}. `);
    }

    case "listItem":
      return serializeBlocks(node, renderMention);

    case "horizontalRule":
      return "---";

    default:
      // 未覆盖的节点：尽量保留文本，不丢内容
      if (node.isLeaf) return "";
      return serializeInline(node, renderMention) || serializeBlocks(node, renderMention);
  }
}

/** 一个节点下的所有块（doc / blockquote / listItem 都用它） */
function serializeBlocks(node: ProseMirrorNode, renderMention: MentionRenderer): string {
  const blocks: string[] = [];
  node.forEach((child) => {
    blocks.push(serializeBlock(child, renderMention));
  });
  return blocks.join("\n\n");
}

/**
 * 把文档序列化为 Markdown（用于“把内容发给大模型 / 存 Markdown 文档”这类扩展场景）。
 *
 * 覆盖：段落、标题、粗体 / 斜体 / 删除线 / 行内代码 / 链接、提及、硬换行、
 * 无序与有序列表、引用、代码块、分割线；未覆盖的节点会退化为其文本内容。
 * 注意：不做 Markdown 转义（内容里的 `*` / `#` 等会原样输出）。
 */
export function serializeDocMarkdown(
  doc: ProseMirrorNode,
  options: SerializeMarkdownOptions = {},
): string {
  const renderMention = options.renderMention ?? defaultRenderMentionText;
  const blockSeparator = options.blockSeparator ?? "\n\n";

  const blocks: string[] = [];
  doc.forEach((node) => {
    blocks.push(serializeBlock(node, renderMention));
  });

  return blocks.filter((block) => block !== "").join(blockSeparator);
}
