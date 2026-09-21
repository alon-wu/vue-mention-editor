import type { Attributes, Editor, Extensions, JSONContent } from "@tiptap/core";
import type { MentionOptions } from "@tiptap/extension-mention";
import type { SuggestionPlacement } from "@tiptap/suggestion";
import type { VNodeChild } from "vue";

/** 追加到 mention 节点上的属性声明（tiptap `Attributes` 的别名，免得你再从 @tiptap/core 引入） */
export type MentionAttributes = Attributes;

/** mention 节点 HTML 结构规则（透传 tiptap Mention 的 renderHTML） */
export type MentionRenderHTML = NonNullable<MentionOptions["renderHTML"]>;

/** mention 节点文本化规则（用于 getText / 文本值模式） */
export type MentionRenderText = NonNullable<MentionOptions["renderText"]>;

/** @deprecated 旧版标签渲染规则（tiptap 已标记弃用，建议用 renderText / renderHTML） */
export type MentionRenderLabel = NonNullable<MentionOptions["renderLabel"]>;

/** 候选项：会被插入到文档中，除 id/label 外的字段会原样保存在 mention 节点属性里 */
export interface MentionItem {
  /** 唯一标识，回显与落库依赖该字段 */
  id: string;
  /** 展示文本，同时也是渲染在编辑器内的文本 */
  label: string;
  /** 头像地址 */
  avatar?: string;
  /** 次要描述，如邮箱、部门 */
  description?: string;
  /** 其它需要持久化的字段（需配合 extraAttributes 声明为节点属性） */
  [key: string]: unknown;
}

/** 数据源回调的上下文 */
export interface MentionQueryContext {
  /** 触发符之后的查询串（不含触发符） */
  query: string;
  /** 命中的触发符，如 '@' */
  trigger: string;
  /** 中止信号，组件销毁或查询变更时触发 */
  signal: AbortSignal;
}

/**
 * 数据源：
 * - `MentionItem[]` 或同步函数（如 `() => resources.value`）：本地按 `filter` 过滤；
 * - 异步函数：结果原样使用（视为服务端已过滤），支持 `AbortSignal` 中断。
 */
export type MentionItemsSource =
  MentionItem[] | ((context: MentionQueryContext) => MentionItem[] | Promise<MentionItem[]>);

/** 单个触发符的配置，可配置多个（@ 提及用户、# 提及标签……） */
export interface MentionTrigger {
  /** 触发字符，如 '@'、'#' */
  char: string;
  /** 数据源 */
  items: MentionItemsSource;
  /** 面板头部标题 */
  label?: string;
  /** 无结果时的提示文案 */
  emptyText?: string;
  /** 是否允许查询串中出现空格 */
  allowSpaces?: boolean;
  /** 允许出现在触发符前的字符，默认 `[' ']`（即行首或空格后）；传 `null` 表示不限制 */
  allowedPrefixes?: string[] | null;
  /** 最少输入几个字符后才开始查询 */
  minQueryLength?: number;
  /** 异步查询防抖毫秒数 */
  debounce?: number;
  /** 面板相对光标的弹出位置 */
  placement?: SuggestionPlacement;
  /** 面板偏移量 */
  offset?: { mainAxis?: number; crossAxis?: number };
  /** 面板挂载容器（默认 document.body）；在弹窗 / 抽屉内建议显式指定，避免被容器裁剪 */
  container?: string | HTMLElement;
  /** 面板根元素追加的 class，便于按触发符定制候选列表结构样式 */
  popupClass?: string;
  /** 自定义过滤逻辑，默认按 label / id / description 做包含匹配 */
  filter?: (item: MentionItem, query: string) => boolean;
  /**
   * 该触发符允许同时存在的引用数量（例：技能只能选一个则设为 1）。
   * 不设置则不限制。
   */
  limit?: number;
  /** 达到上限时的行为：`replace` 替换已有引用（默认），`ignore` 忽略本次选择 */
  onLimit?: "replace" | "ignore";
}

/** 候选列表渲染插槽参数 */
export interface MentionItemSlotProps {
  item: MentionItem;
  index: number;
  query: string;
  selected: boolean;
  trigger: string;
}

/** 值格式：`text`（默认，纯文本，提及序列化为 `@ + id`）或 `html`（富文本） */
export type MentionValueFormat = "text" | "html";

/**
 * 文本里提及的 token 形式：
 * - `id`（默认）：`@u1` —— 稳定、可往返，适合提交给后端 / 大模型；
 * - `label`：`@张三` —— 值本身就是可读的，回显时用 `resolve` 把 label 换回真实 `id`。
 */
