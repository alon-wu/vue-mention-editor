<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type {
  MentionAttributes,
  MentionItem,
  MentionRenderHTML,
  MentionTrigger,
} from "vue-mention-editor";

interface ResourceItem extends MentionItem {
  kind: "image" | "video" | "file";
  thumb: string;
  size: string;
}

const resources: ResourceItem[] = [
  {
    id: "/uploads/beach.png",
    label: "海边清晨.png",
    kind: "image",
    thumb: "https://picsum.photos/seed/beach/48",
    size: "1.2 MB",
  },
  {
    id: "/uploads/demo.mp4",
    label: "演示视频.mp4",
    kind: "video",
    thumb: "https://picsum.photos/seed/video/48",
    size: "8.4 MB",
  },
  { id: "/uploads/report.pdf", label: "季度报告.pdf", kind: "file", thumb: "", size: "840 KB" },
  {
    id: "/uploads/finance-fy24.pdf",
    label: "2024 财年财务决算报表（合并口径 · 终版）.pdf",
    kind: "file",
    thumb: "",
    size: "2.1 MB",
  },
];

/** 声明随节点保存的自定义字段 */
const extraAttributes: MentionAttributes = {
  kind: {
    default: "file",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-kind"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-kind": attrs.kind }),
  },
  thumb: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-thumb"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-thumb": attrs.thumb }),
  },
  size: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-size"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-size": attrs.size }),
  },
};

/** 自定义提及块结构：缩略图 / 类型图标 + 文件名 */
const renderMentionHtml: MentionRenderHTML = ({ node }) => {
  const attrs = node.attrs as Record<string, string>;
  const kind = attrs.kind ?? "file";
  const label = attrs.label ?? attrs.id;

  const leading =
    kind === "image" && attrs.thumb
      ? ["img", { class: "vme-mention__thumb", src: attrs.thumb, alt: label }]
      : [
          "span",
          { class: "vme-mention__icon" },
          kind === "video" ? "🎬" : kind === "image" ? "🖼️" : "📄",
        ];

  return [
    "span",
    {
      class: "vme-mention vme-mention--pill vme-mention--resource",
      "data-type": "mention",
      "data-id": attrs.id,
      "data-label": label,
      "data-kind": kind,
      "data-thumb": attrs.thumb,
      "data-size": attrs.size,
    },
    leading,
    ["span", { class: "vme-mention__label" }, label],
    ["span", { class: "vme-mention__size" }, attrs.size ?? ""],
  ] as unknown as ReturnType<MentionRenderHTML>;
};

const content = ref("");
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
/** 扩展输出：需要看点结构 / 属性时再取 HTML（chip 的 data-* 都在里面） */
const html = ref("");

function refreshHtml() {
  html.value = editorRef.value?.getHTML() ?? "";
}

const triggers: MentionTrigger[] = [{ char: "@", label: "选择资源", items: resources }];
</script>

<template>
  <div class="stack">
    <MentionEditor
      ref="editorRef"
      v-model="content"
      :triggers="triggers"
      :extra-attributes="extraAttributes"
      :mention-render-html="renderMentionHtml"
      placeholder="输入 @ 选择资源，选中后会渲染成资源 chip"
      :min-rows="2"
      @ready="refreshHtml"
      @change="refreshHtml"
    />

    <p class="muted">
      提及块的结构完全由 `mention-render-html` 决定：示例渲染为「图标 + 文件名 + 体积」，同时把 kind
      / thumb / size 写进节点的 data-*
      属性，随内容一起保存。文件名过长时只截断标签部分（末尾省略号）， 图标与体积保持可见。
    </p>

    <div class="output">
      <div class="output__title">v-model（纯文本，默认：@ + id）</div>
      <pre>{{ content || "（空）" }}</pre>
    </div>

    <div class="output">
      <div class="output__title">getHTML()（扩展输出：注意 data-* 自定义属性）</div>
      <pre>{{ html || "（空）" }}</pre>
    </div>
  </div>
</template>

<style scoped>
/* 布局（尺寸 / 内边距 / 圆角）与垂直对齐交给库里的 vme-mention--pill，示例只写配色 */
:deep(.vme-content .vme-mention--resource) {
  margin: 0 2px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12.5px;
}

:deep(.vme-content .vme-mention__thumb) {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

:deep(.vme-content .vme-mention__icon) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  font-size: 11px;
  line-height: 1;
}

/* 只截断文件名，图标始终可见 */
:deep(.vme-content .vme-mention__label) {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.vme-content .vme-mention__size) {
  flex-shrink: 0;
  color: #6366f1;
  font-size: 11px;
}
</style>
