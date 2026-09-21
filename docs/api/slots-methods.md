# 插槽与实例方法

## 插槽

### `#item`

替换候选面板中的单项渲染。不提供时使用内置样式（头像 + 主标题 + 描述）。

```vue
<MentionEditor v-model="content" :triggers="triggers">
  <template #item="{ item, index, query, selected, trigger }">
    <div :class="{ active: selected }">{{ item.label }}</div>
  </template>
</MentionEditor>
```

| 插槽参数   | 类型          | 说明                     |
| ---------- | ------------- | ------------------------ |
| `item`     | `MentionItem` | 当前候选项               |
| `index`    | `number`      | 候选列表中的下标         |
| `query`    | `string`      | 当前查询串（不含触发符） |
| `selected` | `boolean`     | 是否处于键盘高亮状态     |
| `trigger`  | `string`      | 命中的触发符，如 `@`     |

插槽在父组件作用域渲染，可直接使用父组件的状态与样式（详见 [外观定制](../guide/customizing.md#一item-插槽自定义候选项)）。

### `#empty`

自定义候选面板的空状态（默认展示「无匹配结果」或触发符的 `emptyText`）。

```vue
<MentionEditor v-model="content" :triggers="triggers">
  <template #empty>
    <div class="my-empty">没有找到匹配的资源，换个关键词试试</div>
  </template>
</MentionEditor>
```

> 面板是独立渲染的实例，插槽只接收 `item` 等数据，不接收参数；如需按触发符区别展示，可用 `triggers[i].emptyText`。

### `#placeholder`

渲染空内容的占位内容，可放任意组件（字符串与 VNode 也可以直接传给 `placeholder` 属性）。

```vue
<MentionEditor v-model="content" :triggers="triggers">
  <template #placeholder>
    <span class="ph">按 <kbd>@</kbd> 提及资源</span>
  </template>
</MentionEditor>
```

详见 [Props：placeholder](./props.md#placeholder)。

### `#mention-tip`

编辑区内**提及块**的悬浮提示内容。组件负责命中检测与定位，插槽只决定「显示什么」：

```vue
<MentionEditor v-model="value" :triggers="triggers">
  <template #mention-tip="{ attrs, id, label, trigger, hide }">
    <img v-if="attrs.kind === 'image'" :src="String(attrs.preview)" />
    <video v-else-if="attrs.kind === 'video'" :src="String(attrs.preview)" controls />
    <div v-else>{{ label }}</div>
  </template>
</MentionEditor>
```

| 插槽参数  | 类型                      | 说明                                                                   |
| --------- | ------------------------- | ---------------------------------------------------------------------- |
| `attrs`   | `Record<string, unknown>` | 提及块的全部节点属性（含 `extraAttributes` 声明的字段，取自 `data-*`） |
| `id`      | `string`                  | 节点 id                                                                |
| `label`   | `string`                  | 节点 label（缺失时回退 id）                                            |
| `trigger` | `string`                  | 命中触发符，如 `@` / `/` / `#`                                         |
| `hide`    | `() => void`              | 立即关闭浮层（例如资源已失效时）                                       |

行为要点：

- 默认延迟 120ms 显示、80ms 隐藏，可用 `mentionHover` 调整；
- 鼠标移入浮层不会关闭（便于播放媒体、滚动长文本、点击链接）；
- 正文很大时不建议写进 `data-*`：只存 id，悬浮时用 `attrs.id` 再请求详情。

## 实例方法

通过模板 `ref` 获取：

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";

const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
</script>

<template>
  <MentionEditor ref="editorRef" v-model="content" :triggers="triggers" />
</template>
```

| 成员 / 方法                  | 类型                                                  | 说明                                                            |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| `editor`                     | `Editor \| undefined`                                 | tiptap 编辑器实例（挂载后可用），可直接调用其 API               |
| `focus()`                    | `() => void`                                          | 聚焦到内容末尾                                                  |
| `blur()`                     | `() => void`                                          | 失焦                                                            |
| `clear()`                    | `() => void`                                          | 清空内容（保留一条空段落）                                      |
| `setContent(value)`          | `(value: string) => void`                             | 覆盖内容（自动适配 `valueFormat`，不触发循环）                  |
| `getHTML()`                  | `() => string`                                        | 当前 HTML                                                       |
| `getText()`                  | `() => string`                                        | 当前纯文本（mention 序列化为 `@ + id`）                         |
| `getJSON()`                  | `() => JSONContent \| null`                           | 当前文档 JSON                                                   |
| `insertMention(item, char?)` | `(item: MentionItem, char?: string) => void`          | 在光标处插入提及节点（必要时自动补空格）                        |
| `getMentions()`              | `() => Record<string, unknown>[]`                     | 读取文档中全部提及节点的属性                                    |
| `removeMentions(match)`      | `(match: string[] \| ((attrs) => boolean)) => number` | 删除匹配的提及（含其后空格），返回删除数量                      |
| `refreshMentions()`          | `() => number`                                        | 按 `textValue.resolve` 重新解析提及并补齐展示字段，返回更新数量 |

### 常见用法

```ts
// 聚焦 / 失焦
editorRef.value?.focus();
editorRef.value?.blur();

// 清空（例如发送消息后）
editorRef.value?.clear();

// 覆盖内容（例如切换会话）
editorRef.value?.setContent(savedHtml);

// 取数据（v-model 默认就是纯文本；以下为扩展输出）
const html = editorRef.value?.getHTML();
const markdown = editorRef.value?.getMarkdown();
const json = editorRef.value?.getJSON();

// 同一份内容的两种文本形态（不用改配置）
const readable = editorRef.value?.getText(); // '@张三'
const machine = editorRef.value?.getText({ token: "id" }); // '@u1'

// 外部按钮插入提及
editorRef.value?.insertMention({ id: "u1", label: "张三" });
editorRef.value?.insertMention({ id: "t1", label: "前端" }, "#");

// 读取文档中的提及（用于提交时上报）
const mentions = editorRef.value?.getMentions() ?? [];

// 按 id 删除提及（例如文件被删了）
const removed = editorRef.value?.removeMentions(["/uploads/a.png"]);

// 自定义判定：删除所有引用了已失效资源的提及
editorRef.value?.removeMentions((attrs) => !validIds.has(String(attrs.id)));

// 绑定值先到、资源数据后到：数据到位后补齐标题 / 缩略图（传了 mention-pool 时会自动执行）
const updated = editorRef.value?.refreshMentions();

// 直接使用 tiptap 实例（例如自定义命令）
editorRef.value?.editor?.chain().focus().insertContent("追加文本").run();
```

完整示例：[dev/examples/ProgrammaticExample.vue](../../dev/examples/ProgrammaticExample.vue)

## 相关

- [Props](./props.md)
- [事件](./events.md)
