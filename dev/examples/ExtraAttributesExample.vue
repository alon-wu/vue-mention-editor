<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionAttributes, MentionItem, MentionTrigger } from "vue-mention-editor";
import { members } from "../mock";

/**
 * 声明需要随节点一起存进文档的自定义字段。
 * parseHTML 负责「回显」（从 HTML 属性读回），renderHTML 负责输出到 HTML。
 */
const extraAttributes: MentionAttributes = {
  avatar: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-avatar"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-avatar": attrs.avatar }),
  },
  email: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-email"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-email": attrs.email }),
  },
};

// 模拟从后端读回的、已经保存过的富文本（含 data-avatar / data-email）
const savedFromServer =
  '<p>已指派给 <span class="vme-mention" data-type="mention" data-id="u2" data-label="李四" data-avatar="https://i.pravatar.cc/40?img=32" data-email="lisi@example.com">@李四</span> 处理。</p>';

const content = ref("");
const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
const detail = ref("（点击下方按钮查看节点属性）");

function loadSavedContent() {
  content.value = savedFromServer;
}

/** 插入时把 avatar / email 一并写进节点属性 */
function insertWithAttrs() {
  const item: MentionItem = {
    id: "u1",
    label: "张三",
    description: "zhangsan@example.com",
    avatar: "https://i.pravatar.cc/40?img=12",
    email: "zhangsan@example.com",
  };
  editorRef.value?.insertMention(item);
}

/** 读取文档里全部提及节点的属性 */
function readMentions() {
  const editor = editorRef.value?.editor;
  if (!editor) return;
  const found: Record<string, unknown>[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") found.push(node.attrs);
    return true;
  });
  detail.value = found.length ? JSON.stringify(found, null, 2) : "（文档中没有提及节点）";
}
</script>

<template>
  <div class="stack">
    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      :extra-attributes="extraAttributes"
      value-format="html"
      placeholder="输入 @ 提及成员（会带上头像与邮箱）"
      :min-height="96"
    />

    <div class="row">
      <button class="btn" type="button" @click="insertWithAttrs">插入带属性的提及</button>
      <button class="btn" type="button" @click="loadSavedContent">回显后端保存的内容</button>
      <button class="btn" type="button" @click="readMentions">读取全部提及属性</button>
    </div>

    <div class="output">
      <div class="output__title">HTML（data-avatar / data-email 会一起输出）</div>
      <pre>{{ content || "（空）" }}</pre>
    </div>

    <div class="output">
      <div class="output__title">节点属性</div>
      <pre>{{ detail }}</pre>
    </div>
  </div>
</template>
