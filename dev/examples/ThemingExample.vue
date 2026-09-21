<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members, tags } from "../mock";

const dark = ref(false);
const content = ref("重写语义令牌即可换肤，提及块与候选面板一起生效。");

/** 候选面板被挂载到 body，把 container 指向主题容器就能继承容器上的令牌 */
const POPUP_CONTAINER = ".theming__surface";

const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members, container: POPUP_CONTAINER },
  { char: "#", label: "标签", items: tags, container: POPUP_CONTAINER },
];

const styleSnippet = `<!-- ① 容器上切换主题（令牌内置了 dark 预设） -->
<div class="theming__surface" :data-vme-theme="dark ? 'dark' : undefined">
  <MentionEditor v-model="content" :triggers="triggers" />
</div>

// ② 面板挂载到同一容器，才能继承容器令牌
{ char: '@', items: members, container: '.theming__surface' }

/* ③ 想自定义配色时，只覆盖语义令牌这一层 */
.theming__surface[data-vme-theme='dark'] {
  --vme-bg: #1f2937;
  --vme-text-color: #e5e7eb;
  --vme-border-color: #374151;
  --vme-mention-bg: #312e81;
}`;
</script>

<template>
  <div class="stack">
    <label class="switch">
      <input v-model="dark" type="checkbox" />
      深色主题
    </label>

    <div class="theming__surface" :data-vme-theme="dark ? 'dark' : undefined">
      <MentionEditor
        v-model="content"
        :triggers="triggers"
        placeholder="输入 @ 或 # 看看编辑区与面板配色"
        :min-height="110"
      />
    </div>

    <p class="muted">
      组件所有颜色都来自语义令牌（`--vme-bg`、`--vme-text-color`、`--vme-mention-bg`……），
      令牌内置了 `[data-vme-theme='dark']` 深色预设，覆盖令牌即可换肤。
    </p>

    <div class="output">
      <div class="output__title">本例的做法</div>
      <pre>{{ styleSnippet }}</pre>
    </div>
  </div>
</template>

<style scoped>
.theming__surface {
  padding: 14px;
  border-radius: var(--demo-radius-md);
  background: var(--demo-surface);
  transition: background-color 160ms ease;
}

.theming__surface[data-vme-theme="dark"] {
  background: #0f172a;
}
</style>
