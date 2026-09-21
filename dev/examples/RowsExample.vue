<script setup lang="ts">
import { computed, ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members } from "../mock";

const content = ref("");
const triggers: MentionTrigger[] = [{ char: "@", items: members }];

type Preset = { label: string; minRows: number; maxRows: number };

const presets: Preset[] = [
  { label: "2 ~ 5 行", minRows: 2, maxRows: 5 },
  { label: "1 ~ 1 行", minRows: 1, maxRows: 1 },
  { label: "3 ~ 8 行", minRows: 3, maxRows: 8 },
];

const presetIndex = ref(0);
const preset = computed(() => presets[presetIndex.value]);

const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
/** 内容行数（按换行统计，仅用于展示） */
const lineCount = ref(1);

function updateLineCount() {
  lineCount.value = Math.max(1, (editorRef.value?.getText() ?? "").split("\n").length);
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <button
        v-for="(item, index) in presets"
        :key="item.label"
        class="btn"
        :class="{ 'is-active': index === presetIndex }"
        type="button"
        @click="presetIndex = index"
      >
        {{ item.label }}
      </button>
    </div>

    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      :min-rows="preset.minRows"
      :max-rows="preset.maxRows"
      placeholder="换行输入多行内容，观察高度变化"
      @change="updateLineCount"
    />

    <p class="muted">
      最小 {{ preset.minRows }} 行 / 最大 {{ preset.maxRows }} 行 · 当前内容 {{ lineCount }} 行。
      不足最小行数时按最小行高展示；超过最小行数自动擑开；超过最大行数出现滚动条。
    </p>

    <div class="output">
      <div class="output__title">当前值</div>
      <pre>{{ content || "（空）" }}</pre>
    </div>
  </div>
</template>
