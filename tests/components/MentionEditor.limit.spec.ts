import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionItem, MentionTrigger } from "../../src/types";

const skills: MentionItem[] = [
  { id: "s1", label: "总结" },
  { id: "s2", label: "翻译" },
  { id: "s3", label: "润色" },
];

const members: MentionItem[] = [{ id: "u1", label: "张三" }];

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface EditorExposed {
  editor?: {
    commands: Record<string, (...args: unknown[]) => unknown>;
    state: { doc: { content: { size: number } } };
    view: { dom: HTMLElement };
  };
  insertMention: (item: MentionItem, char?: string) => void;
  getMentions: () => Record<string, unknown>[];
  getText: () => string;
}

async function setup(triggers: MentionTrigger[], content = "") {
  const wrapper = mount(MentionEditor, { props: { triggers, modelValue: content } });
  await nextTick();
  await flush();

  const vm = wrapper.vm as unknown as EditorExposed;
  const type = async (text: string) => {
    vm.editor?.commands.setTextSelection(vm.editor.state.doc.content.size - 1);
    vm.editor?.commands.insertContent(text);
    await nextTick();
    await flush();
  };
  const pressKey = async (key: string) => {
    vm.editor?.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
    await nextTick();
    await flush();
  };

  return { wrapper, vm, type, pressKey };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("MentionEditor · 引用数量上限（limit）", () => {
  it("limit=1：再次引用会替换已有引用（程序化插入）", async () => {
    const { vm } = await setup([{ char: "/", items: skills, limit: 1 }]);

    vm.insertMention(skills[0], "/");
    await nextTick();
    vm.insertMention(skills[1], "/");
    await nextTick();
    await flush();

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getMentions()[0]).toMatchObject({ id: "s2", label: "翻译" });
    expect(vm.getText()).toBe("/翻译 ");
  });

  it("limit=1：通过候选面板选择时同样替换（真实交互链路）", async () => {
    const { vm, type, pressKey } = await setup([{ char: "/", items: skills, limit: 1 }]);

    await type("/总");
    await pressKey("Enter");
    expect(vm.getMentions()[0]).toMatchObject({ id: "s1" });

    await type("/翻");
    await pressKey("Enter");

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getMentions()[0]).toMatchObject({ id: "s2" });
    expect(vm.getText()).toBe("/翻译 ");
  });

  it("onLimit=ignore：达到上限后忽略新的引用", async () => {
    const { vm } = await setup([{ char: "/", items: skills, limit: 1, onLimit: "ignore" }]);

    vm.insertMention(skills[0], "/");
    await nextTick();
    vm.insertMention(skills[1], "/");
    await nextTick();
    await flush();

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getMentions()[0]).toMatchObject({ id: "s1" });
  });

  it("limit=2：保留最近引用的两个", async () => {
    const { vm } = await setup([{ char: "/", items: skills, limit: 2 }]);

    vm.insertMention(skills[0], "/");
    await nextTick();
    vm.insertMention(skills[1], "/");
    await nextTick();
    vm.insertMention(skills[2], "/");
    await nextTick();
    await flush();

    expect(vm.getMentions().map((attrs) => attrs.id)).toEqual(["s2", "s3"]);
  });

  it("不同触发符的上限互不影响", async () => {
    const { vm } = await setup([
      { char: "/", items: skills, limit: 1 },
      { char: "@", items: members },
    ]);

    vm.insertMention(skills[0], "/");
    await nextTick();
    vm.insertMention(members[0], "@");
    await nextTick();
    vm.insertMention(skills[1], "/");
    await nextTick();
    await flush();

    const mentions = vm.getMentions();
    expect(mentions.filter((attrs) => attrs.mentionSuggestionChar === "/")).toHaveLength(1);
    expect(mentions.filter((attrs) => attrs.mentionSuggestionChar === "@")).toHaveLength(1);
    expect(mentions.find((attrs) => attrs.mentionSuggestionChar === "/")).toMatchObject({
      id: "s2",
    });
  });

  it("未配置 limit 时不限制数量", async () => {
    const { vm } = await setup([{ char: "/", items: skills }]);

    vm.insertMention(skills[0], "/");
    await nextTick();
    vm.insertMention(skills[1], "/");
    await nextTick();
    await flush();

    expect(vm.getMentions()).toHaveLength(2);
  });
});
