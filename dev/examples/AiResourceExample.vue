<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type {
  MentionAttributes,
  MentionItem,
  MentionRenderHTML,
  MentionTrigger,
} from "vue-mention-editor";

interface Resource extends MentionItem {
  kind: "image" | "video" | "audio" | "file";
  thumb: string;
  /** 预览地址（悬浮提示里播放/展示用；真实项目里通常由服务端返回） */
  preview: string;
  size: string;
}

/** 模拟「已上传的资源列表」，id 即服务端 src */
function createResources(): Resource[] {
  return [
    {
      id: "/uploads/beach.png",
      label: "海边清晨.png",
      kind: "image",
      thumb: "https://picsum.photos/seed/beach/48",
      preview: "https://picsum.photos/seed/beach/600/400",
      size: "1.2 MB",
    },
    {
      id: "/uploads/demo.mp4",
      label: "演示视频.mp4",
      kind: "video",
      thumb: "https://picsum.photos/seed/video/48",
      preview: "https://www.w3schools.com/html/mov_bbb.mp4",
      size: "8.4 MB",
    },
    {
      id: "/uploads/voice.mp3",
      label: "会议录音.mp3",
      kind: "audio",
      thumb: "",
      preview: "https://www.w3schools.com/html/horse.mp3",
      size: "2.1 MB",
    },
    {
      id: "/uploads/report.pdf",
      label: "季度报告.pdf",
      kind: "file",
      thumb: "",
      preview: "",
      size: "840 KB",
    },
  ];
}

const resources = ref<Resource[]>(createResources());
/** 资源列表是否已就绪：未就绪时不传 mention-pool（避免把「详情还没到」的引用当成失效引用删掉） */
const poolReady = ref(true);
const pool = computed(() => (poolReady.value ? resources.value : undefined));

/** 服务端保存的文本值：@ + src */
const savedValue = "@/uploads/beach.png 帮我把这张图做成 4K 壁纸，风格参考 @/uploads/demo.mp4";

const value = ref(savedValue);
const editorRef = ref<InstanceType<typeof MentionEditor> | null>(null);
const mentionAttrs = ref<Record<string, unknown>[]>([]);
const uploadSeed = ref(0);

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
  preview: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-preview"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-preview": attrs.preview }),
  },
};

/** 资源 chip：缩略图 + 文件名 */
const renderMentionHtml: MentionRenderHTML = ({ node }) => {
  const attrs = node.attrs as Record<string, string>;
  const label = attrs.label ?? attrs.id;
  const leading =
    attrs.kind === "image" && attrs.thumb
      ? ["img", { class: "vme-mention__thumb", src: attrs.thumb, alt: label }]
      : [
          "span",
          { class: "vme-mention__icon" },
          attrs.kind === "video" ? "🎬" : attrs.kind === "audio" ? "🎧" : "📄",
        ];

  return [
    "span",
    {
      class: "vme-mention vme-mention--pill vme-mention--resource",
      "data-type": "mention",
      "data-id": attrs.id,
      "data-label": label,
      "data-kind": attrs.kind,
      "data-thumb": attrs.thumb,
      "data-preview": attrs.preview,
      "data-size": attrs.size,
    },
    leading,
    ["span", { class: "vme-mention__label" }, label],
  ] as unknown as ReturnType<MentionRenderHTML>;
};

const triggers: MentionTrigger[] = [
  { char: "@", label: "选择已上传资源", items: () => resources.value, emptyText: "没有匹配的资源" },
];

/** 文本值模式：token（src）→ 资源详情，用于恢复文件名与缩略图 */
const textValue = {
  resolve: (token: string) => resources.value.find((item) => item.id === token),
};

/** 同步「提及节点」面板，并让组件按 resolve 补齐 chip 的展示信息 */
function refreshMentions() {
  editorRef.value?.refreshMentions();
  mentionAttrs.value = editorRef.value?.getMentions() ?? [];
}

/** 模拟删除已上传的文件：资源池变化后，内容里引用它的 @ 会被自动清理 */
function removeResource(id: string) {
  resources.value = resources.value.filter((item) => item.id !== id);
  refreshMentions();
}

/** 模拟上传新文件并插入提及 */
function uploadAndInsert() {
  uploadSeed.value += 1;
  const index = uploadSeed.value;
  const item: Resource = {
    id: `/uploads/new-${index}.png`,
    label: `新上传-${index}.png`,
    kind: "image",
    thumb: `https://picsum.photos/seed/upload-${index}/48`,
    preview: `https://picsum.photos/seed/upload-${index}/600/400`,
    size: "0.6 MB",
  };
  resources.value = [...resources.value, item];
  editorRef.value?.insertMention(item);
  refreshMentions();
}

/** 重置演示：恢复资源池与内容 */
function resetDemo() {
  resources.value = createResources();
  value.value = savedValue;
  refreshMentions();
}

/** ① 模拟「绑定值先到、资源列表后到」：此刻只有 src，chip 只能显示文件名占位 */
function restoreBeforeData() {
  poolReady.value = false; // 详情未就绪，先不把资源池交给组件
  resources.value = [];
  value.value = "@/uploads/beach.png 帮我做成海报，风格参考刚才那张";
  refreshMentions();
}

