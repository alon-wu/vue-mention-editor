import type { JSONContent } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MentionItem, MentionTextToken } from "../types";

export interface SerializeDocTextOptions {
  /** 块级节点之间的分隔符，默认 `\n` */
  blockSeparator?: string;
  /** mention 节点 → 文本，默认「触发符 + label」 */
  renderMention?: (attrs: Record<string, unknown>) => string;
}

/** 触发符 + id（文本值模式用：token 必须能回到同一个节点） */
export function idMentionText(attrs: Record<string, unknown>): string {
  const char = mentionChar(attrs);
  const id = attrs.id == null ? "" : String(attrs.id);
  return `${char}${id}`;
}

/** 触发符 + label（可读文本用，label 缺失时退回 id） */
export function defaultRenderMentionText(attrs: Record<string, unknown>): string {
  const char = mentionChar(attrs);
  const text = attrs.label ?? attrs.id ?? "";
  return `${char}${String(text)}`;
}

function mentionChar(attrs: Record<string, unknown>): string {
  return typeof attrs.mentionSuggestionChar === "string" ? attrs.mentionSuggestionChar : "@";
}

/**
 * 按 token 形式取「mention 节点 → 文本」渲染函数：
 * `id` 用于往返（写回后端），`label` 用于可读展示。
 */
export function mentionTextRenderer(token: MentionTextToken = "id") {
  return token === "label" ? defaultRenderMentionText : idMentionText;
}

/** 把文档序列化为纯文本，mention 节点按 `renderMention` 转换（默认 `@id`） */
export function serializeDocText(
  doc: ProseMirrorNode,
  options: SerializeDocTextOptions = {},
): string {
  const blockSeparator = options.blockSeparator ?? "\n";
  const renderMention = options.renderMention ?? defaultRenderMentionText;

  const inline = (node: ProseMirrorNode): string => {
    if (node.type.name === "mention") return renderMention(node.attrs as Record<string, unknown>);
    if (node.isText) return node.text ?? "";
    if (node.type.name === "hardBreak") return "\n";
    if (node.isLeaf) return "";
    let result = "";
    node.forEach((child) => {
      result += inline(child);
    });
    return result;
  };

  const blocks: string[] = [];
  doc.forEach((node) => blocks.push(inline(node)));
  return blocks.join(blockSeparator);
}

export interface ParseTextContentOptions {
  /** 触发符列表，默认 `['@']` */
  triggers?: string[];
  /** token 匹配规则（字符串形式的正则，不含触发符），默认 `\S+` */
  tokenPattern?: string;
  /** token → 候选项，用于恢复 label / avatar 等展示信息 */
  resolve?: (token: string, trigger: string) => MentionItem | undefined;
  /**
   * 文本里的 token 代表什么，默认 `id`：
   * - `'id'`：节点 id 固定为 token；
   * - `'label'`：节点 id 取 `resolve` 结果里的真实 id（解析不到时退化为 token）。
   */
  token?: MentionTextToken;
  /** 段落分隔符，默认 `\n` */
  blockSeparator?: string;
  /**
   * 触发符前面允许出现的字符，默认 `[' ']`（即行首或空格后）；`null` 表示不限制。
   * 默认值可以避免把 `zhangsan@example.com` 这类普通文本误判成提及。
   */
  allowedPrefixes?: string[] | null;
  /** 写入 mention 节点的额外属性 */
  mentionAttrs?: Record<string, unknown>;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 组装 token 正则，统一产出 3 个捕获组：`(前缀)(触发符)(token)`。
 * - `allowedPrefixes: null`：不限制前缀字符（前缀组可为空，不会吃掉触发符本身）；
 * - 数组：触发符必须在行首或位于这些字符之后。
 */
function createTokenPattern(
  triggers: string[],
  tokenPattern: string,
  allowedPrefixes?: string[] | null,
): RegExp {
  const chars = triggers.map(escapeRegExp).join("|");
  const suffix = `(${chars})(${tokenPattern})`;

  if (allowedPrefixes === null) {
    return new RegExp(`(^|[\\s\\S]?)${suffix}`, "g");
  }

  const prefixes = (allowedPrefixes ?? [" "]).map(escapeRegExp).join("");
  return new RegExp(prefixes ? `(^|[${prefixes}])${suffix}` : `(^)${suffix}`, "g");
}

/**
 * 把纯文本解析为 tiptap 文档 JSON：`@token` 还原为 mention 节点，其余是普通文本。
 *
 * 用于 `valueFormat: 'text'` 的「根据绑定值恢复」场景，
 * mention 节点的 id 会被固定为 token 本身，保证与文本值往返一致。
 */
export function parseTextToContent(
  text: string,
  options: ParseTextContentOptions = {},
): JSONContent {
  const triggers = options.triggers?.length ? options.triggers : ["@"];
  const tokenPattern = options.tokenPattern ?? "\\S+";
  const blockSeparator = options.blockSeparator ?? "\n";
  const pattern = createTokenPattern(triggers, tokenPattern, options.allowedPrefixes);

  const paragraphs: JSONContent[] = text.split(blockSeparator).map((line) => {
    const content: JSONContent[] = [];
    let cursor = 0;
    pattern.lastIndex = 0;

    let match = pattern.exec(line);
    while (match) {
      const prefix = match[1] ?? "";
      const trigger = match[2];
      const token = match[3];
      // 提及从触发符开始算，前缀字符（如果有）归普通文本
      const start = match.index + prefix.length;
      if (start > cursor) {
        content.push({ type: "text", text: line.slice(cursor, start) });
      }

      const item = options.resolve?.(token, trigger);
      const tokenIsLabel = options.token === "label";
      content.push({
        type: "mention",
        attrs: {
          ...(item ?? {}),
          ...options.mentionAttrs,
          // 默认：id 固定为 token，确保文本值往返一致
          // token 为 label 时：id 取 resolve 换回的真实 id（解析不到则退化为 token）
          id: tokenIsLabel ? String(item?.id ?? token) : token,
          label: item?.label ?? token,
          mentionSuggestionChar: trigger,
        },
      });

      cursor = start + trigger.length + token.length;
      match = pattern.exec(line);
    }

    if (cursor < line.length) content.push({ type: "text", text: line.slice(cursor) });
    return content.length ? { type: "paragraph", content } : { type: "paragraph" };
  });

  return { type: "doc", content: paragraphs };
}
