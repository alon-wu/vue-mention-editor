<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import type { StyleValue, VNodeChild } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import type { Editor, JSONContent, Range } from "@tiptap/core";
import {
  autoUpdate,
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
} from "@floating-ui/dom";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { UndoRedo } from "@tiptap/extensions";
import { createMentionExtension } from "../extensions/mention";
import { createSuggestionRenderer } from "../core/suggestionRenderer";
import { mentionTextRenderer, parseTextToContent, serializeDocText } from "../core/value";
import { serializeDocMarkdown } from "../core/markdown";
import { VNodeView } from "../core/vnodeView";
import type {
  MentionChangePayload,
  MentionEditorProps,
  MentionItem,
  MentionItemRenderer,
  MentionItemSlotProps,
  MentionSelectPayload,
  MentionTextRenderOptions,
  MentionTipSlotProps,
  MentionTrigger,
} from "../types";

defineOptions({ name: "MentionEditor" });

const props = withDefaults(defineProps<MentionEditorProps>(), {
  modelValue: "",
  placeholder: "",
  triggers: () => [],
  baseExtensions: undefined,
  extensions: () => [],
  editable: true,
  disabled: false,
  autofocus: false,
  submitOnEnter: false,
  minRows: undefined,
  maxRows: undefined,
  minHeight: undefined,
  maxHeight: undefined,
  emptyText: "无匹配结果",
  mentionClass: "",
  extraAttributes: undefined,
  mentionRenderHtml: undefined,
  mentionRenderText: undefined,
  valueFormat: "text",
  textValue: undefined,
  mentionPool: undefined,
  pruneMentions: true,
  mentionHover: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [html: string];
  change: [payload: MentionChangePayload];
  "mention:select": [payload: MentionSelectPayload];
  submit: [payload: MentionChangePayload];
  ready: [editor: Editor];
  focus: [editor: Editor];
  blur: [editor: Editor];
}>();

const slots = useSlots();

/**
 * 当前可用的编辑器实例。
 * 组件切换 / 卸载后可能还有排队中的回调（nextTick、watcher），
 * 此时 tiptap 实例已销毁，访问 `view` / `state` 会直接抛错，因此统一走这里取实例。
 */
function liveEditor(): Editor | undefined {
  const instance = editor.value;
  return instance && !instance.isDestroyed ? instance : undefined;
}

/** 当前打开的面板集合：面板打开时要让出 Enter 等按键 */
const openPopups = new Set<number>();

// 未配置触发符时保留一个空数据源的 '@'，保证组件可用
const effectiveTriggers: MentionTrigger[] = props.triggers.length
  ? props.triggers
  : [{ char: "@", items: [] }];

const baseExtensions =
  props.baseExtensions === false
    ? []
    : (props.baseExtensions ?? [Document, Paragraph, Text, HardBreak, UndoRedo]);

/** 文本值模式：v-model 为纯文本，mention 序列化为 `@+id` */
const isTextValue = props.valueFormat === "text";

// #item / #empty 插槽 → 渲染函数（面板在独立的 Vue 实例里渲染）
const renderItem: MentionItemRenderer | undefined = slots.item
  ? (slotProps: MentionItemSlotProps) => slots.item?.(slotProps) as VNodeChild
  : undefined;
const renderEmpty = slots.empty ? () => slots.empty?.() as VNodeChild : undefined;

/** 当前内容 → v-model 值（自动适配 valueFormat） */
function serializeValue(instance: Editor): string {
  if (!isTextValue) return instance.getHTML();
  return serializeDocText(instance.state.doc, {
    blockSeparator: props.textValue?.blockSeparator,
    // 默认用 id 作 token（与后端交换）；textValue.token='label' 时输出可读形式
    renderMention: props.textValue?.renderMention ?? mentionTextRenderer(props.textValue?.token),
  });
}

/** v-model 值 → 编辑器内容（文本模式会还原为 mention 节点） */
function toEditorContent(value: string): string | JSONContent {
  if (!isTextValue) return value;
  return parseTextToContent(value, {
    triggers: effectiveTriggers.map((trigger) => trigger.char),
    token: props.textValue?.token,
    tokenPattern: props.textValue?.tokenPattern,
    resolve: props.textValue?.resolve,
    blockSeparator: props.textValue?.blockSeparator,
    allowedPrefixes: props.textValue?.allowedPrefixes,
  });
}

function createPayload(instance: Editor): MentionChangePayload {
  return {
    value: serializeValue(instance),
    html: instance.getHTML(),
    text: serializeDocText(instance.state.doc),
    json: instance.getJSON(),
    editor: instance,
    isEmpty: instance.isEmpty,
  };
}

/** 占位内容（字符串 / VNode / 插槽） */
const isEmpty = ref(true);
const hasPlaceholder = computed(
  () => slots.placeholder !== undefined || (props.placeholder !== "" && props.placeholder != null),
);
const showPlaceholder = computed(() => isEmpty.value && !props.disabled && hasPlaceholder.value);
const isStringPlaceholder = computed(() => typeof props.placeholder === "string");

/** 可编辑 = editable 为真且未禁用 */
const canEdit = computed(() => props.editable !== false && !props.disabled);

const editor = useEditor({
  content: toEditorContent(props.modelValue ?? ""),
  editable: props.editable !== false && !props.disabled,
  autofocus: props.autofocus ? "end" : false,
  extensions: [
    ...baseExtensions,
    createMentionExtension({
      triggers: effectiveTriggers,
      extraAttributes: props.extraAttributes,
      HTMLAttributes: props.mentionClass
        ? { class: `vme-mention ${props.mentionClass}` }
        : undefined,
      renderHTML: props.mentionRenderHtml,
      renderText: props.mentionRenderText,
      // 统一走自定义插入命令：处理替换范围、空格与 trigger.limit 上限语义
      selectCommand: ({ editor: instance, range, item, trigger }) =>
        insertTriggeredMention({ editor: instance, item, trigger, range }),
      render: (trigger, index) =>
        createSuggestionRenderer({
          trigger,
          index,
          emptyText: props.emptyText,
          renderItem,
          renderEmpty,
          onActiveChange: (active) => {
            if (active) {
              openPopups.add(index);
            } else {
              openPopups.delete(index);
            }
          },
          onSelect: (item, selectedTrigger) => {
            const instance = editor.value;
            if (!instance) return;
            const payload: MentionSelectPayload = {
              item,
              trigger: selectedTrigger.char,
              editor: instance,
            };
            emit("mention:select", payload);
          },
        }),
    }),
    ...(props.extensions ?? []),
  ],
  editorProps: {
    attributes: {
      class: "vme-content",
      role: "textbox",
      "aria-multiline": "true",
    },
    handleKeyDown: (_view, event) => {
      // 候选面板展开时，键盘交给 tiptap suggestion 插件处理（选择候选项）
      if (openPopups.size > 0) return false;

      if (props.submitOnEnter && event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        const instance = editor.value;
        if (instance) emit("submit", createPayload(instance));
        return true;
      }
      return false;
    },
  },
  onCreate: ({ editor: instance }) => {
    isEmpty.value = instance.isEmpty;
    emit("ready", instance);
    nextTick(updateSizing);
  },
  onUpdate: ({ editor: instance }) => {
    const payload = createPayload(instance);
    isEmpty.value = payload.isEmpty;
    emit("update:modelValue", payload.value);
    emit("change", payload);
  },
  onFocus: ({ editor: instance }) => emit("focus", instance),
  onBlur: ({ editor: instance }) => emit("blur", instance),
});

// 外部 v-model 变化时同步进编辑器，避免光标跳动
watch(
  () => props.modelValue,
  (value) => {
    const instance = liveEditor();
    if (!instance) return;
    const next = value ?? "";
    if (next === serializeValue(instance)) return;
    instance.commands.setContent(toEditorContent(next), { emitUpdate: false });
    isEmpty.value = instance.isEmpty;
    // 外部恢复内容后：清理资源池里已不存在的引用，并补齐暂停未到位的展示信息
    pruneInvalidMentions();
    refreshMentions();
  },
);

watch(canEdit, (value) => editor.value?.setEditable(value));

/** 资源池签名：池内 id 不变就不触发清理 */
const poolSignature = computed(() =>
  (props.mentionPool ?? []).map((item) => String(item.id)).join("\u0000"),
);

/** 清理已不在资源池中的提及（未传 mentionPool 或 pruneMentions=false 时不生效） */
function pruneInvalidMentions() {
  if (!props.pruneMentions || !props.mentionPool) return;
  const ids = new Set(props.mentionPool.map((item) => String(item.id)));
  removeMentions((attrs) => !ids.has(String(attrs.id)));
}

/**
 * 资源池变化时：
 * 1. 清理已失效的提及（例：已上传的文件被删除）；
 * 2. 补齐展示信息 —— 资源列表比绑定值晚到时（异步加载），chip 会在这一步恢复成带缩略图的样子。
 */
watch(poolSignature, () => {
  pruneInvalidMentions();
  refreshMentions();
});

function toCssSize(value?: string | number) {
  return typeof value === "number" ? `${value}px` : value;
}

const sizingStyle = ref<Record<string, string | undefined>>({});

/**
 * 高度计算：minRows / maxRows 按实际行高换算为像素。
 * 内容超过最小行数会自动擑开，超过最大行数后由 CSS overflow-y 产生滚动条；
 * 显式传入 minHeight / maxHeight 时以其为准。
 */
function updateSizing() {
  const instance = liveEditor();
  const element = instance?.view.dom as HTMLElement | undefined;

  let lineHeight = 0;
  let paddingY = 0;
  if (element) {
    const styles = window.getComputedStyle(element);
    const fontSize = Number.parseFloat(styles.fontSize) || 14;
    const parsedLineHeight = Number.parseFloat(styles.lineHeight);
    lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.6;
    paddingY =
      (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
  }

  const rowsMinHeight =
    props.minRows && lineHeight
      ? `${Math.round(lineHeight * props.minRows + paddingY)}px`
      : undefined;
  const rowsMaxHeight =
    props.maxRows && lineHeight
      ? `${Math.round(lineHeight * props.maxRows + paddingY)}px`
      : undefined;

  sizingStyle.value = {
    "--vme-min-height": toCssSize(props.minHeight) ?? rowsMinHeight ?? "96px",
    "--vme-max-height": toCssSize(props.maxHeight) ?? rowsMaxHeight,
  };
}

watch(editor, () => nextTick(updateSizing));
watch(
  () => [props.minRows, props.maxRows, props.minHeight, props.maxHeight].join("|"),
  () => updateSizing(),
);
onMounted(() => nextTick(updateSizing));

const rootStyle = computed<StyleValue>(() => sizingStyle.value as StyleValue);

function insertMention(item: MentionItem, char?: string) {
  const instance = liveEditor();
  if (!instance) return;

  // 指定触发符时按 char 查找，未指定或找不到时退回第一个触发符
  const trigger = effectiveTriggers.find((candidate) => candidate.char === char) ??
    effectiveTriggers[0] ?? { char: "@", items: [] };

  insertTriggeredMention({ editor: instance, item, trigger });
}

interface MentionNodeInfo {
  attrs: Record<string, unknown>;
  from: number;
  to: number;
}

/** 收集文档中的全部提及节点（含位置） */
function collectMentions(instance: Editor): MentionNodeInfo[] {
  const result: MentionNodeInfo[] = [];
  instance.state.doc.descendants((node, pos) => {
    if (node.type.name === "mention") {
      result.push({
        attrs: node.attrs as Record<string, unknown>,
        from: pos,
        to: pos + node.nodeSize,
      });
    }
    return true;
  });
  return result;
}

function isSameTrigger(node: MentionNodeInfo, trigger: MentionTrigger): boolean {
  return String(node.attrs.mentionSuggestionChar ?? "@") === trigger.char;
}

/** 删除指定提及节点（连同其后紧跟的空格），一次事务完成 */
function deleteMentionNodes(instance: Editor, nodes: MentionNodeInfo[]): number {
  if (!nodes.length) return 0;

  const tr = instance.state.tr;
  // 从后往前删除，前面的位置不会受影响
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const { from, to } = nodes[index];
    let end = to;
    const after = tr.doc.resolve(Math.min(to, tr.doc.content.size)).nodeAfter;
    if (after?.isText && after.text?.startsWith(" ")) end = to + 1;
    tr.delete(from, end);
  }
  instance.view.dispatch(tr);

  return nodes.length;
}

/** 找到光标前紧邻的提及节点位置（用于识别「刚刚插入的那一个」） */
function findMentionBeforeCursor(instance: Editor): number | undefined {
  const cursor = instance.state.selection.from;
  let found: number | undefined;
  instance.state.doc.nodesBetween(Math.max(0, cursor - 4), cursor, (node, pos) => {
    if (node.type.name === "mention") found = pos;
  });
  return found;
}

/**
 * 触发符上限（`trigger.limit`）：
 * 超出数量时保留最近引用的若干个，其余删除，实现「已引用后再次引用 = 替换」。
 */
function enforceTriggerLimit(instance: Editor, trigger: MentionTrigger) {
  const limit = trigger.limit ?? 0;
  if (limit < 1) return;

  const same = collectMentions(instance).filter((node) => isSameTrigger(node, trigger));
  if (same.length <= limit) return;

  const keep = new Set<number>();
  const justInserted = findMentionBeforeCursor(instance);
  if (justInserted !== undefined && same.some((node) => node.from === justInserted)) {
    keep.add(justInserted);
  }
  for (const node of [...same].sort((a, b) => b.from - a.from)) {
    if (keep.size >= limit) break;
    keep.add(node.from);
  }

  deleteMentionNodes(
    instance,
    same.filter((node) => !keep.has(node.from)),
  );
}

/**
 * 选中候选项 / 程序化插入的统一入口：
 * - 面板选中时替换「触发符 + 查询串」范围，并吞掉多余空格
 * - 光标插入时按需补前置空格
 * - 最后按 `trigger.limit` 执行替换/忽略语义
 */
function insertTriggeredMention(payload: {
  editor: Editor;
  item: MentionItem;
  trigger: MentionTrigger;
  range?: Range;
}) {
  const { editor: instance, item, trigger, range } = payload;
  const limit = trigger.limit ?? 0;

  if (limit > 0 && trigger.onLimit === "ignore") {
    const current = collectMentions(instance).filter((node) => isSameTrigger(node, trigger));
    if (current.length >= limit) {
      if (range) instance.chain().focus().deleteRange(range).run();
      return;
    }
  }

  const attrs = { ...item, mentionSuggestionChar: trigger.char };

  if (range) {
    // 若替换范围后面紧跟空格，一并吞掉，避免出现两个连续空格
    const after = instance.state.doc.resolve(
      Math.min(range.to, instance.state.doc.content.size),
    ).nodeAfter;
    const to = after?.isText && after.text?.startsWith(" ") ? range.to + 1 : range.to;

    instance
      .chain()
      .focus()
      .insertContentAt({ from: range.from, to }, [
        { type: "mention", attrs },
        { type: "text", text: " " },
      ])
      .run();
  } else {
    // 光标前是普通字符（含其它提及节点）时补一个空格，避免 `@a@b` 这种粘连
    const { from } = instance.state.selection;
    const preceding = instance.state.doc.textBetween(Math.max(0, from - 1), from, "\n", "\u0000");
    const content: JSONContent[] = [];
    if (preceding.length > 0 && !/^\s$/.test(preceding)) content.push({ type: "text", text: " " });
    content.push({ type: "mention", attrs }, { type: "text", text: " " });

    instance.chain().focus().insertContent(content).run();
  }

  enforceTriggerLimit(instance, trigger);
}

// ===== 提及块悬浮提示（内容由 #mention-tip 插槽决定）=====

const tipSlot = computed(() => slots["mention-tip"]);
/** 只有提供了插槽且未显式关闭时才启用监听 */
const hoverEnabled = computed(() => props.mentionHover !== false && Boolean(tipSlot.value));

const hoverOptions = computed(() => {
  const value = typeof props.mentionHover === "object" ? props.mentionHover : undefined;
  return {
    delay: value?.delay ?? 120,
    hideDelay: value?.hideDelay ?? 80,
    placement: value?.placement ?? "top-start",
    offset: value?.offset ?? 8,
    container: value?.container,
  };
});

const tipContainer = computed(() => hoverOptions.value.container ?? "body");
const tipAttrs = ref<Record<string, unknown> | null>(null);
const tipAnchor = ref<HTMLElement | null>(null);
const tipEl = ref<HTMLElement | null>(null);
const tipVisible = computed(() => tipAttrs.value !== null);

const tipSlotProps = computed<MentionTipSlotProps | null>(() => {
  const attrs = tipAttrs.value;
  if (!attrs) return null;
  return {
    attrs,
    id: String(attrs.id ?? ""),
    label: String(attrs.label ?? attrs.id ?? ""),
    trigger: String(attrs.mentionSuggestionChar ?? "@"),
    hide: hideTip,
  };
});

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let stopAutoUpdate: (() => void) | undefined;

function cancelTimers() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
}