/** ② 模拟资源列表接口返回：mention-pool 变化后组件会自动补齐展示信息 */
function loadResources() {
  resources.value = createResources();
  poolReady.value = true;
  void nextTick(() => {
    mentionAttrs.value = editorRef.value?.getMentions() ?? [];
  });
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <span class="muted">已上传资源：</span>
      <button
        v-for="item in resources"
        :key="item.id"
        class="btn"
        type="button"
        @click="removeResource(item.id)"
      >
        删除 {{ item.label }}
      </button>
      <button class="btn btn--primary" type="button" @click="uploadAndInsert">
        上传并 @ 新资源
      </button>
      <button class="btn" type="button" @click="resetDemo">重置演示</button>
      <button class="btn" type="button" @click="restoreBeforeData">
        ① 先恢复绑定值（资源未加载）
      </button>
      <button class="btn" type="button" @click="loadResources">
        ② 资源加载完成（自动补齐样式）
      </button>
      <button
        class="btn"
        type="button"
        @click="
          editorRef?.clear();
          refreshMentions();
        "
      >
        清空
      </button>
    </div>

    <MentionEditor
      ref="editorRef"
      v-model="value"
      :triggers="triggers"
      :text-value="textValue"
      :mention-pool="pool"
      :extra-attributes="extraAttributes"
      :mention-render-html="renderMentionHtml"
      :min-rows="3"
      :max-rows="10"
      placeholder="输入 @ 选择已上传的图片 / 视频 / 音频"
      @mention:select="refreshMentions"
    >
      <!-- 悬浮提示：组件负责命中与定位，这里只需决定「显示什么」 -->
      <template #mention-tip="{ attrs, label }">
        <div class="media-tip">
          <img
            v-if="attrs.kind === 'image'"
            class="media-tip__image"
            :src="String(attrs.preview || attrs.id)"
            :alt="label"
          />

          <video
            v-else-if="attrs.kind === 'video'"
            class="media-tip__video"
            :src="String(attrs.preview || attrs.id)"
            :poster="String(attrs.thumb || '')"
            controls
            playsinline
            preload="metadata"
          />

          <div v-else-if="attrs.kind === 'audio'" class="media-tip__audio-box">
            <audio
              class="media-tip__audio"
              :src="String(attrs.preview || attrs.id)"
              controls
              preload="metadata"
            />
          </div>

          <div v-else class="media-tip__file">📄 {{ label }}</div>

          <div class="media-tip__meta">
            <span class="media-tip__name">{{ label }}</span>
            <span v-if="attrs.size" class="media-tip__size">{{ attrs.size }}</span>
          </div>
        </div>
      </template>
    </MentionEditor>

    <div class="output">
      <div class="output__title">v-model（纯文本，格式为 @ + src）</div>
      <pre>{{ value || "（空）" }}</pre>
    </div>

    <div class="output">
      <div class="output__title">内容中的提及节点（getMentions()）</div>
      <pre>{{ JSON.stringify(mentionAttrs, null, 2) }}</pre>
    </div>

    <p class="muted">
      恢复：v-model 默认就是文本值，传入 `@ + src` 就能还原成带缩略图的 chip —— 前提是
      `textValue.resolve` 能找到对应资源，并且用 `extra-attributes` 声明了要落库的字段。 点「①
      先恢复绑定值」时资源列表还是空的（chip 先显示 src）， 点「② 资源加载完成」后 `mention-pool`
      变化会触发自动补齐：文件名 / 缩略图 / 类型一步到位， 不需要重建内容，也不会改动绑定值。
    </p>

    <p class="muted">
      清理：删除某个已上传资源后，`mention-pool` 的变化会自动把内容里所有引用该资源的提及一并删除
      （`pruneMentions` 默认开启）；资源列表未就绪时先别传 `mention-pool`，
      否则组件会把「详情还没加载到」的引用当成失效引用删掉；也可以手动
      `editorRef.value?.refreshMentions()` 补齐展示信息。
    </p>

    <p class="muted">
      悬浮提示：只需提供 `#mention-tip` 插槽，命中检测、延迟、定位与「移入浮层不关闭」都由组件处理；
      图片按 200px 等比展示，视频与音频固定 200px × 16:9 且可直接播放。
    </p>
  </div>
</template>

<style scoped>
/* 布局与垂直对齐交给库里的 vme-mention--pill，示例只写配色与字号 */
:deep(.vme-content .vme-mention--resource) {
  margin: 0 2px;
  border: 1px solid var(--demo-brand-border);
  background: var(--demo-brand-soft);
  color: var(--demo-brand-text);
  font-size: 12.5px;
}

/* ===== 悬浮提示内容（完全由使用方决定）===== */
.media-tip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: var(--vme-tip-media-width, 200px);
}

/* 图片：固定 200px 宽，高度等比 */
.media-tip__image {
  display: block;
  width: var(--vme-tip-media-width, 200px);
  height: auto;
  border-radius: 6px;
  object-fit: cover;
}

/* 视频：200px × 16:9，可直接播放 */
.media-tip__video {
  display: block;
  width: var(--vme-tip-media-width, 200px);
  aspect-ratio: var(--vme-tip-media-ratio, 16 / 9);
  border-radius: 6px;
  background: #000;
}

/* 音频：同样是 200px × 16:9 的容器，播放器居中 */
.media-tip__audio-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--vme-tip-media-width, 200px);
  aspect-ratio: var(--vme-tip-media-ratio, 16 / 9);
  border-radius: 6px;
  background: #0f172a;
}

.media-tip__audio {
  width: 100%;
}

.media-tip__file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--vme-tip-media-width, 200px);
  aspect-ratio: var(--vme-tip-media-ratio, 16 / 9);
  border-radius: 6px;
  background: var(--demo-surface-muted);
  font-size: 13px;
}

.media-tip__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: var(--demo-text-muted);
  font-size: 12px;
}

.media-tip__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-tip__size {
  flex-shrink: 0;
}

:deep(.vme-content .vme-mention__thumb) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}

:deep(.vme-content .vme-mention__icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  font-size: 11px;
  line-height: 1;
}

/* 只截断文件名，图标不会被省略 */
:deep(.vme-content .vme-mention__label) {
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
