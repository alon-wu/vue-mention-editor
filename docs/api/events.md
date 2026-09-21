# 事件

| 事件                | 载荷                        | 触发时机                                                      |
| ------------------- | --------------------------- | ------------------------------------------------------------- |
| `update:modelValue` | `value: string`             | 内容变化（v-model 同步，默认文本格式，由 `valueFormat` 决定） |
| `change`            | `MentionChangePayload`      | 内容变化（携带 value / html / text / JSON 与实例）            |
| `mention:select`    | `{ item, trigger, editor }` | 用户从面板中选中某个候选项                                    |
| `submit`            | `MentionChangePayload`      | 开启 `submitOnEnter` 且按下 Enter                             |
| `ready`             | `editor: Editor`            | 编辑器初始化完成                                              |
| `focus`             | `editor: Editor`            | 编辑器获得焦点                                                |
| `blur`              | `editor: Editor`            | 编辑器失去焦点                                                |

## 载荷类型

```ts
interface MentionChangePayload {
  value: string; // 当前值：默认纯文本（`@+id`）；valueFormat='html' 时为 HTML
  html: string; // 扩展输出：HTML（始终可用）
  text: string; // 可读文本（mention 序列化为 `@ + label`）
  json: JSONContent; // 扩展输出：JSON
  editor: Editor; // tiptap 编辑器实例
  isEmpty: boolean; // 文档是否为空（用于禁用发送按钮）
}
```

```ts
// mention:select
interface MentionSelectEvent {
  item: MentionItem; // 被选中的候选项
  trigger: string; // 命中的触发符，如 '@'
  editor: Editor;
}
```

## 用法示例

### 内容变化时做字数统计

```vue
<script setup lang="ts">
import type { MentionChangePayload } from "vue-mention-editor";

const length = ref(0);

function onChange(payload: MentionChangePayload) {
  length.value = payload.editor.getText().length;
}
</script>

<template>
  <MentionEditor v-model="content" :triggers="triggers" @change="onChange" />
  <span>{{ length }} 字</span>
</template>
```

### 记录「提及了谁」

```ts
function onMentionSelect({ item, trigger }: { item: MentionItem; trigger: string }) {
  console.log(`${trigger}${item.label}`, item.id);
  analytics.track("mention_select", { id: item.id, trigger });
}
```

### 提交（Enter 发送）

```vue
<MentionEditor v-model="draft" :triggers="triggers" submit-on-enter @submit="send" />
```

```ts
function send(payload: MentionChangePayload) {
  if (payload.isEmpty) return; // 空内容不发送
  api.send({ html: payload.html });
  editorRef.value?.clear();
}
```

### 编辑器就绪后初始化内容

```vue
<script setup lang="ts">
function onReady(editor: Editor) {
  editor.commands.setContent(savedHtml);
}
</script>

<template>
  <MentionEditor :model-value="''" :triggers="triggers" @ready="onReady" />
</template>
```

> 通常直接用 `v-model` 传入初始内容即可；`ready` 适合需要拿到实例做额外初始化的场景。

## 相关

- [Props](./props.md)
- [插槽与实例方法](./slots-methods.md)