function hideTip() {
  cancelTimers();
  tipAttrs.value = null;
  tipAnchor.value = null;
  stopAutoUpdate?.();
  stopAutoUpdate = undefined;
}

/** 从提及块的 data-* 属性还原节点属性（含 extraAttributes 声明的字段） */
function readMentionAttrs(element: HTMLElement): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (key === "type") continue;
    attrs[key] = value;
  }
  return attrs;
}

function showTip(element: HTMLElement) {
  if (!hoverEnabled.value) return;
  tipAnchor.value = element;
  tipAttrs.value = readMentionAttrs(element);
}

function scheduleShow(element: HTMLElement) {
  cancelTimers();
  showTimer = setTimeout(() => showTip(element), hoverOptions.value.delay);
}

function scheduleHide() {
  cancelTimers();
  hideTimer = setTimeout(hideTip, hoverOptions.value.hideDelay);
}

/** 事件委托：命中文档内的提及块（不侵入节点结构） */
function handleEditorMouseOver(event: MouseEvent) {
  if (!hoverEnabled.value) return;
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '[data-type="mention"]',
  );
  if (!target) return;
  // 同一个块内移动：保持显示
  if (target === tipAnchor.value) {
    cancelTimers();
    return;
  }
  scheduleShow(target);
}

function handleEditorMouseOut(event: MouseEvent) {
  if (!hoverEnabled.value) return;
  const related = event.relatedTarget as HTMLElement | null;
  // 移入浮层本身时不隐藏，便于在浮层内播放媒体
  if (related?.closest?.(".vme-tip")) {
    cancelTimers();
    return;
  }
  if (!(event.target as HTMLElement | null)?.closest('[data-type="mention"]')) return;
  scheduleHide();
}

