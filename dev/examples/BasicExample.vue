<script setup lang="ts">
import { computed, ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTextToken, MentionTrigger } from "vue-mention-editor";
import "vue-mention-editor/style.css";
import { members } from "../mock";

const content = ref("你好，欢迎使用 vue-mention-editor。");

const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
/** 扩展输出：需要富文本 / Markdown 时再取 */
const html = ref("");
const markdown = ref("");

/**
 * 文本值里的提及写成什么：
 * - `id`（默认）：`@u1` —— 稳定、可往返，适合提交后端；
 * - `label`：`@张三` —— 值本身就直读，回显时用 resolve 换回真实 id。
 */
const tokenMode = ref<MentionTextToken>("id");
const textValue = computed(() => ({
  token: tokenMode.value,
  resolve: (token: string) =>
    members.find((member) =>
      tokenMode.value === "id" ? member.id === token : member.label === token,
    ),
}));

/** 切换 token 形态：用 getText({ token }) 把当前内容重新序列化一次，观察 v-model 变化 */
function switchToken(mode: MentionTextToken) {
  tokenMode.value = mode;
  content.value = editorRef.value?.getText({ token: mode }) ?? content.value;
}

function refreshOutputs() {
  html.value = editorRef.value?.getHTML() ?? "";
  markdown.value = editorRef.value?.getMarkdown() ?? "";
}

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员",
    items: members,
  },
];
</script>

<template>
  <div class="stack">
    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      :text-value="textValue"
      placeholder="输入 @ 提及成员…"
      :min-height="96"
      @ready="refreshOutputs"
      @change="refreshOutputs"
    />

    <div class="row">
      <span class="muted">文本值里的提及写成：</span>
      <button
        class="btn"
        :class="{ 'is-active': tokenMode === 'id' }"
        type="button"
        @click="switchToken('id')"
      >
        @u1（id，默认）
      </button>
      <button
        class="btn"
        :class="{ 'is-active': tokenMode === 'label' }"
        type="button"
        @click="switchToken('label')"
      >
        @张三（label，可读）
      </button>
    </div>

    <div class="row">
      <button class="btn" type="button" @click="content = ''">通过 v-model 清空</button>
      <button class="btn" type="button" @click="content = '重置后的文本内容'">
        通过 v-model 重置
      </button>
      <span class="muted">值长度：{{ content.length }}</span>
    </div>

    <div class="output">
      <div class="output__title">v-model（纯文本，默认）</div>
      <pre>{{ content || "（空）" }}</pre>
    </div>

    <div class="output">
      <div class="output__title">扩展输出：getHTML()</div>
      <pre>{{ html || "（空）" }}</pre>
    </div>

    <div class="output">
      <div class="output__title">扩展输出：getMarkdown()</div>
      <pre>{{ markdown || "（空）" }}</pre>
    </div>
  </div>
</template>
