<script setup lang="ts">
import { computed, ref } from "vue";
import CodeBlock from "./CodeBlock.vue";
import type { ExampleUsage } from "../examples";

const props = defineProps<{
  /** 全量序号，例如 "03" */
  index: number;
  title: string;
  description: string;
  fileName: string;
  source: string;
  /** 覆盖面标签（能力点速查） */
  tags?: string[];
  /** 用法速览：绑了什么、触发了什么、用了哪些 API、效果怎么来的 */
  usage?: ExampleUsage;
}>();

const showSource = ref(false);

/** 速览分组：有内容才渲染，分组顺序固定，保证每个示例看到的顺序一致 */
const usageGroups = computed(() => {
  const usage = props.usage;
  if (!usage) return [];
  return [
    { key: "bindings", label: "绑定值", tone: "value", items: usage.bindings },
    { key: "events", label: "事件", tone: "event", items: usage.events ?? [] },
    { key: "props", label: "props", tone: "api", items: usage.props ?? [] },
    { key: "slots", label: "插槽", tone: "slot", items: usage.slots ?? [] },
    { key: "methods", label: "ref 方法", tone: "api", items: usage.methods ?? [] },
    {
      key: "triggerOptions",
      label: "triggers[]",
      tone: "api",
      items: usage.triggerOptions ?? [],
    },
    { key: "tokens", label: "设计令牌", tone: "token", items: usage.tokens ?? [] },
  ].filter((group) => group.items.length > 0);
});

const serial = computed(() => String(props.index).padStart(2, "0"));
</script>

<template>
  <article class="example">
    <header class="example__header">
      <div class="example__heading">
        <span class="example__serial">{{ serial }}</span>
        <h2 class="example__title">{{ title }}</h2>
      </div>
      <p class="example__desc">{{ description }}</p>
      <ul v-if="tags?.length" class="example__tags">
        <li v-for="tag in tags" :key="tag" class="example__tag">{{ tag }}</li>
      </ul>
    </header>

    <div class="example__demo">
      <slot />
    </div>

    <!-- 用法速览：这个效果是怎么来的 -->
    <section v-if="usage" class="usage">
      <h3 class="usage__title">用法速览</h3>

      <dl class="usage__grid">
        <div v-for="group in usageGroups" :key="group.key" class="usage__row">
          <dt class="usage__label">{{ group.label }}</dt>
          <dd class="usage__value">
            <code
              v-for="item in group.items"
              :key="item"
              class="usage__item"
              :class="`is-${group.tone}`"
            >
              {{ item }}
            </code>
          </dd>
        </div>
      </dl>

      <ul class="usage__notes">
        <li v-for="note in usage.highlights" :key="note" class="usage__note">{{ note }}</li>
      </ul>
    </section>

    <footer class="example__footer">
      <button type="button" class="example__toggle" @click="showSource = !showSource">
        {{ showSource ? "收起源码" : "查看源码" }}
      </button>
      <span class="example__file">{{ fileName }}</span>
    </footer>

    <CodeBlock v-if="showSource" :code="source.trim()" :label="fileName" />
  </article>
</template>

<style scoped>
.example {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.example__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example__heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.example__serial {
  color: var(--demo-text-subtle);
  font-family: var(--demo-font-mono);
  font-size: 12px;
}

.example__title {
  margin: 0;
  font-size: 19px;
  letter-spacing: -0.01em;
}

.example__desc {
  max-width: 76ch;
  margin: 0;
  color: var(--demo-text-muted);
  font-size: 13.5px;
  line-height: 1.75;
}

.example__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

.example__tag {
  padding: 2px 8px;
  border: 1px solid var(--demo-brand-border);
  border-radius: 999px;
  background: var(--demo-brand-soft);
  color: var(--demo-brand-text);
  font-size: 11.5px;
}

.example__demo {
  padding: 20px;
  border: 1px solid var(--demo-border);
  border-radius: var(--demo-radius-md);
  background: var(--demo-surface-muted);
}

/* ===== 用法速览 ===== */
.usage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--demo-border);
  border-radius: var(--demo-radius-md);
  background: var(--demo-surface);
}

.usage__title {
  margin: 0;
  color: var(--demo-text-subtle);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.usage__grid {
  display: grid;
  gap: 8px;
  margin: 0;
}

.usage__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.usage__label {
  padding-top: 1px;
  color: var(--demo-text-subtle);
  font-size: 12px;
  line-height: 1.6;
}

.usage__value {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.usage__item {
  padding: 1px 7px;
  border: 1px solid var(--demo-border);
  border-radius: var(--demo-radius-sm);
  background: var(--demo-surface-muted);
  color: #374151;
  font-family: var(--demo-font-mono);
  font-size: 11.5px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.usage__item.is-event {
  border-color: var(--demo-brand-border);
  background: var(--demo-brand-soft);
  color: var(--demo-brand-text);
}

.usage__item.is-slot {
  border-color: #d8b4fe;
  background: #faf5ff;
  color: #6b21a8;
}

.usage__item.is-token {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #92400e;
}

.usage__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px dashed var(--demo-border);
  padding-top: 12px;
}

.usage__note {
  position: relative;
  padding-left: 16px;
  color: var(--demo-text);
  font-size: 12.5px;
  line-height: 1.7;
}

.usage__note::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--demo-brand);
}

.example__footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.example__toggle {
  padding: 6px 12px;
  border: 1px solid var(--demo-border-strong);
  border-radius: var(--demo-radius-sm);
  background: var(--demo-surface);
  color: #374151;
  font-size: 12.5px;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    color 120ms ease;
}

.example__toggle:hover {
  border-color: var(--demo-brand-border);
  color: var(--demo-brand-text);
}

.example__file {
  color: var(--demo-text-subtle);
  font-family: var(--demo-font-mono);
  font-size: 12px;
}
</style>