watch(
  editor,
  (instance, _previous, onCleanup) => {
    if (!instance) return;
    const dom = instance.view.dom;
    dom.addEventListener("mouseover", handleEditorMouseOver);
    dom.addEventListener("mouseout", handleEditorMouseOut);
    onCleanup(() => {
      dom.removeEventListener("mouseover", handleEditorMouseOver);
      dom.removeEventListener("mouseout", handleEditorMouseOut);
      hideTip();
    });
  },
  { immediate: true },
);

/** 浮层定位：与候选面板一样使用 Floating UI（自动翻转 / 跟随滚动） */
watch(
  [tipEl, tipAnchor],
  ([floating, anchor]) => {
    stopAutoUpdate?.();
    stopAutoUpdate = undefined;
    if (!floating || !anchor) return;

    stopAutoUpdate = autoUpdate(anchor, floating, () => {
      void computePosition(anchor, floating, {
        placement: hoverOptions.value.placement,
        strategy: "fixed",
        middleware: [
          offsetMiddleware(hoverOptions.value.offset),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
        ],
      }).then(({ x, y }) => {
        floating.style.left = `${x}px`;
        floating.style.top = `${y}px`;
      });
    });
  },
  { flush: "post" },
);

onBeforeUnmount(hideTip);

/** 读取文档中全部提及节点的属性 */
function getMentions(): Record<string, unknown>[] {
  const instance = liveEditor();
  return instance ? collectMentions(instance).map((item) => item.attrs) : [];
}

