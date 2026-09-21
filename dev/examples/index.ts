import type { Component } from "vue";

import BasicExample from "./BasicExample.vue";
import basicSource from "./BasicExample.vue?raw";
import MultiTriggerExample from "./MultiTriggerExample.vue";
import multiTriggerSource from "./MultiTriggerExample.vue?raw";
import AsyncSourceExample from "./AsyncSourceExample.vue";
import asyncSourceSource from "./AsyncSourceExample.vue?raw";
import PlaceholderExample from "./PlaceholderExample.vue";
import placeholderSource from "./PlaceholderExample.vue?raw";
import RowsExample from "./RowsExample.vue";
import rowsSource from "./RowsExample.vue?raw";
import MentionChipExample from "./MentionChipExample.vue";
import mentionChipSource from "./MentionChipExample.vue?raw";
import CustomItemSlot from "./CustomItemSlot.vue";
import customItemSource from "./CustomItemSlot.vue?raw";
import ThemingExample from "./ThemingExample.vue";
import themingSource from "./ThemingExample.vue?raw";
import ChatInputExample from "./ChatInputExample.vue";
import chatInputSource from "./ChatInputExample.vue?raw";
import EditableExample from "./EditableExample.vue";
import editableSource from "./EditableExample.vue?raw";
import DisabledExample from "./DisabledExample.vue";
import disabledSource from "./DisabledExample.vue?raw";
import ProgrammaticExample from "./ProgrammaticExample.vue";
import programmaticSource from "./ProgrammaticExample.vue?raw";
import RichTextExample from "./RichTextExample.vue";
import richTextSource from "./RichTextExample.vue?raw";
import ExtraAttributesExample from "./ExtraAttributesExample.vue";
import extraAttributesSource from "./ExtraAttributesExample.vue?raw";
import ModalExample from "./ModalExample.vue";
import modalSource from "./ModalExample.vue?raw";
import AiResourceExample from "./AiResourceExample.vue";
import aiResourceSource from "./AiResourceExample.vue?raw";
import AiSkillExample from "./AiSkillExample.vue";
import aiSkillSource from "./AiSkillExample.vue?raw";
import AiTextRefExample from "./AiTextRefExample.vue";
import aiTextRefSource from "./AiTextRefExample.vue?raw";

/** 画廊分组：按「先会用 → 再好看 → 再交互 → 再集成 → AI 场景」的学习顺序排列 */
export const ExampleGroup = {
  /** 3 个示例：最小可用、多触发符、异步数据源 */
  start: "入门",
  /** 5 个示例：占位、高度、候选列表、提及块、主题 */
  appearance: "外观定制",
  /** 4 个示例：提交、只读、禁用、实例方法 */
  state: "交互与状态",
  /** 3 个示例：StarterKit 组合、自定义字段落库、弹窗容器 */
  integration: "集成与持久化",
  /** 3 个示例：@ 资源、/ 技能、# 长文本 */
  ai: "AI 场景",
} as const;

/**
 * 示例用到的能力清单。
 *
 * 这是示例的「说明书」：回答三个问题 —— 绑了什么值、触发了什么事件、
 * 用了哪些 props / 插槽 / 方法 / 触发符配置，以及这个效果是怎么做出来的。
 * 新增示例必须填写，画廊会统一渲染成「速览」面板。
 */
export interface ExampleUsage {
  /** 与示例绑定的值（v-model / 本地 state），说明各自承载什么 */
  bindings: string[];
  /** 监听的事件与用途 */
  events?: string[];
  /** 用到的 props（模板里怎么写也一并给出） */
  props?: string[];
  /** 用到的插槽（含插槽参数） */
  slots?: string[];
  /** 用到的 ref 方法 */
  methods?: string[];
  /** 用到的 triggers[] 配置项 */
  triggerOptions?: string[];
  /** 用到的设计令牌（CSS 变量） */
  tokens?: string[];
  /** 实现要点：这个效果是怎么来的（每条对应一个可验证的行为） */
  highlights: string[];
}

export interface ExampleItem {
  id: string;
  /** 侧边栏分组 */
  group: string;
  title: string;
  /** 一句话亮点：这个示例值得看什么 */
  description: string;
  /** 覆盖到的能力点，便于按需查找 */
  tags: string[];
  /** 能力说明（绑定 / 事件 / API / 实现要点） */
  usage: ExampleUsage;
  fileName: string;
  component: Component;
  /** 该示例的源码（由 ?raw 导入，永远与实现保持同步） */
  source: string;
}

