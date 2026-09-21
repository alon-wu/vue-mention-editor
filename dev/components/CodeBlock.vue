<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  code: string;
  label?: string;
}>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 1600);
  } catch {
    copied.value = false;
  }
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="code-block">
    <div class="code-block__bar">
      <span class="code-block__label">{{ label ?? "源码" }}</span>
      <button type="button" class="code-block__copy" @click="copyCode">
        {{ copied ? "已复制" : "复制" }}
      </button>
    </div>
    <pre class="code-block__pre"><code>{{ code }}</code></pre>
  </div>
</template>

<style scoped>
.code-block {
  overflow: hidden;
  border-radius: var(--demo-radius-md);
  background: var(--demo-code-bg);
}

.code-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  background: var(--demo-code-bar);
  color: var(--demo-code-muted);
  font-size: 12px;
}

.code-block__label {
  font-family: var(--demo-font-mono);
}

.code-block__copy {
  padding: 3px 10px;
  border: 1px solid #3f4b60;
  border-radius: var(--demo-radius-sm);
  background: transparent;
  color: var(--demo-code-muted);
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    color 120ms ease;
}

.code-block__copy:hover {
  border-color: #818cf8;
  color: #e0e7ff;
}

.code-block__pre {
  margin: 0;
  padding: 16px;
  max-height: 440px;
  overflow: auto;
  color: var(--demo-code-text);
  font-family: var(--demo-font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  tab-size: 2;
}
</style>