/**
 * 移除匹配的提及节点（连同其后紧跟的空格），返回移除数量。
 * 传数组按 id 匹配；传函数则自定义判定（例如按自定义属性 src 匹配）。
 */
function removeMentions(match: string[] | ((attrs: Record<string, unknown>) => boolean)): number {
  const instance = liveEditor();
  if (!instance) return 0;

  const isMatch =
    typeof match === "function"
      ? match
      : (attrs: Record<string, unknown>) => match.map(String).includes(String(attrs.id));

  return deleteMentionNodes(
    instance,
    collectMentions(instance).filter((item) => isMatch(item.attrs)),
  );
}

/**
 * 按 `textValue.resolve` 重新解析文档里的提及节点，补齐标题 / 缩略图等展示字段，返回更新的节点数。
 *
 * 适用场景：绑定值先到、对应数据后到（资源列表异步加载、详情按需请求）——
 * 调用一次即可把原先只显示 id 的提及恢复成带样式的 chip；传了 `mentionPool` 时，资源池变化后会自动执行。
 *
 * 只补非空字段，且不写入撤销历史。
 */
function refreshMentions(): number {
  const instance = liveEditor();
  const resolve = props.textValue?.resolve;
  if (!instance || !resolve) return 0;

  const updates: { pos: number; attrs: Record<string, unknown> }[] = [];
  instance.state.doc.descendants((node, pos) => {
    if (node.type.name !== "mention") return true;

    const attrs = node.attrs as Record<string, unknown>;
    const item = resolve(String(attrs.id ?? ""), String(attrs.mentionSuggestionChar ?? "@"));
    if (!item) return true;

    const next = { ...attrs };
    let changed = false;
    for (const [key, value] of Object.entries(item)) {
      // 只补非空字段：resolve 返回的局部数据不应该把已有的展示信息抹掉
      if (key === "id" || value === undefined || value === null || value === "") continue;
      if (next[key] === value) continue;
      next[key] = value;
      changed = true;
    }
    if (changed) updates.push({ pos, attrs: next });
    return true;
  });

  if (!updates.length) return 0;

  const tr = instance.state.tr;
  // 仅补齐展示信息，不应该产生一步可撤销的历史
  tr.setMeta("addToHistory", false);
  for (const { pos, attrs } of updates) tr.setNodeMarkup(pos, undefined, attrs);
  instance.view.dispatch(tr);

  return updates.length;
}

