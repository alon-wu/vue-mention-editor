import type { App, Plugin } from "vue";
import "./styles/tokens.css";
import MentionEditor from "./components/MentionEditor.vue";
import MentionList from "./components/MentionList.vue";
import { createMentionExtension, resolveMentionItems } from "./extensions/mention";
import { createSuggestionRenderer } from "./core/suggestionRenderer";
import { serializeDocMarkdown } from "./core/markdown";
import {
  defaultRenderMentionText,
  idMentionText,
  mentionTextRenderer,
  parseTextToContent,
  serializeDocText,
} from "./core/value";
import type { CreateMentionExtensionOptions } from "./extensions/mention";
import type {
  CreateSuggestionRendererOptions,
  MentionRendererFactory,
} from "./core/suggestionRenderer";
import type { ParseTextContentOptions, SerializeDocTextOptions } from "./core/value";
import type { SerializeMarkdownOptions } from "./core/markdown";

export * from "./types";

export {
  MentionEditor,
  MentionList,
  createMentionExtension,
  createSuggestionRenderer,
  resolveMentionItems,
  /** 取值 / 序列化工具（需要自己拼数据时可以用） */
  serializeDocText,
  parseTextToContent,
  serializeDocMarkdown,
  idMentionText,
  defaultRenderMentionText,
  mentionTextRenderer,
};

export type {
  CreateMentionExtensionOptions,
  CreateSuggestionRendererOptions,
  MentionRendererFactory,
  ParseTextContentOptions,
  SerializeDocTextOptions,
  SerializeMarkdownOptions,
};

/** 作为 Vue 插件使用：app.use(VueMentionEditor) */
const VueMentionEditor: Plugin = {
  install(app: App) {
    app.component("MentionEditor", MentionEditor);
    app.component("MentionList", MentionList);
  },
};

export default VueMentionEditor;
