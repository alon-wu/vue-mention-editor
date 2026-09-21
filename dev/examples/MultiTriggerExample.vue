<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionSelectPayload, MentionTrigger } from "vue-mention-editor";
import { commands, members, tags } from "../mock";

const content = ref("");
const events = ref<string[]>([]);

const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members },
  { char: "#", label: "插入标签", items: tags },
  { char: "/", label: "快捷指令", items: commands, emptyText: "没有匹配的指令" },
];

function onSelect(payload: MentionSelectPayload) {
  events.value = [`${payload.trigger} → ${payload.item.label}`, ...events.value].slice(0, 6);
}
</script>

<template>
  <div class="stack">
    <MentionEditor
      v-model="content"
      :triggers="triggers"
      placeholder="分别输入 @ / # / / 体验三种触发符"
      :min-height="120"
      @mention:select="onSelect"
    />

    <div class="muted">最近选择：{{ events.join("；") || "暂无" }}</div>

    <div class="output">
      <div class="output__title">
        v-model（HTML，注意 data-mention-suggestion-char 记录了触发符）
      </div>
      <pre>{{ content || "（空）" }}</pre>
    </div>
  </div>
</template>