defineExpose({
  /** tiptap 编辑器实例（挂载后可用） */
  get editor(): Editor | undefined {
    return editor.value;
  },
  focus: () => liveEditor()?.commands.focus("end"),
  blur: () => liveEditor()?.commands.blur(),
  clear: () => liveEditor()?.commands.clearContent(true),
  setContent: (value: string) => {
    const instance = liveEditor();
    if (!instance) return;
    instance.commands.setContent(toEditorContent(value ?? ""), { emitUpdate: false });
    isEmpty.value = instance.isEmpty;
    pruneInvalidMentions();
    refreshMentions();
  },
  getHTML: () => liveEditor()?.getHTML() ?? "",
  /** 纯文本：默认 `@ + label`（可读）；传 { token: 'id' } 得到与 v-model 一致的形式 */
  getText: (options?: MentionTextRenderOptions) => {
    const instance = liveEditor();
    if (!instance) return "";
    return serializeDocText(instance.state.doc, {
      renderMention: mentionTextRenderer(options?.token ?? "label"),
    });
  },
  getJSON: () => liveEditor()?.getJSON() ?? null,
  /** 扩展输出：Markdown（段落 / 标题 / 列表 / 引用 / 代码块 / 标记 / 提及） */
  getMarkdown: (options?: MentionTextRenderOptions) => {
    const instance = liveEditor();
    if (!instance) return "";
    return serializeDocMarkdown(instance.state.doc, {
      renderMention: mentionTextRenderer(options?.token ?? "label"),
    });
  },
  insertMention,
  getMentions,
  removeMentions,
  refreshMentions,
});
</script>

