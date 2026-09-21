<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { VNodeView } from "../core/vnodeView";
import type { MentionListProps } from "../types";

const props = withDefaults(defineProps<MentionListProps>(), {
  title: "",
  emptyText: "无匹配结果",
  loading: false,
  renderItem: undefined,
  renderEmpty: undefined,
  popupClass: "",
});

const listRef = ref<HTMLUListElement | null>(null);
const selectedIndex = ref(0);

const isEmpty = computed(() => props.items.length === 0);

// 候选项变化时重置高亮，避免越界
watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
  },
);

watch(selectedIndex, async (index) => {
  await nextTick();
  listRef.value
    ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    ?.scrollIntoView({ block: "nearest" });
});

function selectItem(index: number) {
  const item = props.items[index];
  if (item) props.command(item);
}

function moveSelection(step: number) {
  const total = props.items.length;
  if (!total) return;
  selectedIndex.value = (selectedIndex.value + step + total) % total;
}

function onKeyDown({ event }: { event: KeyboardEvent }): boolean {
  switch (event.key) {
    case "ArrowUp":
      moveSelection(-1);
      return true;
    case "ArrowDown":
      moveSelection(1);
      return true;
    case "Enter":
    case "Tab":
      selectItem(selectedIndex.value);
      return true;
    default:
      return false;
  }
}

defineExpose({ onKeyDown, selectItem, selectedIndex });
</script>

<template>
  <div class="vme-popup" :class="popupClass" :data-trigger="trigger">
    <div v-if="title || query" class="vme-popup__header">
      <span v-if="title" class="vme-popup__title">{{ title }}</span>
      <span v-if="query" class="vme-popup__query">{{ trigger }}{{ query }}</span>
    </div>

    <ul ref="listRef" class="vme-popup__list" role="listbox">
      <li v-if="loading" class="vme-popup__hint">加载中…</li>
      <li v-else-if="isEmpty" class="vme-popup__hint">
        <VNodeView v-if="renderEmpty" :node="renderEmpty()" />
        <template v-else>{{ emptyText }}</template>
      </li>

      <template v-else>
        <li
          v-for="(item, index) in items"
          :key="item.id"
          class="vme-popup__item"
          :class="{ 'is-selected': index === selectedIndex }"
          role="option"
          :aria-selected="index === selectedIndex"
          :data-index="index"
          @mouseenter="selectedIndex = index"
          @mousedown.prevent="selectItem(index)"
        >
          <VNodeView
            v-if="renderItem"
            :node="renderItem({ item, index, query, selected: index === selectedIndex, trigger })"
          />
          <template v-else>
            <img
              v-if="item.avatar"
              class="vme-popup__avatar"
              :src="item.avatar"
              :alt="item.label"
            />
            <span class="vme-popup__label">{{ item.label }}</span>
            <span v-if="item.description" class="vme-popup__desc">{{ item.description }}</span>
          </template>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.vme-popup {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* tiptap 会给浮层写入 width: max-content，这里用 min/max 控制宽度区间 */
  min-width: var(--vme-popup-min-width);
  max-width: var(--vme-popup-max-width);
  max-height: var(--vme-popup-max-height);
  overflow: hidden;
  background: var(--vme-popup-bg);
  border: 1px solid var(--vme-border-color);
  border-radius: var(--vme-popup-radius);
  box-shadow: var(--vme-popup-shadow);
  color: var(--vme-text-color);
  font-family: var(--vme-font-family);
  font-size: var(--vme-font-size);
  line-height: var(--vme-line-height);
  z-index: var(--vme-z-popup);
  overscroll-behavior: contain;
}

.vme-popup__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--vme-space-3);
  height: var(--vme-popup-header-height);
  padding: 0 var(--vme-space-5);
  border-bottom: 1px solid var(--vme-border-color);
  color: var(--vme-muted-color);
  font-size: var(--vme-font-size-sm);
}

.vme-popup__title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vme-popup__query {
  flex-shrink: 0;
  max-width: 50%;
  overflow: hidden;
  padding: 1px var(--vme-space-2);
  border-radius: var(--vme-radius-full);
  background: var(--vme-item-active-bg);
  color: var(--vme-item-active-color);
  font-size: var(--vme-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vme-popup__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: var(--vme-popup-padding);
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--vme-scrollbar-thumb) transparent;
}

.vme-popup__list::-webkit-scrollbar {
  width: var(--vme-scrollbar-size);
  height: var(--vme-scrollbar-size);
}

.vme-popup__list::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: var(--vme-radius-full);
  background: var(--vme-scrollbar-thumb);
  background-clip: content-box;
}

.vme-popup__list::-webkit-scrollbar-track {
  background: transparent;
}

.vme-popup__item {
  display: flex;
  align-items: center;
  gap: var(--vme-space-3);
  box-sizing: border-box;
  min-height: var(--vme-item-height);
  padding: var(--vme-space-2) var(--vme-space-3);
  border-radius: var(--vme-item-radius);
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--vme-transition-fast),
    color var(--vme-transition-fast);
}

.vme-popup__item.is-selected {
  background: var(--vme-item-active-bg);
  color: var(--vme-item-active-color);
}

.vme-popup__avatar {
  flex-shrink: 0;
  width: var(--vme-avatar-size);
  height: var(--vme-avatar-size);
  border-radius: var(--vme-radius-full);
  object-fit: cover;
}

.vme-popup__label {
  flex-shrink: 0;
  max-width: 60%;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vme-popup__desc {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--vme-muted-color);
  font-size: var(--vme-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vme-popup__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--vme-item-height);
  padding: var(--vme-space-3);
  color: var(--vme-muted-color);
  font-size: var(--vme-font-size-sm);
  text-align: center;
}
</style>
