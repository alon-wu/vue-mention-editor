import { Mention } from "@tiptap/extension-mention";
import type { Editor, Range } from "@tiptap/core";
import type {
  MentionAttributes,
  MentionItem,
  MentionItemsSource,
  MentionQueryContext,
  MentionRenderHTML,
  MentionRenderLabel,
  MentionRenderText,
  MentionTrigger,
} from "../types";
import type { MentionRendererFactory } from "../core/suggestionRenderer";

export interface CreateMentionExtensionOptions {
  /** 触发符配置，支持多个 */
  triggers: MentionTrigger[];
  /** 为每个触发符创建候选面板渲染器 */
  render?: MentionRendererFactory;
  /**
   * 自定义「选中候选项后的插入行为」。
   * 不传则使用 tiptap mention 的内置命令；组件内部用它实现 limit / 替换语义与空格处理。
   */
  selectCommand?: (props: {
    editor: Editor;
    range: Range;
    item: MentionItem;
    trigger: MentionTrigger;
  }) => void;
  /** 追加到 mention 节点上的自定义属性 */
  extraAttributes?: MentionAttributes;
  /** 自定义 mention 节点的 HTML 结构 */
  renderHTML?: MentionRenderHTML;
  /** 自定义 mention 节点的文本化规则 */
  renderText?: MentionRenderText;
  /** @deprecated 使用 renderText / renderHTML 代替 */
  renderLabel?: MentionRenderLabel;
  /** 追加到 mention 节点 DOM 上的属性 */
  HTMLAttributes?: Record<string, unknown>;
}

/** 默认过滤规则：label / id / description 任一命中即可 */
function defaultFilter(item: MentionItem, query: string): boolean {
  const keyword = query.toLowerCase();
  return [item.label, item.id, item.description].some(
    (value) => typeof value === "string" && value.toLowerCase().includes(keyword),
  );
}

/**
 * 解析数据源：
 * - 数组 / **同步函数**：视为本地数据源，按 `filter`（默认 label / id / description 包含匹配）过滤；
 * - **异步函数**：视为服务端数据源，结果原样使用（过滤交给服务端）。
 *
 * > 同步函数常用于响应式列表（如 `items: () => resources.value`），也能享受内置过滤。
 */
export async function resolveMentionItems(
  source: MentionItemsSource,
  context: MentionQueryContext,
  filter: (item: MentionItem, query: string) => boolean = defaultFilter,
): Promise<MentionItem[]> {
  if (typeof source === "function") {
    try {
      const returned = source(context);
      const isSync = Array.isArray(returned);
      const items = await Promise.resolve(returned);
      const list = Array.isArray(items) ? items : [];

      if (!isSync) return list;

      const query = context.query.trim();
      if (!query) return list;
      return list.filter((item) => filter(item, query));
    } catch (error) {
      // 查询被中断属于正常流程，静默忽略即可
      if (context.signal?.aborted || (error as Error | undefined)?.name === "AbortError") {
        return [];
      }
      throw error;
    }
  }

  const query = context.query.trim();
  if (!query) return source;
  return source.filter((item) => filter(item, query));
}

/**
 * 光标紧贴提及时，Backspace / Delete 应该一次就删掉它。
 *
 * ProseMirror 的默认行为是先把原子节点选中（`selectNodeBackward`），要再按一次才删除；
 * 对聊天 / AI 输入框这类场景手感很差。删除时顺手吞掉紧邻的一个空格，避免留下双空格。
 */
function deleteAdjacentMention(editor: Editor, direction: "backward" | "forward"): boolean {
  const { state } = editor;
  const { selection } = state;
  if (!selection.empty) return false;

  const { $from } = selection;
  const node = direction === "backward" ? $from.nodeBefore : $from.nodeAfter;
  if (!node || node.type.name !== "mention") return false;

  let from = direction === "backward" ? $from.pos - node.nodeSize : $from.pos;
  let to = from + node.nodeSize;

  // 叶节点用 \u0000 占位，避免把相邻的另一个提及当成空格吞掉
  const docSize = state.doc.content.size;
  const after = state.doc.textBetween(to, Math.min(to + 1, docSize), "\n", "\u0000");
  const before = state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\u0000");
  if (after === " ") {
    to += 1;
  } else if (before === " ") {
    from -= 1;
  }

  return editor.chain().deleteRange({ from, to }).run();
}

/**
 * 创建 mention 节点扩展。
 *
 * 与官方 `Mention` 的差别：一次性声明多个触发符、内置数据源解析与防抖等建议项配置，
 * 以及「一键删除提及」的键盘手感修正。
 */
export function createMentionExtension(options: CreateMentionExtensionOptions) {
  const {
    triggers,
    render,
    extraAttributes,
    HTMLAttributes,
    renderHTML,
    renderText,
    renderLabel,
    selectCommand,
  } = options;

  // 需要额外属性时，扩展节点 schema，让 items 里的自定义字段可以随节点一起存取
  const MentionNode = Mention.extend({
    /**
     * 高于内置 keymap（默认 100）：让「一键删除提及」抢在 `selectNodeBackward` 之前生效。
     */
    priority: 1000,
    addKeyboardShortcuts() {
      return {
        Backspace: ({ editor }) => deleteAdjacentMention(editor, "backward"),
        Delete: ({ editor }) => deleteAdjacentMention(editor, "forward"),
      };
    },
    ...(extraAttributes
      ? {
          addAttributes() {
            const parent = (this.parent?.() ?? {}) as MentionAttributes;
            return { ...parent, ...extraAttributes };
          },
        }
      : {}),
  });

  return MentionNode.configure({
    HTMLAttributes: {
      class: "vme-mention",
      ...HTMLAttributes,
    },
    ...(renderText ? { renderText } : {}),
    ...(renderHTML ? { renderHTML } : {}),
    ...(renderLabel ? { renderLabel } : {}),
    suggestions: triggers.map((trigger, index) => {
      const suggestionRenderer = render?.(trigger, index);
      return {
        char: trigger.char,
        allowSpaces: trigger.allowSpaces,
        allowedPrefixes: trigger.allowedPrefixes,
        minQueryLength: trigger.minQueryLength,
        debounce: trigger.debounce,
        placement: trigger.placement,
        offset: trigger.offset,
        container: trigger.container,
        items: ({ query, signal }) =>
          resolveMentionItems(
            trigger.items,
            { query, trigger: trigger.char, signal },
            trigger.filter,
          ),
        ...(suggestionRenderer ? { render: () => suggestionRenderer } : {}),
        ...(selectCommand
          ? {
              command: ({ editor, range, props }) =>
                selectCommand({ editor, range, item: props as MentionItem, trigger }),
            }
          : {}),
      };
    }),
  });
}
