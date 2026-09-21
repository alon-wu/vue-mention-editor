<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionChangePayload, MentionTrigger } from "vue-mention-editor";
import { members, tags } from "../mock";

interface Message {
  id: number;
  html: string;
}

const draft = ref("");
const messages = ref<Message[]>([]);
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
let seed = 0;

const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members },
  { char: "#", label: "标签", items: tags },
];

function append(html: string) {
  messages.value = [...messages.value, { id: ++seed, html }];
  editorRef.value?.clear();
}

/** submitOnEnter 触发：Enter 发送，Shift + Enter 换行 */
function send(payload: MentionChangePayload) {
  if (payload.isEmpty) return;
  append(payload.html);
}

/** 按钮发送：直接读编辑器实例 */
function sendByButton() {
  const editor = editorRef.value?.editor;
  if (!editor || editor.isEmpty) return;
  append(editor.getHTML());
}

function reset() {
  messages.value = [];
}
</script>

<template>
  <div class="stack">
    <div class="chat">
      <p v-if="!messages.length" class="muted">
        还没有消息：输入 @ 提及成员或 # 加标签，按 Enter 发送。
      </p>
      <div
        v-for="message in messages"
        :key="message.id"
        class="chat__bubble"
        v-html="message.html"
      />
    </div>

    <MentionEditor
      ref="editorRef"
      v-model="draft"
      :triggers="triggers"
      placeholder="按 Enter 发送，Shift + Enter 换行"
      :min-height="72"
      :max-height="140"
      submit-on-enter
      @submit="send"
    />

    <div class="row">
      <button class="btn btn--primary" type="button" @click="sendByButton">发送（按钮触发）</button>
      <button class="btn" type="button" @click="reset">清空消息</button>
      <span class="muted">共 {{ messages.length }} 条</span>
    </div>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat__bubble {
  align-self: flex-start;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: #eef2ff;
  font-size: 14px;
}

.chat__bubble :deep(p) {
  margin: 0;
}
</style>
