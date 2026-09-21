# 类型定义

所有类型均从包入口导出，可按需引入：

```ts
import type {
  MentionItem,
  MentionTrigger,
  MentionItemsSource,
  MentionQueryContext,
  MentionAttributes,
  MentionChangePayload,
  MentionSelectPayload,
  MentionItemSlotProps,
  MentionItemRenderer,
  MentionEditorProps,
  MentionEditorExposed,
  MentionListProps,
  MentionSuggestionOptions,
  MentionSuggestionRenderer,
} from "vue-mention-editor";
```

## MentionItem

候选项：插入到文档中的实体。

```ts
interface MentionItem {
  /** 唯一标识，回显与落库依赖该字段 */
  id: string;
  /** 展示文本，同时也是渲染在编辑器内的文本 */
  label: string;
  /** 头像地址（内置面板会渲染） */
  avatar?: string;
  /** 次要描述，如邮箱、部门（内置面板会渲染） */
  description?: string;
  /** 其它需要持久化的字段（需配合 extraAttributes 声明为节点属性） */
  [key: string]: unknown;
}
```

## MentionItemsSource

数据源：数组（本地过滤）或函数（可异步）。

```ts
type MentionItemsSource =
  MentionItem[] | ((context: MentionQueryContext) => MentionItem[] | Promise<MentionItem[]>);
```

## MentionQueryContext

异步数据源回调的上下文。

```ts
interface MentionQueryContext {
  /** 触发符之后的查询串（不含触发符） */
  query: string;
  /** 命中的触发符，如 '@' */
  trigger: string;
  /** 中止信号：查询变化或组件销毁时触发 */
  signal: AbortSignal;
}
```

## MentionTrigger

单个触发符的完整配置。

```ts
interface MentionTrigger {
  /** 触发字符，如 '@'、'#' */
  char: string;
  /** 数据源 */
  items: MentionItemsSource;
  /** 面板头部标题 */
  label?: string;
  /** 空状态文案，覆盖组件级 emptyText */
  emptyText?: string;
  /** 查询串中允许空格 */
  allowSpaces?: boolean;
  /** 允许出现在触发符前的字符，默认 [' ']；null 表示不限制 */
  allowedPrefixes?: string[] | null;
  /** 最少输入字符数后才查询 */
  minQueryLength?: number;
  /** 异步查询防抖毫秒数 */
  debounce?: number;
  /** 面板相对光标的方位 */
  placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";
  /** 面板偏移 */
  offset?: { mainAxis?: number; crossAxis?: number };
  /** 面板挂载容器（默认 document.body） */
  container?: string | HTMLElement;
  /** 自定义过滤逻辑 */
  filter?: (item: MentionItem, query: string) => boolean;
  /** 该触发符允许同时存在的引用数量（技能只能选一个则设 1） */
  limit?: number;
  /** 达到上限时的行为：`replace`（默认，替换已有引用）/ `ignore`（忽略本次选择） */
  onLimit?: "replace" | "ignore";
}
```

## 事件载荷

```ts
interface MentionChangePayload {
  value: string;
  html: string;
  text: string;
  json: JSONContent;
  editor: Editor;
  isEmpty: boolean;
}

interface MentionSelectPayload {
  item: MentionItem;
  trigger: string;
  editor: Editor;
}
```

## 值格式与渲染规则

```ts
/** 值格式：text（默认，纯文本，提及写成 `@ + id`）/ html（富文本） */
type MentionValueFormat = "text" | "html";

/** 文本里提及的 token 形式：id（默认，稳定可往返）/ label（可读） */
type MentionTextToken = "id" | "label";

/** 取值时的提及渲染选项（getText / getMarkdown） */
interface MentionTextRenderOptions {
  /** 提及渲染成 `@ + token`，默认 label（可读） */
  token?: MentionTextToken;
}

/** 文本值（默认格式）的解析与序列化规则 */
interface MentionTextValueOptions {
  /** 文本里提及用什么当 token，默认 id；设为 label 则值直接可读（回显用 resolve 换回 id） */
  token?: MentionTextToken;
  /** 段落分隔符，默认 `\n` */
  blockSeparator?: string;
  /** 触发符后 token 的正则（字符串形式，不含触发符），默认 `\S+` */
  tokenPattern?: string;
  /** token → 候选项（用于恢复 label / avatar 等展示信息） */
  resolve?: (token: string, trigger: string) => MentionItem | undefined;
  /** mention 节点 → 文本，默认 `@ + id`（优先级高于 token） */
  renderMention?: (attrs: Record<string, unknown>) => string;
  /** 解析时触发符前允许出现的字符，默认 `[' ']`（行首或空格后）；`null` 不限制 */
  allowedPrefixes?: string[] | null;
}

/** 提及块的 HTML 结构规则（透传 tiptap Mention 的 renderHTML） */
type MentionRenderHTML = NonNullable<MentionOptions["renderHTML"]>;

/** 提及块的文本化规则 */
type MentionRenderText = NonNullable<MentionOptions["renderText"]>;
```

## 插槽与渲染函数

```ts
interface MentionItemSlotProps {
  item: MentionItem;
  index: number;
  query: string;
  selected: boolean;
  trigger: string;
}

type MentionItemRenderer = (props: MentionItemSlotProps) => VNodeChild;

/** #mention-tip 插槽参数 */
interface MentionTipSlotProps {
  /** 提及块的全部节点属性（含 extraAttributes 声明的字段） */
  attrs: Record<string, unknown>;
  id: string;
  label: string;
  trigger: string;
  hide: () => void;
}

/** 悬浮提示配置 */
interface MentionHoverOptions {
  delay?: number; // 显示延迟，默认 120
  hideDelay?: number; // 隐藏延迟，默认 80
  placement?: "top-start" | "top" | "top-end" | "bottom-start" | "bottom" | "bottom-end";
  offset?: number; // 与提及块的距离，默认 8
  container?: string | HTMLElement; // 浮层挂载容器，默认 body
}
```

## 组件相关

```ts
interface MentionEditorProps {
  /* 见 API：Props */
}

interface MentionEditorExposed {
  editor: Editor | undefined;
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setContent: (value: string) => void;
  getHTML: () => string;
  getText: (options?: MentionTextRenderOptions) => string;
  getMarkdown: (options?: MentionTextRenderOptions) => string;
  getJSON: () => JSONContent | null;
  insertMention: (item: MentionItem, char?: string) => void;
  getMentions: () => Record<string, unknown>[];
  removeMentions: (match: string[] | ((attrs: Record<string, unknown>) => boolean)) => number;
}

interface MentionListProps {
  items: MentionItem[];
  query: string;
  trigger: string;
  command: (item: MentionItem) => void;
  title?: string;
  emptyText?: string;
  loading?: boolean;
  renderItem?: MentionItemRenderer;
  renderEmpty?: () => VNodeChild;
  popupClass?: string;
}
```

## 属性声明别名

```ts
/** tiptap Attributes 的别名，避免使用者在业务代码里再引入 @tiptap/core */
type MentionAttributes = Record<string, any>;
```

## 与 tiptap 类型的关系

```ts
/** mention 扩展中单个触发符的建议项配置（tiptap SuggestionOptions 的子集 + 自动注入 editor） */
type MentionSuggestionOptions = MentionOptions["suggestions"][number];

/** suggestion `render` 回调的返回值，自定义面板时直接复用 */
type MentionSuggestionRenderer = ReturnType<NonNullable<MentionSuggestionOptions["render"]>>;
```

## 相关

- [Props](./props.md)
- [扩展与底层能力](./extensions.md)