export type MentionTextToken = "id" | "label";

/** 取值时的提及渲染选项（`getText` / `getMarkdown`） */
export interface MentionTextRenderOptions {
  /** 提及渲染成 `@ + token`，默认 `label`（可读） */
  token?: MentionTextToken;
}

/** 值格式为纯文本时的解析与序列化规则 */
export interface MentionTextValueOptions {
  /** 段落之间的分隔符，默认 `\n` */
  blockSeparator?: string;
  /**
   * 文本里提及用什么当 token，默认 `id`；
   * 想让 v-model 直接可读（`@张三`）就设为 `'label'`，回显时用 `resolve` 换回真实 id。
   */
  token?: MentionTextToken;
  /** 触发符之后 token 的正则（字符串形式，不含触发符），默认 `\S+` */
  tokenPattern?: string;
  /** token → 候选项，用于恢复 label / avatar 等展示信息 */
  resolve?: (token: string, trigger: string) => MentionItem | undefined;
  /** mention 节点 → 文本，默认 `@ + id` */
  renderMention?: (attrs: Record<string, unknown>) => string;
  /**
   * 解析时触发符前面允许出现的字符，默认 `[' ']`（即行首或空格后）；`null` 表示不限制。
   * 默认值可以避免把 `zhangsan@example.com` 这类普通文本误判成提及。
   */
  allowedPrefixes?: string[] | null;
}

/** 自定义候选渲染函数（对应 #item 插槽） */
export type MentionItemRenderer = (props: MentionItemSlotProps) => VNodeChild;

/** 编辑区内提及块的悬浮提示配置 */
export interface MentionHoverOptions {
  /** 显示延迟（毫秒），默认 120 */
  delay?: number;
  /** 鼠标移开后的隐藏延迟（毫秒），默认 80 */
  hideDelay?: number;
  /** 浮层方位，默认 `top-start` */
  placement?: SuggestionPlacement;
  /** 与提及块的距离（像素），默认 8 */
  offset?: number;
  /** 浮层挂载容器，默认 `document.body` */
  container?: string | HTMLElement;
}

/** `#mention-tip` 插槽参数 */
export interface MentionTipSlotProps {
  /** 提及块的节点属性（id / label / mentionSuggestionChar 及 extraAttributes 声明的字段） */
  attrs: Record<string, unknown>;
  id: string;
  label: string;
  /** 命中的触发符，如 `@`、`/`、`#` */
  trigger: string;
  /** 立即关闭浮层（例如媒体加载失败时） */
  hide: () => void;
}

/** 选中某个候选项后派发 */
export interface MentionSelectPayload {
  item: MentionItem;
  trigger: string;
  editor: Editor;
}

/** 内容变化后派发 */
export interface MentionChangePayload {
  /**
   * 当前值：默认（text 格式）为纯文本，提及写成 `@ + id`；
   * `valueFormat: 'html'` 时为 HTML。
   */
  value: string;
  /** 当前值的 HTML 形式（扩展输出，始终为 HTML） */
  html: string;
  /** 纯文本形式（mention 节点序列化为 `@id`） */
  text: string;
  json: JSONContent;
  editor: Editor;
  isEmpty: boolean;
}

/** mention 扩展单个触发符的建议项配置 */
export type MentionSuggestionOptions = MentionOptions["suggestions"][number];

/** tiptap suggestion 的 render 返回值 */
export type MentionSuggestionRenderer = ReturnType<NonNullable<MentionSuggestionOptions["render"]>>;

