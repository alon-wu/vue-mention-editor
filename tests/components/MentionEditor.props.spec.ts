import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionItem, MentionTrigger } from "../../src/types";

const members: MentionItem[] = [
  { id: "u1", label: "张三" },
  { id: "u2", label: "李四" },
];

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface EditorExposed {
  editor?: {
    commands: Record<string, (...args: unknown[]) => unknown>;
    schema: { nodes: Record<string, unknown> };
    options: { autofocus: false | "start" | "end" | number | null };
    getText: () => string;
  };
  getMentions: () => Record<string, unknown>[];
  insertMention: (item: MentionItem, char?: string) => void;
}

async function mountEditor(
  props: Record<string, unknown> = {},
  options: { attach?: boolean } = {},
) {
  const wrapper = mount(MentionEditor, {
    props: { triggers, ...props },
    ...(options.attach ? { attachTo: document.body } : {}),
  });
  await nextTick();
  await flush();

  return { wrapper, vm: wrapper.vm as unknown as EditorExposed };
}

afterEach(() => {
  document.body.innerHTML = "";
});

const popup = () => document.querySelector(".vme-popup") as HTMLElement | null;

describe("MentionEditor · 属性细节（补齐零覆盖能力）", () => {
  it("autofocus：透传给 tiptap（jsdom 无法在挂载前聚焦，真实聚焦行为由浏览器验证）", async () => {
    const { wrapper, vm } = await mountEditor({ autofocus: true }, { attach: true });
    await flush();

    expect(vm.editor?.options.autofocus).toBe("end");

    const plain = await mountEditor();
    expect(plain.vm.editor?.options.autofocus).toBe(false);

    wrapper.unmount();
    plain.wrapper.unmount();
  });

  it("mentionClass：追加自定义 class，同时保留库默认 class", async () => {
    const { wrapper, vm } = await mountEditor({ mentionClass: "my-mention" });

    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();
    await flush();

    expect(wrapper.find(".vme-content").html()).toContain('class="vme-mention my-mention"');
    wrapper.unmount();
  });

  it("mentionRenderText：接管 tiptap 实例的文本序列化", async () => {
    const { vm } = await mountEditor({
      modelValue: "hi @u1",
      mentionRenderText: ({ node }: { node: { attrs: Record<string, unknown> } }) =>
        `[${String(node.attrs.label)}]`,
    });

    expect(vm.editor?.getText()).toBe("hi [u1]");
  });

  it("baseExtensions=false：不注入内置基础扩展（由使用者自行提供）", async () => {
    const { vm } = await mountEditor({
      baseExtensions: false,
      extensions: [Document, Paragraph, Text],
    });

    expect(vm.editor?.schema.nodes.paragraph).toBeDefined();
    // HardBreak 是内置基础扩展里才有的（Shift + Enter 换行）
    expect(vm.editor?.schema.nodes.hardBreak).toBeUndefined();
  });

  it("baseExtensions 传数组：整体替换内置基础扩展", async () => {
    const { vm } = await mountEditor({ baseExtensions: [Document, Paragraph, Text] });

    expect(vm.editor?.schema.nodes.hardBreak).toBeUndefined();
  });

  it("triggers[].allowSpaces：查询串里可以带空格，面板不关闭", async () => {
    const { vm } = await mountEditor({
      triggers: [{ char: "@", items: members, allowSpaces: true }],
    });
    const editor = vm.editor!;

    editor.commands.insertContent("@张");
    await flush();
    expect(popup()?.querySelector(".vme-popup__query")?.textContent).toBe("@张");

    editor.commands.insertContent(" ");
    await flush();
    expect(popup()).not.toBeNull();
  });

  it("默认 allowSpaces=false：查询串出现空格后关闭面板", async () => {
    const { vm } = await mountEditor();
    const editor = vm.editor!;

    editor.commands.insertContent("@张");
    await flush();
    expect(popup()).not.toBeNull();

    editor.commands.insertContent(" ");
    await flush();
    expect(popup()).toBeNull();
  });
});
