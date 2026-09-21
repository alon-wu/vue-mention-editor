import { cloneVNode, defineComponent, isVNode } from "vue";
import type { PropType, VNodeChild } from "vue";

/** 数组形式的 VNodeChild 需要逐项 clone，避免同一个实例被反复 patch */
function normalizeNode(node: VNodeChild): VNodeChild {
  if (Array.isArray(node)) {
    return node.map((child) => (isVNode(child) ? cloneVNode(child) : child));
  }
  return isVNode(node) ? cloneVNode(node) : node;
}

/**
 * 渲染「外部传入的 VNode」的稳定组件。
 *
 * 直接用 `<component :is="() => vnode" />` 会每次渲染都创建新的组件类型，
 * 导致子树被反复卸载重建（媒体重新加载、动画重播）；这里用一个固定的组件承载，
 * 并在渲染前 clone 一次 VNode，保证同一个实例不会被重复 patch。
 */
export const VNodeView = defineComponent({
  name: "VmeNodeView",
  props: {
    node: { type: null as unknown as PropType<VNodeChild>, default: null },
  },
  setup(props) {
    return () => normalizeNode(props.node);
  },
});

export default VNodeView;
