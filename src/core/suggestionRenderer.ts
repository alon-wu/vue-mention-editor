import { VueRenderer } from "@tiptap/vue-3";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import type { VNodeChild } from "vue";
import MentionList from "../components/MentionList.vue";
import type {
  MentionItem,
  MentionItemRenderer,
  MentionSuggestionRenderer,
  MentionTrigger,
} from "../types";

/** 由触发符配置生成候选面板渲染器 */
export type MentionRendererFactory = (
  trigger: MentionTrigger,
  index: number,
) => MentionSuggestionRenderer | undefined;

export interface CreateSuggestionRendererOptions {
  /** 当前触发符配置 */
  trigger: MentionTrigger;
  /** 触发符在配置数组中的下标 */
  index: number;
  /** 默认空状态文案 */
  emptyText?: string;
  /** 自定义候选项渲染（#item 插槽） */
  renderItem?: MentionItemRenderer;
  /** 自定义空状态渲染（#empty 插槽） */
  renderEmpty?: () => VNodeChild;
  /** 选中回调 */
  onSelect?: (item: MentionItem, trigger: MentionTrigger) => void;
  /** 面板打开 / 关闭回调，用于与宿主快捷键（如 Enter 提交）互斥 */
  onActiveChange?: (active: boolean) => void;
}

/** mention 列表暴露给键盘导航使用的方法 */
interface MentionListRef {
  onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * 创建 tiptap suggestion 渲染器：
 * 面板由 VueRenderer 渲染，定位交给 tiptap 的 mount()（内部使用 Floating UI，
 * 自动处理滚动、缩放与翻转），旧版 tiptap 回退到手动定位。
 */
export function createSuggestionRenderer(
  options: CreateSuggestionRendererOptions,
): MentionSuggestionRenderer {
  let renderer: VueRenderer | undefined;
  let detach: (() => void) | undefined;
  let element: HTMLElement | undefined;

  const toListProps = (props: SuggestionProps<MentionItem>) => ({
    items: props.items ?? [],
    query: props.query,
    trigger: options.trigger.char,
    title: options.trigger.label,
    emptyText: options.trigger.emptyText ?? options.emptyText,
    loading: Boolean(props.loading),
    renderItem: options.renderItem,
    renderEmpty: options.renderEmpty,
    popupClass: options.trigger.popupClass,
    command: (item: MentionItem) => {
      props.command(item);
      options.onSelect?.(item, options.trigger);
    },
  });

  const teardown = () => {
    detach?.();
    detach = undefined;
    element = undefined;
    renderer?.destroy();
    renderer = undefined;
    options.onActiveChange?.(false);
  };

  return {
    onStart(props) {
      teardown();
      renderer = new VueRenderer(MentionList, {
        props: toListProps(props),
        editor: props.editor,
      });

      const el = renderer.element as HTMLElement | null;
      if (!el) return;

      el.classList.add("vme-popup-host");
      element = el;
      options.onActiveChange?.(true);

      if (typeof props.mount === "function") {
        detach = props.mount(el);
        return;
      }

      detach = mountFallback(el, props, options.trigger.container);
    },

    onUpdate(props) {
      renderer?.updateProps(toListProps(props));
      if (element && props.clientRect) {
        positionFallback(element, props);
      }
    },

    onExit() {
      teardown();
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === "Escape") {
        props.event.preventDefault();
        teardown();
        return true;
      }
      const ref = renderer?.ref as MentionListRef | undefined;
      return ref?.onKeyDown?.(props) ?? false;
    },
  };
}

/** 解析面板挂载容器：支持 CSS 选择器与元素，未提供或找不到时退回 body */
function resolveContainer(container?: string | HTMLElement): HTMLElement {
  if (container instanceof HTMLElement) return container;
  if (typeof container === "string") {
    return document.querySelector<HTMLElement>(container) ?? document.body;
  }
  return document.body;
}

/** 新版 tiptap 之外的兜底定位（fixed 定位 + 光标 rect） */
function mountFallback(
  el: HTMLElement,
  props: SuggestionProps<MentionItem>,
  container?: string | HTMLElement,
) {
  resolveContainer(container).appendChild(el);
  el.style.position = "fixed";
  el.style.zIndex = "1000";

  const update = () => positionFallback(el, props);
  update();

  window.addEventListener("scroll", update, true);
  window.addEventListener("resize", update);

  return () => {
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
    el.remove();
  };
}

function positionFallback(el: HTMLElement, props: SuggestionProps<MentionItem>) {
  const rect = props.clientRect?.();
  if (!rect) return;
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.bottom + 6}px`;
}
