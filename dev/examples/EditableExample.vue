<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members } from "../mock";

const editable = ref(true);
const remountKey = ref(0);

// 已保存内容：默认就是文本值（`@ + id`），展示信息靠 textValue.resolve 还原
const savedContent = ref("已指派给 @u2，请在周五前给出结论。");

/** token（id）→ 候选项：文本值里只有 id，label / 头像等展示信息由它补回 */
const textValue = {
  resolve: (token: string) => members.find((member) => member.id === token),
};

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];

/** 挂载即聚焦的示例内容 */
const focusedContent = "挂载即聚焦：@u1";
</script>

<template>
  <div class="stack">
    <label class="switch">
      <input v-model="editable" type="checkbox" />
      可编辑状态：{{ editable ? "editable" : "readonly" }}
    </label>

    <MentionEditor
      v-model="savedContent"
      :triggers="triggers"
      :text-value="textValue"
      :editable="editable"
      :min-height="88"
      placeholder="切换为可编辑后即可输入 @"
    />

    <div class="row">
      <button class="btn" type="button" @click="remountKey += 1">重新挂载（autofocus）</button>
      <span class="muted">重新挂载后光标会落到末尾</span>
    </div>

    <MentionEditor
      :key="remountKey"
      :model-value="focusedContent"
      :triggers="triggers"
      :text-value="textValue"
      autofocus
      :min-height="64"
      placeholder="autofocus 示例"
    />

    <p class="muted">
      只读回显同样是文本值：`@u2` 加上 `textValue.resolve` 就能渲染成带名称的 chip； `editable`
      适合需要随时切换「可编辑 / 只读」的场景；纯展示（不参与编辑）也可以直接用 `getHTML()` 的结果配
      `v-html` 渲染。
    </p>
  </div>
</template>
