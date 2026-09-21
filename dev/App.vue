<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ExampleCard from "./components/ExampleCard.vue";
import { exampleGroups, examples } from "./examples";

/** 示例的两位编号（与侧边栏编号、文档里的深链一致） */
const serialOf = (id: string) =>
  String(examples.findIndex((example) => example.id === id) + 1).padStart(2, "0");

/** 解析地址栏 hash：支持 `#06`（编号）与 `#basic`（示例 id）两种写法 */
function matchHash(): string | undefined {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return undefined;
  return examples.find((example) => example.id === hash || serialOf(example.id) === hash)?.id;
}

/** 初始选中：优先用深链，否则第一个示例 */
const activeId = ref(matchHash() ?? examples[0].id);
const activeIndex = computed(() =>
  Math.max(1, examples.findIndex((example) => example.id === activeId.value) + 1),
);
const active = computed(() => examples[activeIndex.value - 1] ?? examples[0]);

/** 选中的示例同步到地址栏，方便直接复制链接分享（用 replace 避免污染后退历史） */
watch(activeId, () => {
  const next = `#${serialOf(activeId.value)}`;
  if (window.location.hash !== next) window.history.replaceState(null, "", next);
});

/** 浏览器前进 / 后退或手动改 hash 时跟着切换 */
const onHashChange = () => {
  const id = matchHash();
  if (id && id !== activeId.value) activeId.value = id;
};

onMounted(() => {
  const next = `#${serialOf(activeId.value)}`;
  if (window.location.hash !== next) window.history.replaceState(null, "", next);
  window.addEventListener("hashchange", onHashChange);
});

onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));

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
        方法。地址栏会跟着切换（如 <code>#06</code>），可直接复制分享某个示例。
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
        <span>
          在线文档：
          <a
            href="https://alon-wu.github.io/vue-mention-editor/docs/"
            target="_blank"
            rel="noreferrer"
          >
            alon-wu.github.io/vue-mention-editor/docs
          </a>
        </span>
        <span>
          源码：
          <a href="https://github.com/alon-wu/vue-mention-editor" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </span>
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
