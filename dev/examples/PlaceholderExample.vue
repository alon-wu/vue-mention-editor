<script setup lang="ts">
import { h, ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members } from "../mock";

const triggers: MentionTrigger[] = [{ char: "@", items: members }];

const stringContent = ref("");
const vnodeContent = ref("");
const slotContent = ref("");

/** 行内块组件：h('kbd') 之类的标记会原样渲染在占位内容里 */
const vnodePlaceholder = h("span", null, [
  "输入内容，",
  h("kbd", { class: "kbd" }, "@"),
  " 提及资源，",
  h("kbd", { class: "kbd" }, "Shift + Enter"),
  " 换行",
]);
</script>

<template>
  <div class="stack">
    <p class="muted">① 普通字符串占位</p>
    <MentionEditor
      v-model="stringContent"
      :triggers="triggers"
      placeholder="说点什么…"
      :min-rows="2"
    />

    <p class="muted">② VNode 占位（含 kbd 行内块）</p>
    <MentionEditor
      v-model="vnodeContent"
      :triggers="triggers"
      :placeholder="vnodePlaceholder"
      :min-rows="2"
    />

    <p class="muted">③ #placeholder 插槽（可以是任意组件）</p>
    <MentionEditor v-model="slotContent" :triggers="triggers" :min-rows="2">
      <template #placeholder>
        <span class="slot-placeholder">
          <span class="slot-placeholder__icon" aria-hidden="true">✦</span>
          用插槽渲染的占位内容，支持任意组件
        </span>
      </template>
    </MentionEditor>

    <p class="muted">
      三种写法都会在内容非空时自动隐藏，且不影响点击聚焦（pointer-events: none）。
    </p>
  </div>
</template>

<style scoped>
.slot-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.slot-placeholder__icon {
  color: #4f46e5;
}
</style>
