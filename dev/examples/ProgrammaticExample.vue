<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members, tags } from "../mock";

const content = ref("用下方按钮操作编辑器，输出面板会实时更新。");
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
const output = ref("（暂无输出）");

const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members },
  { char: "#", label: "标签", items: tags },
];

function show(value: unknown) {
  output.value = typeof value === "string" ? value || "（空）" : JSON.stringify(value, null, 2);
}
</script>

<template>
  <div class="stack">
    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      placeholder="也可以在光标处插入内容…"
      :min-height="96"
    />

    <div class="row">
      <button class="btn" type="button" @click="editorRef?.focus()">focus()</button>
      <button class="btn" type="button" @click="editorRef?.blur()">blur()</button>
      <button
        class="btn"
        type="button"
        @click="editorRef?.insertMention({ id: 'u3', label: '王五' })"
      >
        insertMention(@王五)
      </button>
      <button
        class="btn"
        type="button"
        @click="editorRef?.insertMention({ id: 't1', label: '前端' }, '#')"
      >
        insertMention(#前端)
      </button>
      <button class="btn" type="button" @click="editorRef?.setContent('通过 setContent 覆盖内容')">
        setContent()
      </button>
      <button class="btn" type="button" @click="editorRef?.clear()">clear()</button>
      <button class="btn" type="button" @click="show(editorRef?.getHTML())">getHTML()</button>
      <button class="btn" type="button" @click="show(editorRef?.getText())">getText()</button>
      <button class="btn" type="button" @click="show(editorRef?.getText({ token: 'id' }))">
        getText({ token: 'id' })
      </button>
      <button class="btn" type="button" @click="show(editorRef?.getJSON())">getJSON()</button>
      <button class="btn" type="button" @click="show(editorRef?.getMarkdown())">
        getMarkdown()
      </button>
    </div>

    <div class="output">
      <div class="output__title">输出</div>
      <pre>{{ output }}</pre>
    </div>

    <div class="output">
      <div class="output__title">v-model</div>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>
