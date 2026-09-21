<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type {
  MentionAttributes,
  MentionItem,
  MentionRenderHTML,
  MentionTrigger,
} from "vue-mention-editor";

interface DocumentRef extends MentionItem {
  /** 完整正文（很长，只在悬浮提示里展开） */
  content: string;
  source: string;
}

const documents: DocumentRef[] = [
  {
    id: "doc-onboarding",
    label: "新人入职指引 · 第 3 节（开发环境）",
    source: "内部 Wiki",
    content:
      "1. 安装 Node.js LTS 与 bun；\n2. 执行 bun install 安装依赖；\n3. 复制 .env.example 为 .env 并填写本地配置；\n4. bun run dev 启动本地服务，默认端口 5173；\n5. 提交前请执行 bun run test 与 bun run format:check。",
  },
  {
    id: "doc-slo",
    label: "服务等级目标（SLO）约定",
    source: "架构文档",
    content:
      "可用性：核心接口月度可用性 ≥ 99.9%；\n延迟：P95 < 200ms、P99 < 500ms；\n错误率：5xx 占比 < 0.1%；\n违反约定需在周会上给出改进方案并跟踪闭环。",
  },
];

const extraAttributes: MentionAttributes = {
  content: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-content"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-content": attrs.content }),
  },
  source: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-source"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-source": attrs.source }),
  },
};

/** chip：`#` 徒标 + 标题（只截断标题，徒标始终可见） */
const renderMentionHtml: MentionRenderHTML = ({ node }) => {
  const attrs = node.attrs as Record<string, string>;
  const label = attrs.label ?? attrs.id;

  return [
    "span",
    {
      class: "vme-mention vme-mention--pill vme-mention--doc",
      "data-type": "mention",
      "data-id": attrs.id,
      "data-label": label,
      "data-source": attrs.source,
      "data-content": attrs.content,
    },
    ["span", { class: "vme-mention__badge" }, "#"],
    ["span", { class: "vme-mention__name" }, label],
  ] as unknown as ReturnType<MentionRenderHTML>;
};

const triggers: MentionTrigger[] = [
  { char: "#", label: "引用资料", items: documents, emptyText: "没有匹配的资料" },
];

/** 服务端保存的值：`#资料id` + 指令 */
const savedValue = "#doc-slo 把这份约定整理成表格，并标出我们当前可能不达标的项";
const value = ref(savedValue);

const textValue = {
  resolve: (token: string) => documents.find((item) => item.id === token),
};
</script>

<template>
  <div class="stack">
    <MentionEditor
      v-model="value"
      :triggers="triggers"
      :text-value="textValue"
      :extra-attributes="extraAttributes"
      :mention-render-html="renderMentionHtml"
      :min-rows="2"
      :max-rows="6"
      :mention-hover="{ placement: 'bottom-start' }"
      placeholder="输入 # 引用一段资料"
    >
      <!-- 悬浮提示：展开完整正文（长文本同样适用） -->
      <template #mention-tip="{ label, attrs }">
        <div class="doc-tip">
          <div class="doc-tip__head">
            <span class="doc-tip__title">{{ label }}</span>
            <span class="doc-tip__source">{{ attrs.source }}</span>
          </div>
          <pre class="doc-tip__content">{{ attrs.content }}</pre>
        </div>
      </template>
    </MentionEditor>

    <div class="output">
      <div class="output__title">v-model（`#资料id` + 指令）</div>
      <pre>{{ value || "（空）" }}</pre>
    </div>

    <p class="muted">
      引用长文本的做法与技能一致：chip 只显示标题（过长自动省略），完整正文放在 `#mention-tip`
      插槽里滚动查看；如果正文很大，建议只存 id，在悬浮时再请求详情。
    </p>
  </div>
</template>

<style scoped>
/* 布局与垂直对齐交给库里的 vme-mention--pill；选择器带上 .vme-content 保证权重高于库默认样式 */
:deep(.vme-content .vme-mention--doc) {
  margin: 0 2px;
  border: 1px solid var(--demo-border-strong);
  background: var(--demo-surface);
  color: #374151;
  font-size: 12.5px;
}

:deep(.vme-content .vme-mention__badge) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background: #e5e7eb;
  color: #4b5563;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
}

/* 只截断标题，徒标不会被省略 */
:deep(.vme-content .vme-mention--doc .vme-mention__name) {
  display: inline-block;
  max-width: 168px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-tip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 不超过气泡宽度上限（--vme-tip-max-width，默认 260px，减去内边距） */
  width: 240px;
}

.doc-tip__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.doc-tip__title {
  font-weight: 600;
}

.doc-tip__source {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--demo-surface-muted);
  color: var(--demo-text-subtle);
  font-size: 11px;
}

.doc-tip__content {
  max-height: 176px;
  margin: 0;
  overflow-y: auto;
  color: var(--demo-text-muted);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