<template>
  <div
    class="vme-root"
    :class="{ 'is-readonly': editable === false, 'is-disabled': disabled }"
    :style="rootStyle"
    :aria-disabled="disabled || undefined"
  >
    <EditorContent v-if="editor" :editor="editor" class="vme-root__content" />

    <!-- 空状态占位：支持纯文案 / VNode 行内块组件 / #placeholder 插槽 -->
    <div v-if="showPlaceholder" class="vme-placeholder" aria-hidden="true">
      <slot name="placeholder">
        <template v-if="isStringPlaceholder">{{ placeholder }}</template>
        <VNodeView v-else :node="placeholder" />
      </slot>
    </div>

    <!-- 提及块悬浮提示：命中与定位由组件负责，内容完全交给插槽 -->
    <Teleport v-if="hoverEnabled" :to="tipContainer">
      <div
        v-if="tipVisible && tipSlotProps"
        ref="tipEl"
        class="vme-tip"
        role="tooltip"
        @mouseenter="cancelTimers"
        @mouseleave="scheduleHide"
      >
        <slot name="mention-tip" v-bind="tipSlotProps" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.vme-root {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 100%;
  background: var(--vme-bg);
  border: 1px solid var(--vme-border-color);
  border-radius: var(--vme-radius);
  color: var(--vme-text-color);
  font-family: var(--vme-font-family);
  font-size: var(--vme-font-size);
  line-height: var(--vme-line-height);
  transition:
    border-color var(--vme-transition-base),
    box-shadow var(--vme-transition-base),
    background-color var(--vme-transition-base);
}

.vme-root:hover:not(.is-disabled, .is-readonly) {
  border-color: var(--vme-border-strong-color);
}

