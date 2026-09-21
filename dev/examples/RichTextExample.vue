<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import StarterKit from "@tiptap/starter-kit";
import { members } from "../mock";

const content = ref(
  "<p>这里保留了 <strong>加粗</strong>、<em>斜体</em> 与列表能力，同时依然可以输入 @ 提及成员。</p>",
);
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
const editor = computed(() => editorRef.value?.editor);
const version = ref(0);

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];

// 工具栏高亮需要跟随编辑器选区变化刷新
watch(editor, (instance, _previous, onCleanup) => {
  if (!instance) return;
  const handler = () => (version.value += 1);
  instance.on("selectionUpdate", handler);
  instance.on("update", handler);
  onCleanup(() => {
    instance.off("selectionUpdate", handler);
    instance.off("update", handler);
  });
});

function isActive(name: string): boolean {
  void version.value;
  return editor.value?.isActive(name) ?? false;
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <button
        class="btn"
        :class="{ 'is-active': isActive('bold') }"
        type="button"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        加粗
      </button>
      <button
        class="btn"
        :class="{ 'is-active': isActive('italic') }"
        type="button"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        斜体
      </button>
      <button
        class="btn"
        :class="{ 'is-active': isActive('bulletList') }"
        type="button"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        无序列表
      </button>
      <button
        class="btn"
        :class="{ 'is-active': isActive('orderedList') }"
        type="button"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        有序列表
      </button>
      <button class="btn" type="button" @click="editor?.chain().focus().undo().run()">撤销</button>
      <button class="btn" type="button" @click="editor?.chain().focus().redo().run()">重做</button>
    </div>

    <!-- base-extensions=false：基础节点交给 StarterKit，组件只负责提及能力 -->
    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      :base-extensions="false"
      :extensions="[StarterKit]"
      value-format="html"
      placeholder="试试加粗、列表，以及 @ 提及"
      :min-height="160"
    />

    <p class="muted">
      `baseExtensions=false` 后由 StarterKit 提供 Document/Paragraph/Text
      等基础节点，提及能力（Mention 节点与候选面板）仍由组件自动装配。
    </p>
  </div>
</template>