export const examples: ExampleItem[] = [
  // ===== 入门 =====
  {
    id: "basic",
    group: ExampleGroup.start,
    title: "基础用法",
    description: "一个触发符 + 静态数据源 + v-model 双向绑定，最小可用示例。",
    tags: ["v-model", "triggers", "placeholder", "getHTML"],
    fileName: "dev/examples/BasicExample.vue",
    component: BasicExample,
    source: basicSource,
    usage: {
      bindings: [
        "content → v-model（纯文本，默认格式）",
        "html / markdown → getHTML() / getMarkdown() 的结果（扩展输出）",
        "tokenMode → 切换提及在文本里的形态（@u1 / @张三）",
      ],
      events: [
        "update:modelValue：v-model 自动同步，无需手动监听",
        "@ready / @change：刷新扩展输出的展示",
      ],
      props: [":triggers", ":text-value（token / resolve）", "placeholder", ":min-height"],
      methods: ["getHTML()", "getMarkdown()", "getText({ token })"],
      triggerOptions: ["char：'@'", "label：面板标题", "items：静态数组（本地过滤）"],
      highlights: [
        "默认就是文本值：v-model 是能直接提交给后端 / 大模型的一条字符串，提及写成 `@ + id`",
        "想让值直接可读：`textValue.token: 'label'` → v-model 变成 `@张三`，回显时用 resolve 换回真实 id",
        "需要富文本时再取扩展输出：getHTML()（含标签）/ getMarkdown() / getJSON()；getText({ token }) 可随时切换形态",
      ],
    },
  },
  {
    id: "multi-trigger",
    group: ExampleGroup.start,
    title: "多触发符",
    description: "一个编辑器里 @ 提及成员、# 插入标签、/ 触发指令，并监听选中事件。",
    tags: ["triggers", "mention:select"],
    fileName: "dev/examples/MultiTriggerExample.vue",
    component: MultiTriggerExample,
    source: multiTriggerSource,
    usage: {
      bindings: ["content → v-model", "选中记录 → 展示 mention:select 的载荷"],
      events: ["@mention:select：候选项被选中时派发 { item, trigger, editor }"],
      props: [":triggers（三个触发符）", ":min-height"],
      triggerOptions: ["char：'@' / '#' / '/'", "label：每个触发符独立的面板标题"],
      highlights: [
        "一处配置多个触发符：每个 char 有独立的数据源、面板标题与插入命令",
        "选中后 chip 会记住来源触发符（mentionSuggestionChar），可以按来源写不同样式",
        "@mention:select 适合做埋点或联动（示例把最近一次选中项打了出来）",
      ],
    },
  },
  {
    id: "async-source",
    group: ExampleGroup.start,
    title: "异步数据源（防抖 + 中断）",
    description:
      "数据来自接口时配置 debounce 与 minQueryLength，组件会传入 AbortSignal 中断过期请求。",
    tags: ["debounce", "minQueryLength", "AbortSignal"],
    fileName: "dev/examples/AsyncSourceExample.vue",
    component: AsyncSourceExample,
    source: asyncSourceSource,
    usage: {
      bindings: ["content → v-model", "请求日志 → 观察防抖与中断效果"],
      props: [":triggers", ":min-height"],
      triggerOptions: [
        "items：异步函数 ({ query, signal }) => Promise<Item[]>",
        "debounce：输入停顿多久才发请求",
        "minQueryLength：至少输入几个字符",
      ],
      highlights: [
        "items 返回 Promise 即视为服务端数据源：结果原样使用，不再做本地过滤",
        "debounce 合并连续输入，axios / fetch 把 signal 透传给请求即可被中断",
        "被中断的请求静默忽略，不会把过期结果写进面板",
      ],
    },
  },

  // ===== 外观定制 =====
  {
    id: "placeholder",
    group: ExampleGroup.appearance,
    title: "占位内容（字符串 / 行内块组件）",
    description: "placeholder 支持字符串、VNode（如 kbd 行内块）以及 #placeholder 插槽。",
    tags: ["placeholder", "#placeholder", "VNode"],
    fileName: "dev/examples/PlaceholderExample.vue",
    component: PlaceholderExample,
    source: placeholderSource,
    usage: {
      bindings: ["stringContent / vnodeContent / slotContent → 三个独立的 v-model"],
      props: ['placeholder="文案"', ":placeholder=\"h('span', …)\"（VNode 行内块）", ":min-rows"],
      slots: ["#placeholder：完全接管占位内容（优先级高于 placeholder 属性）"],
      highlights: [
        "三种写法并列对比：字符串、h() 生成的 VNode、插槽，切换成本为零",
        "内容非空自动隐藏；disabled 状态下不显示，避免误导成可输入",
        "占位浮层是组件内置的（不依赖 tiptap Placeholder 扩展），所以不会被编辑区滚动带走",
      ],
    },
  },
  {
    id: "rows",
    group: ExampleGroup.appearance,
    title: "按行数自适应高度",
    description: "min-rows / max-rows：不足最小行保持高度，超出自动撑开，超过最大行出现滚动条。",
    tags: ["minRows", "maxRows", "自适应高度"],
    fileName: "dev/examples/RowsExample.vue",
    component: RowsExample,
    source: rowsSource,
    usage: {
      bindings: ["content → v-model", "preset → 切换 min/max 组合", "lineCount → 展示当前行数"],
      events: ["@change：内容变化时统计行数（payload 含 text / value / isEmpty）"],
      props: [":min-rows", ":max-rows"],
      methods: ["getText()：把文档转成纯文本用于数行"],
      highlights: [
        "高度 = 实测行高 × 行数 + 上下内边距：换字号 / 换行高也能自适应",
        "不足 min-rows 保持最小高度，超过后自动撑开，到达 max-rows 由滚动条接管",
        "显式传 min-height / max-height 时优先于行数配置（像素级控制）",
      ],
    },
  },
  {
    id: "mention-chip",
    group: ExampleGroup.appearance,
    title: "自定义提及块结构",
    description:
      "用 mention-render-html + extra-attributes 把提及渲染成「图标 + 文件名 + 体积」chip。",
    tags: ["mentionRenderHtml", "extraAttributes", "chip"],
    fileName: "dev/examples/MentionChipExample.vue",
    component: MentionChipExample,
    source: mentionChipSource,
    usage: {
      bindings: [
        "content → v-model（纯文本 `@ + id`）",
        "html → getHTML() 的结果（扩展输出，含 data-* 属性）",
      ],
      props: [":extra-attributes", ":mention-render-html", ":triggers", ":min-rows"],
      methods: ["getHTML()：查看 chip 的 data-* 属性"],
      triggerOptions: ["char：'@'", "items：资源数组（含 kind / thumb / size）"],
      highlights: [
        "extraAttributes 用 parseHTML / renderHTML 声明字段映射，自定义字段随节点写进 HTML 与 JSON",
        "mentionRenderHtml 决定 DOM 结构：图标（或缩略图）+ 只截断文件名 + 体积",
        "v-model 默认是纯文本（`@ + id`）；要看结构用 getHTML()，示例里两个面板对照展示",
      ],
    },
  },
  {
    id: "custom-item",
    group: ExampleGroup.appearance,
    title: "自定义候选项（#item 插槽）",
    description: "用 #item 插槽完全接管候选项结构，示例带上了头像与关键词高亮。",
    tags: ["#item", "slot", "selected"],
    fileName: "dev/examples/CustomItemSlot.vue",
    component: CustomItemSlot,
    source: customItemSource,
    usage: {
      bindings: ["content → v-model"],
      props: [":triggers", ":min-height", "placeholder"],
      slots: ["#item：参数 item / index / query / selected / trigger"],
      triggerOptions: ["char / label / items"],
      highlights: [
        "#item 拿到 query 后自己做关键词高亮，样式完全自定义",
        "selected 参数用于高亮当前项；↑↓ 移动、滚动跟随、Enter 选择仍由组件处理",
        "面板外壳仍是 .vme-popup（可配 popupClass 追加类名），面板宽度用 --vme-popup-min/max-width 控制",
      ],
    },
  },
  {
    id: "theming",
    group: ExampleGroup.appearance,
    title: "主题与 CSS 变量",
    description: '两层设计令牌 + 深色预设：给容器加 data-vme-theme="dark" 即可整体换肤。',
    tags: ["设计令牌", "data-vme-theme", "dark"],
    fileName: "dev/examples/ThemingExample.vue",
    component: ThemingExample,
    source: themingSource,
    usage: {
      bindings: ["content → v-model", "dark → 明暗开关"],
      props: [":triggers（含 container，让面板继承容器令牌）", ":min-height"],
      triggerOptions: ["container：把面板挂到当前容器，深色令牌才生效"],
      tokens: [
        "--vme-bg / --vme-text-color / --vme-border-color",
        "--vme-mention-bg / --vme-mention-color（提及块）",
        "--vme-popup-bg / --vme-item-active-bg（面板与候选项）",
      ],
      highlights: [
        "两层令牌：基础层（调色板 / 间距）不动，只覆盖语义层即可换肤",
        '深色只需给容器加 data-vme-theme="dark"，组件内没有裸值',
        "面板默认挂到 body，所以要显式指定 trigger.container 才能跟着容器变色",
      ],
    },
  },

  // ===== 交互与状态 =====
  {
    id: "chat-input",
    group: ExampleGroup.state,
    title: "聊天输入框",
    description: "submit-on-enter 发送、Shift + Enter 换行、按钮发送与消息回显（含提及 chip）。",
    tags: ["submitOnEnter", "submit", "maxHeight"],
    fileName: "dev/examples/ChatInputExample.vue",
    component: ChatInputExample,
    source: chatInputSource,
    usage: {
      bindings: ["draft → v-model（纯文本草稿）", "messages → 已发送消息列表"],
      events: [
        "@submit：Enter 提交时派发完整 payload（value / html / text / json / editor / isEmpty）",
      ],
      props: ["submit-on-enter", ":min-height", ":max-height", ":triggers"],
      methods: ["clear()：发送后清空输入框"],
      highlights: [
        "submit-on-enter 在 Enter 时阻止换行并派发 submit，Shift + Enter 仍可换行",
        "草稿是纯文本（默认格式）：直接就能发给接口；消息气泡用 payload.html 回显保留 chip",
        "面板展开时 Enter 优先选中候选项（组件内部做了互斥，业务无需判断）",
      ],
    },
  },
  {
    id: "editable",
    group: ExampleGroup.state,
    title: "只读与自动聚焦",
    description: "editable 动态切换、autofocus 挂载聚焦，以及纯展示场景的写法。",
    tags: ["editable", "autofocus", "readonly"],
    fileName: "dev/examples/EditableExample.vue",
    component: EditableExample,
    source: editableSource,
    usage: {
      bindings: ["editable → 开关", "savedContent → v-model", "remountKey → 强制重新挂载"],
      props: [
        ":editable",
        ":text-value（按 id 还原展示信息）",
        ":model-value（只读展示可不用 v-model）",
      ],
      highlights: [
        "只读回显也用文本值：`@u2` + textValue.resolve 就能渲染成 chip",
        "editable=false 时内容仍可选中复制，只是不能输入（适合消息展示）",
        "autofocus 只在挂载时生效：要重新聚焦就换 :key 重新挂载（示例里的按钮）",
      ],
    },
  },
  {
    id: "disabled",
    group: ExampleGroup.state,
    title: "正常 / 只读 / 禁用",
    description: "editable 与 disabled 的语义差别：只读可复制，禁用置灰且不可聚焦。",
    tags: ["disabled", "editable"],
    fileName: "dev/examples/DisabledExample.vue",
    component: DisabledExample,
    source: disabledSource,
    usage: {
      bindings: ["mode → 三种状态切换", "content → v-model（文本值 `@u2`）"],
      props: [
        ":editable=\"mode !== 'readonly'\"",
        ":disabled=\"mode === 'disabled'\"",
        ":text-value",
        ":min-rows",
      ],
      highlights: [
        "disabled 优先级高于 editable：置灰、不可聚焦、不派发 focus / blur",
        "只读（editable=false）保留选中复制与滚动，适合展示历史内容",
        "禁用状态隐藏占位文案，避免看起来像可以输入",
      ],
    },
  },
  {
    id: "programmatic",
    group: ExampleGroup.state,
    title: "通过 ref 操作编辑器",
    description:
      "insertMention / setContent / getHTML / getText / getJSON / clear / focus / blur 全量演示。",
    tags: ["ref", "insertMention", "getJSON"],
    fileName: "dev/examples/ProgrammaticExample.vue",
    component: ProgrammaticExample,
    source: programmaticSource,
    usage: {
      bindings: ["content → v-model", "output → 方法返回值"],
      props: [":triggers", ":min-height"],
      methods: [
        "focus() / blur()",
        "insertMention(item, char?)：指定触发符插入",
        "setContent(text) / clear()",
        "getHTML() / getText({ token }) / getMarkdown({ token }) / getJSON()",
      ],
      highlights: [
        "八个实例方法逐个点一遍，返回值直接显示在输出面板里",
        "值（v-model）默认是纯文本；HTML / Markdown / JSON 属于扩展输出，随时按需取",
        "insertMention(item, '#') 第二个参数指定触发符，程序化插入也能区分来源",
      ],
    },
  },

  // ===== 集成与持久化 =====
  {
    id: "rich-text",
    group: ExampleGroup.integration,
    title: "与 StarterKit 组合（加粗 / 列表）",
    description:
      'base-extensions=false 时由 StarterKit 提供基础节点，再配合工具栏操作加粗、斜体、列表与撤销（富文本场景用 value-format="html"）。',
    tags: ["baseExtensions", "extensions", "StarterKit", "valueFormat=html"],
    fileName: "dev/examples/RichTextExample.vue",
    component: RichTextExample,
    source: richTextSource,
    usage: {
      bindings: ["content → v-model", "editor → computed(editorRef.editor) 供工具栏使用"],
      props: [
        'base-extensions="false"',
        ':extensions="[StarterKit]"',
        'value-format="html"',
        ":min-height",
      ],
      methods: ["editor（实例）：直接调用 tiptap 命令，如 chain().focus().toggleBold().run()"],
      highlights: [
        'base-extensions="false" 关掉内置基础扩展，交给 StarterKit（避免重复注册节点）',
        '富文本必须用 value-format="html"：否则加粗 / 列表会在文本值里丢失',
        "换扩展不影响提及：mention 扩展始终由组件注入",
      ],
    },
  },
  {
    id: "extra-attributes",
    group: ExampleGroup.integration,
    title: "把自定义字段存进文档",
    description: "extra-attributes 声明头像、邮箱等字段，随节点写入 HTML 与 JSON，并演示后端回显。",
    tags: ["extraAttributes", "parseHTML", "renderHTML"],
    fileName: "dev/examples/ExtraAttributesExample.vue",
    component: ExtraAttributesExample,
    source: extraAttributesSource,
    usage: {
      bindings: ["content → v-model", "mentions → getMentions() 的读取结果"],
      props: [
        ":extra-attributes",
        'value-format="html"（本示例演示 HTML 落库）',
        ":triggers",
        ":min-height",
      ],
      methods: ["insertMention(item)", "getMentions()：读出全部提及节点的属性"],
      highlights: [
        "extraAttributes 里用 parseHTML / renderHTML 声明字段与 data-* 的映射关系",
        "字段随节点落进 HTML 与 JSON，回显时无需再查接口",
        "getMentions() 把文档里的提及属性收集起来，可直接提交后端（示例按钮）",
      ],
    },
  },
  {
    id: "modal",
    group: ExampleGroup.integration,
    title: "弹窗 / 抽屉内使用",
    description: "通过 trigger.container 指定面板挂载容器，避免浮层被弹窗裁剪或层级错乱。",
    tags: ["container", "Teleport"],
    fileName: "dev/examples/ModalExample.vue",
    component: ModalExample,
    source: modalSource,
    usage: {
      bindings: ["content → v-model", "visible → 弹窗开关"],
      props: [":triggers（container 指向弹窗容器）", ":min-height", ":max-height", "autofocus"],
      triggerOptions: ["container：面板挂载容器（选择器或元素）"],
      highlights: [
        "面板默认挂到 body，在弹窗里会被裁剪或压不住层级 —— 用 trigger.container 指定容器即可",
        "容器需要能继承到设计令牌（深色 / 自定义主题才不掉色）",
        "弹窗滚动、尺寸变化时面板位置自动跟随（tiptap mount + Floating UI）",
      ],
    },
  },

  // ===== AI 场景 =====
  {
    id: "ai-resource",
    group: ExampleGroup.ai,
    title: "资源提及（值为 @ + src）",
    description:
      "v-model 为纯文本 @+src；删除已上传资源时自动清理内容中的引用；悬浮可预览图片 / 播放视频音频。",
    tags: ["valueFormat", "mentionPool", "#mention-tip"],
    fileName: "dev/examples/AiResourceExample.vue",
    component: AiResourceExample,
    source: aiResourceSource,
    usage: {
      bindings: [
        "value → v-model（纯文本，形如 `@/uploads/beach.png`）",
        "resources → 资源池（同时也是 @ 的数据源）",
        "poolReady → 控制何时把资源池交给组件（未就绪时先不传）",
        "mentionAttrs → 当前文档里的提及节点",
      ],
      events: ["@mention:select：插入 / 替换后刷新提及列表"],
      props: [
        ":text-value（resolve 负责按 src 还原展示信息；v-model 默认就是文本值）",
        ":mention-pool（池内资源被删除时自动清理引用）",
        ":extra-attributes（kind / thumb / preview / size）",
        ":mention-render-html（缩略图 chip）",
        ":min-rows / :max-rows",
      ],
      slots: ["#mention-tip：图片 200px 等比、视频与音频 200px × 16:9 可直接播放"],
      methods: ["getMentions()", "insertMention(item)", "clear()", "refreshMentions()"],
      tokens: ["--vme-tip-media-width（默认 200px）", "--vme-tip-media-ratio（默认 16 / 9）"],
      highlights: [
        "默认文本值：v-model 就是 `@+src` 纯文本，可以直接提交给后端",
        "textValue.resolve 把 src 还原成带缩略图的 chip —— 刷新页面、回显历史消息都靠它",
        "绑定值先到、资源后到也能恢复：mention-pool 变化会自动补齐展示信息（也可手动 refreshMentions()），且不改动绑定值",
        "删除资源 → mention-pool 变化 → 内容里引用该资源的提及自动清理（prune-mentions 默认开启）",
        "悬浮预览完全由 #mention-tip 插槽决定，媒体尺寸用令牌控制，不是写死的",
      ],
    },
  },
  {
    id: "ai-skill",
    group: ExampleGroup.ai,
    title: "技能引用（/ 只能引用一个）",
    description:
      "triggers[].limit = 1 让技能只能引用一个，再次选择自动替换；悬浮展示完整技能描述。",
    tags: ["limit=1", "替换", "#mention-tip"],
    fileName: "dev/examples/AiSkillExample.vue",
    component: AiSkillExample,
    source: aiSkillSource,
    usage: {
      bindings: ["value → v-model（`/技能id + 提示词`）", "mentionCount → 已引用技能数量"],
      events: ["@mention:select：选中技能后刷新计数", "@change：内容变化后刷新计数"],
      props: [
        ":text-value / :extra-attributes / :mention-render-html（v-model 默认即文本值）",
        ":min-rows / :max-rows",
      ],
      triggerOptions: ["char：'/'", "limit：1", "onLimit：'replace'（默认，可改 'ignore'）"],
      slots: ["#mention-tip：展示完整技能名与描述"],
      methods: ["getMentions()：统计当前引用数量"],
      highlights: [
        "triggers[].limit = 1：再次选择自动替换已有技能，业务侧零代码",
        "想改成「已达上限就忽略」只需 onLimit: 'ignore'",
        "chip 用 / 徽标 + 名称省略号，完整名称放在悬浮提示里",
      ],
    },
  },
  {
    id: "ai-text-ref",
    group: ExampleGroup.ai,
    title: "长文本引用（# 资料片段）",
    description: "用 # 引用知识库片段，chip 只显示标题并省略过长内容，悬浮提示里滚动查看完整正文。",
    tags: ["#", "悬浮提示", "长文本"],
    fileName: "dev/examples/AiTextRefExample.vue",
    component: AiTextRefExample,
    source: aiTextRefSource,
    usage: {
      bindings: ["value → v-model（`#资料id + 指令`）"],
      props: [
        ":text-value / :extra-attributes（content / source）（v-model 默认即文本值）",
        ":mention-render-html（# 徽标 chip）",
        ":mention-hover（delay / placement / offset）",
        ":min-rows / :max-rows",
      ],
      slots: ["#mention-tip：滚动查看完整正文"],
      triggerOptions: ["char：'#'", "items：资料数组"],
      highlights: [
        "chip 只显示标题：# 徽标固定可见，标题超长用省略号，不会撑乱行高",
        "正文不进编辑器：extraAttributes 存 content / source，悬浮时才渲染",
        "mention-hover 可配置延迟与方位（示例用 bottom-start 避免盖住标题）",
      ],
    },
  },
];

export const exampleGroups: string[] = [...new Set(examples.map((example) => example.group))];