.vme-root:focus-within {
  border-color: var(--vme-focused-border-color);
  box-shadow: var(--vme-focus-ring);
}

.vme-root.is-readonly {
  background: var(--vme-readonly-bg);
}

.vme-root.is-readonly :deep(.vme-content) {
  cursor: default;
}

/* 禁用态：用颜色而不是透明度表达，避免文字发虚 */
.vme-root.is-disabled {
  background: var(--vme-disabled-bg);
  color: var(--vme-disabled-text-color);
  border-color: var(--vme-border-color);
  cursor: not-allowed;
}

.vme-root.is-disabled :deep(.vme-content) {
  cursor: not-allowed;
  caret-color: transparent;
}

.vme-root__content {
  display: block;
}

.vme-root :deep(.vme-content) {
  box-sizing: border-box;
  min-height: var(--vme-min-height, var(--vme-content-min-height));
  max-height: var(--vme-max-height, none);
  padding: var(--vme-padding-y) var(--vme-padding-x);
  overflow-y: auto;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  scrollbar-width: thin;
  scrollbar-color: var(--vme-scrollbar-thumb) transparent;
}

.vme-root :deep(.vme-content::-webkit-scrollbar) {
  width: var(--vme-scrollbar-size);
  height: var(--vme-scrollbar-size);
}

.vme-root :deep(.vme-content::-webkit-scrollbar-thumb) {
  border: 2px solid transparent;
  border-radius: var(--vme-radius-full);
  background: var(--vme-scrollbar-thumb);
  background-clip: content-box;
}

.vme-root :deep(.vme-content p) {
  margin: 0 0 var(--vme-space-2);
}

.vme-root :deep(.vme-content p:last-child) {
  margin-bottom: 0;
}

/* 空状态占位内容：与编辑区同一套内边距，保证文字基线对齐 */
.vme-placeholder {
  position: absolute;
  inset: 0;
  padding: var(--vme-padding-y) var(--vme-padding-x);
  overflow: hidden;
  color: var(--vme-placeholder-color);
  pointer-events: none;
  user-select: none;
  text-align: left;
}

/* 提及块悬浮提示（内容由使用者的插槽提供） */
.vme-tip {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--vme-z-tip);
  max-width: var(--vme-tip-max-width);
  padding: var(--vme-tip-padding);
  border: 1px solid var(--vme-border-color);
  border-radius: var(--vme-tip-radius);
  background: var(--vme-tip-bg);
  box-shadow: var(--vme-popup-shadow);
  color: var(--vme-text-color);
  font-family: var(--vme-font-family);
  font-size: var(--vme-font-size);
  line-height: var(--vme-line-height);
}

/*
 * 插槽内容不得撑破气泡：气泡宽度上限是 --vme-tip-max-width，
 * 内容写死更宽时会被挤到气泡外面；需要更宽的提示请全局覆盖该令牌
 * （浮层默认挂在 body 下，作用域样式里的令牌不一定生效，
 * 也可以给 mention-hover 配 container 让浮层继承容器令牌）。
 */
.vme-tip :deep(*) {
  max-width: 100%;
}

/* 文档中的提及块 */
.vme-root :deep(.vme-mention) {
  padding: 0 var(--vme-mention-padding-x);
  border-radius: var(--vme-mention-radius);
  background: var(--vme-mention-bg);
  color: var(--vme-mention-color);
  font-weight: 500;
  white-space: nowrap;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

/*
 * 可选的「胶囊型」提及块：在 renderHTML 的根元素上追加 `vme-mention--pill` 即可，
 * 之后只需要写配色（尺寸 / 内边距 / 圆角 / 垂直对齐都由这里统一处理）。
 *
 * 垂直对齐说明：固定高度会让默认的 baseline 对齐失效；
 * 而 `vertical-align: <长度>` 的参考点是元素自身的基线，会随内部结构（缩略图 / 徒标）变化，
 * 没法用一个固定值适配所有 chip。这里用与内容无关的 `middle` 打底，再加一个固定微调，
 * 保证与文字和光标的视觉中心对齐（实测偏差 < 0.1px）。
 */
.vme-root :deep(.vme-mention--pill) {
  display: inline-flex;
  align-items: center;
  gap: 0.32em;
  box-sizing: border-box;
  height: 1.55em;
  padding: 0 0.6em 0 0.35em;
  border-radius: var(--vme-radius-full);
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  position: relative;
  top: -0.12em;
}
</style>
