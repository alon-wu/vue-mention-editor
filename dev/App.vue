<script setup lang="ts">
import { computed, ref } from "vue";
import ExampleCard from "./components/ExampleCard.vue";
import { exampleGroups, examples } from "./examples";

const activeId = ref(examples[0].id);
const activeIndex = computed(() =>
  Math.max(1, examples.findIndex((example) => example.id === activeId.value) + 1),
);
const active = computed(() => examples[activeIndex.value - 1] ?? examples[0]);

/** 侧边栏：按分组顺序展示，编号与主区一致，方便对照 */
const grouped = computed(() =>
  exampleGroups.map((group) => ({
    group,
    items: examples
      .map((example, index) => ({ example, serial: String(index + 1).padStart(2, "0") }))
      .filter((entry) => entry.example.group === group),
  })),
);
</script>

<template>
  <div class="gallery">
    <aside class="gallery__sidebar">
      <header class="gallery__brand">
        <h1>vue-mention-editor</h1>
        <p>基于 Tiptap 3 + Vue 3 的提及编辑器组件 · 示例与开发调试</p>
        <code>bun run dev</code>
      </header>

      <nav class="gallery__nav">
        <div v-for="section in grouped" :key="section.group" class="nav-group">
          <div class="nav-group__title">{{ section.group }}</div>
          <button
            v-for="entry in section.items"
            :key="entry.example.id"
            class="nav-item"
            :class="{ 'is-active': entry.example.id === activeId }"
            type="button"
            @click="activeId = entry.example.id"
          >
            <span class="nav-item__serial">{{ entry.serial }}</span>
            <span class="nav-item__label">{{ entry.example.title }}</span>
          </button>
        </div>
      </nav>
    </aside>

    <main class="gallery__main">
      <p class="gallery__hint">
        共 {{ examples.length }} 个示例，按「入门 → 外观 → 交互 → 集成 → AI
        场景」排列；每个示例下方的
        <strong>用法速览</strong> 会说明它绑定了什么值、触发了什么事件、用到了哪些 props / 插槽 /
        方法。
      </p>

      <ExampleCard
        :key="active.id"
        :index="activeIndex"
        :title="active.title"
        :description="active.description"
        :tags="active.tags"
        :usage="active.usage"
        :file-name="active.fileName"
        :source="active.source"
      >
        <component :is="active.component" />
      </ExampleCard>

      <footer class="gallery__footer">
        <span>文档：docs/guide · docs/api</span>
        <span>命令：bun run typecheck / bun run build</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.gallery {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  gap: 24px;
  max-width: 1180px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .gallery {
    grid-template-columns: minmax(0, 1fr);
  }
}

.gallery__hint {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid var(--demo-border);
  border-left: 3px solid var(--demo-brand);
  border-radius: var(--demo-radius-sm);
  background: var(--demo-surface-muted);
  color: var(--demo-text-muted);
  font-size: 12.5px;
  line-height: 1.7;
}

.gallery__hint strong {
  color: var(--demo-brand-text);
}
</style>
