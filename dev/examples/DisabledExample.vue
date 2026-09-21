<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members } from "../mock";

// 默认文本值：`@ + id`，展示信息（label）由 textValue.resolve 补回
const content = ref("已指派给 @u2。");

/** token（id）→ 候选项 */
const textValue = {
  resolve: (token: string) => members.find((member) => member.id === token),
};

const triggers: MentionTrigger[] = [{ char: "@", items: members }];

type Mode = "normal" | "readonly" | "disabled";
const mode = ref<Mode>("normal");

const modes: { key: Mode; label: string; description: string }[] = [
  { key: "normal", label: "正常", description: "editable = true，可输入可聚焦" },
  { key: "readonly", label: "只读", description: "editable = false，内容可选中复制，但不可编辑" },
  {
    key: "disabled",
    label: "禁用",
    description: "disabled = true，置灰且不可聚焦（优先级高于 editable）",
  },
];

const current = () => modes.find((item) => item.key === mode.value);
</script>

<template>
  <div class="stack">
    <div class="row">
      <button
        v-for="item in modes"
        :key="item.key"
        class="btn"
        :class="{ 'is-active': mode === item.key }"
        type="button"
        @click="mode = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <MentionEditor
      v-model="content"
      :triggers="triggers"
      :text-value="textValue"
      :editable="mode !== 'readonly'"
      :disabled="mode === 'disabled'"
      :min-rows="2"
      placeholder="切换状态后试着点击 / 输入"
    />

    <p class="muted">{{ current()?.description }}</p>
    <p class="muted">
      提示：禁用态会同时置灰并阻止聚焦；只读态保留文本选择能力，适合「查看模式」。
    </p>
  </div>
</template>
