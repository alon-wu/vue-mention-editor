# 场景配方

以下都是可直接复制的最小片段，完整可运行版本见 `dev/examples/`。

## 1. 聊天输入框（Enter 发送，Shift + Enter 换行）

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionChangePayload, MentionTrigger } from "vue-mention-editor";

const triggers: MentionTrigger[] = [{ char: "@", items: members }];
const draft = ref("");
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);

function send(payload: MentionChangePayload) {
  if (payload.isEmpty) return;
  api.sendMessage(payload.html); // 或 payload.editor.getJSON()
  editorRef.value?.clear();
}
</script>

<template>
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
</template>
```

要点：`submitOnEnter` 只管 Enter；面板展开时 Enter 仍然用于选择候选项，两者不会打架。

示例：[dev/examples/ChatInputExample.vue](../../dev/examples/ChatInputExample.vue)

## 2. 评论 / 回复框

```vue
<MentionEditor
  v-model="comment"
  :triggers="triggers"
  placeholder="写下你的看法，@ 可以提醒同事"
  :min-height="88"
  :max-height="200"
  @mention:select="({ item }) => analytics.track('comment_mention', item.id)"
/>
```

## 3. 与 StarterKit 组合成富文本

默认只装了最小节点集（Document / Paragraph / Text / UndoRedo）。需要加粗、列表时，用 `baseExtensions=false` 关掉内置基础节点，交给 StarterKit：

```vue
<script setup lang="ts">
import StarterKit from "@tiptap/starter-kit";

const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
</script>

<template>
  <button @click="editorRef?.editor?.chain().focus().toggleBold().run()">加粗</button>
  <MentionEditor
    ref="editorRef"
    v-model="content"
    :triggers="triggers"
    :base-extensions="false"
    :extensions="[StarterKit]"
    value-format="html"
  />
</template>
```

组件仍会自动补上提及扩展，不必自己配置。注意：富文本场景要显式写 `value-format="html"`，否则 v-model 会把加粗 / 列表压成纯文本。

示例：[dev/examples/RichTextExample.vue](../../dev/examples/RichTextExample.vue)

## 4. 弹窗 / 抽屉内使用

面板默认挂到 `document.body`。在 Dialog / Drawer 中建议显式指定容器，避免被弹窗的裁剪或层叠上下文影响：

```ts
const modalTriggers: MentionTrigger[] = [{ char: "@", items: members, container: ".modal-body" }];
```

```css
.modal-body {
  position: relative; /* 让面板以弹窗内容区为定位参考 */
  overflow: visible; /* 避免浮层被裁掉 */
}
```

示例：[dev/examples/ModalExample.vue](../../dev/examples/ModalExample.vue)

## 5. 外部按钮插入提及

工具栏、快捷回复等场景可以用 `ref` 直接插入：

```ts
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);

// 使用默认（第一个）触发符
editorRef.value?.insertMention({ id: "u1", label: "张三" });

// 指定触发符
editorRef.value?.insertMention({ id: "t1", label: "前端" }, "#");
```

插入位置是当前光标处（会自动 `focus()`），并在节点后补一个空格。

## 6. 动态只读

```vue
<script setup lang="ts">
const canEdit = ref(false);
</script>

<template>
  <MentionEditor v-model="content" :triggers="triggers" :editable="canEdit" />
</template>
```

`editable` 变化会实时生效；纯展示场景也可以直接用 `v-html` 渲染保存的 HTML（需引入组件样式以显示提及节点样式）。

## 7. 中文拼音 / 自定义过滤

```ts
{
  char: "@",
  items: members,
  filter: (item, query) =>
    item.label.includes(query) ||
    (item.pinyin as string[]).some((p) => p.startsWith(query.toLowerCase())),
}
```

## 8. 中文输入法（IME）注意

编辑器本身兼容 IME：`submitOnEnter` 在 `isComposing` 状态下不会触发 `submit`，输入法候选框里的回车不会误发消息。自定义快捷键时也请判断：

```ts
if (event.isComposing || event.keyCode === 229) return;
```

## 9. 提交前统一校验

```ts
function onSubmit(payload: MentionChangePayload) {
  const text = payload.editor.getText().trim();
  if (!text) return message.warning("请输入内容");

  const ids = collectMentionIds(payload.editor);
  api.submit({ html: payload.html, mentions: ids });
}
```

## 10. 一页多实例

每个实例都有独立的编辑器与配置，互不影响：

```vue
<MentionEditor v-model="a" :triggers="memberTriggers" />
<MentionEditor v-model="b" :triggers="tagTriggers" :editable="false" />
```

## 下一步

- [API：Props](../api/props.md)
- [常见问题 FAQ](../faq.md)