/** MentionEditor 组件 props */
export interface MentionEditorProps {
  /** 编辑器内容（v-model）：默认纯文本（提及为 `@ + id`），`valueFormat: 'html'` 时为 HTML */
  modelValue?: string;
  /**
   * 空内容时的占位内容：
   * - 字符串：普通文案
   * - VNode（`h('span', ...)`）：支持行内块组件
   * - 也可用 `#placeholder` 插槽
   */
  placeholder?: string | VNodeChild;
  /** 触发符配置，默认使用一个空数据源的 '@' */
  triggers?: MentionTrigger[];
  /**
   * 基础扩展：默认 Document / Paragraph / Text / HardBreak（Shift+Enter 换行）/ UndoRedo。
   * 传 `false` 时不注入任何基础扩展（需自行提供，如 StarterKit），传数组则整体替换。
   */
  baseExtensions?: Extensions | false;
  /** 追加的扩展（如加粗、列表等能力） */
  extensions?: Extensions;
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否禁用：不可编辑、不可聚焦、置灰（优先级高于 editable） */
  disabled?: boolean;
  /** 挂载后是否自动聚焦到末尾 */
  autofocus?: boolean;
  /** Enter（不含 Shift）时派发 submit 事件并阻止默认换行 */
  submitOnEnter?: boolean;
  /** 编辑区最小高度（按行数），超过后自动擑开 */
  minRows?: number;
  /** 编辑区最大高度（按行数），超过后出现滚动条 */
  maxRows?: number;
  /** 编辑区最小高度，数字按 px 处理（显式设置时优先级高于 minRows） */
  minHeight?: string | number;
  /** 编辑区最大高度，超出滚动，数字按 px 处理（显式设置时优先级高于 maxRows） */
  maxHeight?: string | number;
  /** 候选面板无结果时的默认文案 */
  emptyText?: string;
  /** 追加到 mention 节点 DOM 上的 class */
  mentionClass?: string;
  /** 追加到 mention 节点上的自定义属性，如 { avatar: { default: null } } */
  extraAttributes?: MentionAttributes;
  /** 自定义 mention 节点的 HTML 结构（如缩略图 chip）；模板里写 `:mention-render-html` */
  mentionRenderHtml?: MentionRenderHTML;
  /** 自定义 mention 节点的文本化规则；模板里写 `:mention-render-text` */
  mentionRenderText?: MentionRenderText;
  /**
   * 值格式：默认 `text` —— v-model 直接是能提交给后端 / 大模型的纯文本（提及为 `@ + id`）；
   * 需要保留富文本（加粗、列表等）时设为 `html`。
   * 两种格式下都可以用 `getHTML()` / `getMarkdown()` / `getJSON()` 取扩展输出。
   */
  valueFormat?: MentionValueFormat;
  /** `valueFormat: 'text'` 时的解析与序列化规则 */
  textValue?: MentionTextValueOptions;
  /** 资源池：一旦传入，池中被移除的项会自动从内容里清理掉（见 pruneMentions） */
  mentionPool?: MentionItem[];
  /** 是否随 mentionPool 变化自动清理失效提及，默认 true */
  pruneMentions?: boolean;
  /**
   * 提及块悬浮提示：传 `true` 或配置对象开启（需提供 `#mention-tip` 插槽），传 `false` 关闭。
   * 组件负责命中检测与定位，内容完全由插槽决定（图片预览、视频播放、完整文本等）。
   */
  mentionHover?: boolean | MentionHoverOptions;
}

/** MentionList 组件 props */
export interface MentionListProps {
  items: MentionItem[];
  query: string;
  trigger: string;
  command: (item: MentionItem) => void;
  title?: string;
  emptyText?: string;
  loading?: boolean;
  renderItem?: MentionItemRenderer;
  /** 空状态自定义渲染（对应 #empty 插槽） */
  renderEmpty?: () => VNodeChild;
  /** 面板根元素追加的 class */
  popupClass?: string;
}

/** MentionEditor 通过 ref 暴露的方法 */
export interface MentionEditorExposed {
  /** tiptap 编辑器实例（挂载后可用） */
  editor: Editor | undefined;
  focus: () => void;
  blur: () => void;
  clear: () => void;
  /** 覆盖内容（自动适配 valueFormat） */
  setContent: (value: string) => void;
  getHTML: () => string;
  /**
   * 纯文本：默认渲染成可读的 `@ + label`；
   * 传 `{ token: 'id' }` 可拿到与 v-model 一致的 `@ + id` 形式。
   */
  getText: (options?: MentionTextRenderOptions) => string;
  /** 扩展输出：Markdown（传 `{ token: 'id' }` 可换成 id 形式） */
  getMarkdown: (options?: MentionTextRenderOptions) => string;
  getJSON: () => JSONContent | null;
  insertMention: (item: MentionItem, char?: string) => void;
  /** 读取文档中全部提及节点的属性 */
  getMentions: () => Record<string, unknown>[];
  /**
   * 移除匹配的提及节点（含其后的空格），返回移除数量。
   * 传数组按 id 匹配，传函数则自定义判定（例如按 src 匹配资源）。
   */
  removeMentions: (match: string[] | ((attrs: Record<string, unknown>) => boolean)) => number;
  /**
   * 按 `textValue.resolve` 重新解析文档里的提及，补齐标题 / 缩略图等展示字段，返回更新数量。
   * 绑定值先到、对应数据后到时调用（传了 `mentionPool` 时资源池变化会自动执行）。
   */
  refreshMentions: () => number;
}
