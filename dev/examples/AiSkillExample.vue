<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type {
  MentionAttributes,
  MentionItem,
  MentionRenderHTML,
  MentionTrigger,
} from "vue-mention-editor";

interface Skill extends MentionItem {
  /** 完整描述（chip 上放不下，放进悬浮提示） */
  summary: string;
  category: string;
}

const skills: Skill[] = [
  {
    id: "translate-zh",
    label: "长文翻译（英译中并保留术语表）",
    summary: "把英文长文翻译成中文，代码块与专业术语保持原样。",
    category: "文本",
  },
  {
    id: "summarize",
    label: "要点总结",
    summary: "输出不超过 5 条要点，每条一行，附原文引用。",
    category: "文本",
  },
  {
    id: "code-review",
    label: "代码审查（含性能与安全建议）",
    summary: "逐文件给出问题清单、严重级别与修改建议。",
    category: "代码",
  },
];

const extraAttributes: MentionAttributes = {
  summary: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-summary"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-summary": attrs.summary }),
  },
  category: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-category"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-category": attrs.category }),
  },
};

const renderMentionHtml: MentionRenderHTML = ({ node }) => {
  const attrs = node.attrs as Record<string, string>;
  const label = attrs.label ?? attrs.id;

  return [
    "span",
    {
      class: "vme-mention vme-mention--pill vme-mention--skill",
      "data-type": "mention",
      "data-id": attrs.id,
      "data-label": label,
      "data-summary": attrs.summary,
      "data-category": attrs.category,
    },
    ["span", { class: "vme-mention__badge" }, "/"],
    ["span", { class: "vme-mention__name" }, label],
  ] as unknown as ReturnType<MentionRenderHTML>;
};

const triggers: MentionTrigger[] = [
  {
    char: "/",
    label: "选择技能",
    items: skills,
    emptyText: "没有匹配的技能",
    // 关键：技能只能引用一个，再次选择会替换已有的那个
    limit: 1,
  },
];

/** 服务端保存的值：`/技能id` + 提示词 */
const savedValue = "/translate-zh 把这段英文 README 翻译成中文";
const value = ref(savedValue);
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
const mentionCount = ref(0);

const textValue = {
  resolve: (token: string) => skills.find((item) => item.id === token),
};

function refresh() {
  mentionCount.value = editorRef.value?.getMentions().length ?? 0;
}
</script>

<template>
  <div class="stack">
    <MentionEditor
      ref="editorRef"
      v-model="value"
      :triggers="triggers"
      :text-value="textValue"
      :extra-attributes="extraAttributes"
      :mention-render-html="renderMentionHtml"
      :min-rows="2"
      :max-rows="6"
      placeholder="输入 / 选择技能（只能选一个）"
      @mention:select="refresh"
      @change="refresh"
    >
      <!-- 悬浮提示：技能名过长时完整展示，并附上描述 -->
      <template #mention-tip="{ label, attrs }">
        <div class="skill-tip">
          <div class="skill-tip__head">
            <span class="skill-tip__cat">{{ attrs.category || "技能" }}</span>
            <span class="skill-tip__name">{{ label }}</span>
          </div>
          <p class="skill-tip__summary">{{ attrs.summary }}</p>
        </div>
      </template>
    </MentionEditor>

    <div class="output">
      <div class="output__title">v-model（`/技能id` + 提示词）</div>
      <pre>{{ value || "（空）" }}</pre>
    </div>

    <p class="muted">
      已引用技能：{{ mentionCount }} 个 · 再输入 <code>/</code> 选择其它技能会
      <strong>替换</strong>已有的那个（通过
      <code>triggers[].limit = 1</code> 声明，无需写业务代码）。 技能名过长时 chip
      显示省略号，悬浮即可看到完整名称与描述。
    </p>
  </div>
</template>

<style scoped>
/* 布局与垂直对齐交给库里的 vme-mention--pill，示例只写配色 */
:deep(.vme-content .vme-mention--skill) {
  margin: 0 2px;
  border: 1px solid var(--demo-brand-border);
  background: var(--demo-brand-soft);
  color: var(--demo-brand-text);
  font-size: 12.5px;
}

:deep(.vme-content .vme-mention__badge) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--demo-brand);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
}

/* 只截断技能名，徒标不会被省略 */
:deep(.vme-content .vme-mention--skill .vme-mention__name) {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-tip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 220px;
}

.skill-tip__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-tip__cat {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--demo-brand-soft);
  color: var(--demo-brand-text);
  font-size: 11px;
}

.skill-tip__name {
  font-weight: 600;
}

.skill-tip__summary {
  margin: 0;
  color: var(--demo-text-muted);
  font-size: 12.5px;
  line-height: 1.6;
}
</style>
