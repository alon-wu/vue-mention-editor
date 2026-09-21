import { mount } from "@vue/test-utils";
import type { ComponentMountingOptions } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type {
  MentionChangePayload,
  MentionEditorProps,
  MentionItem,
  MentionTrigger,
} from "../../src/types";

const members: MentionItem[] = [
  { id: "u1", label: "张三", description: "zhangsan@example.com" },
  { id: "u2", label: "李四" },
];

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];

interface EditorExposed {
  editor?: {
    commands: Record<string, (...args: unknown[]) => unknown>;
    state: { doc: { content: { size: number } } };
    view: { dom: HTMLElement };
    isEmpty: boolean;
    getHTML: () => string;
    getJSON: () => unknown;
  };
  getMentions: () => Record<string, unknown>[];
  removeMentions: (match: string[] | ((attrs: Record<string, unknown>) => boolean)) => number;
  insertMention: (item: MentionItem, char?: string) => void;
  setContent: (value: string) => void;
  getText: (options?: { token?: "id" | "label" }) => string;
  getMarkdown: (options?: { token?: "id" | "label" }) => string;
}

async function mountEditor(
  props: Partial<MentionEditorProps> = {},
  slots?: ComponentMountingOptions<typeof MentionEditor>["slots"],
) {
  const wrapper = mount(MentionEditor, {
    props: { triggers, ...props },
    slots,
  });
  await nextTick();
  // tiptap 3 的 create 事件在 setTimeout(0) 后触发，等一拍再断言
  await flush();

  const vm = wrapper.vm as unknown as EditorExposed;
  expect(vm.editor).toBeTruthy();

  /** 把光标放到文档末尾，模拟用户在这里输入 */
  const focusEnd = () => vm.editor?.commands.setTextSelection(vm.editor.state.doc.content.size - 1);
  const type = async (text: string) => {
    focusEnd();
    vm.editor?.commands.insertContent(text);
    await nextTick();
  };
  const pressKey = async (key: string, init: KeyboardEventInit = {}) => {
    vm.editor?.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
    await nextTick();
  };
  const lastEmitted = <T>(event: string): T => {
    const emitted = wrapper.emitted(event) as unknown as [T][] | undefined;
    return emitted?.[emitted.length - 1]?.[0] as T;
  };
  /** 不带 trim 的文本（用于断言尾部空格） */
  const rawText = () => wrapper.find(".vme-content").element.textContent ?? "";

  return { wrapper, vm, type, pressKey, lastEmitted, rawText };
}

afterEach(() => {
  document.body.innerHTML = "";
});

/** 等待一个宏任务（tiptap 的 create 事件在 setTimeout(0) 中触发） */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("MentionEditor · 基础渲染", () => {
  it("挂载后创建编辑器并派发 ready 事件", async () => {
    const { wrapper, vm } = await mountEditor();

    expect(wrapper.find(".vme-root").exists()).toBe(true);
    expect(wrapper.find(".vme-content").attributes("contenteditable")).toBe("true");
    expect(wrapper.emitted("ready")).toHaveLength(1);
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBe(vm.editor);
  });

  it("默认基础扩展（Document/Paragraph/Text）之外的标记会被丢弃", async () => {
    const { wrapper } = await mountEditor({
      modelValue: "<p>你好 <strong>世界</strong></p>",
      valueFormat: "html",
    });

    expect(wrapper.find(".vme-content").text()).toBe("你好 世界");
    expect(wrapper.find(".vme-content").html()).not.toContain("<strong>");
  });

  it("rtl / 中文内容不影响挂载", async () => {
    const { wrapper } = await mountEditor({ modelValue: "你好 中文内容 🎉" });

    expect(wrapper.find(".vme-content").text()).toContain("中文内容 🎉");
  });
});

describe("MentionEditor · v-model（HTML 扩展格式）", () => {
  it("输入内容后同步 modelValue 并派发 change", async () => {
    const { wrapper, type, lastEmitted } = await mountEditor({ valueFormat: "html" });

    await type("hello");

    const payload = lastEmitted<MentionChangePayload>("change");
    expect(payload.value).toBe("<p>hello</p>");
    expect(payload.html).toBe("<p>hello</p>");
    expect(payload.text).toBe("hello");
    expect(payload.isEmpty).toBe(false);
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("<p>hello</p>");
  });

  it("外部更新 modelValue 会同步进编辑器（不产生回环 emit）", async () => {
    const { wrapper } = await mountEditor({ modelValue: "<p>a</p>", valueFormat: "html" });

    await wrapper.setProps({ modelValue: "<p>外部内容</p>" });
    await nextTick();

    expect(wrapper.find(".vme-content").text()).toBe("外部内容");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("外部传入相同内容时不重置（避免光标跳动）", async () => {
    const { wrapper, vm } = await mountEditor({ modelValue: "<p>same</p>", valueFormat: "html" });
    const before = vm.editor?.getJSON();

    await wrapper.setProps({ modelValue: "<p>same</p>" });
    await nextTick();

    expect(vm.editor?.getJSON()).toEqual(before);
  });
});

describe("MentionEditor · 文本值（默认格式）", () => {
  const textProps: Partial<MentionEditorProps> = {
    textValue: { resolve: (token) => ({ id: token, label: "海边清晨.png", kind: "image" }) },
  };

  it("默认就是文本格式：v-model 输出 `@ + id` 纯文本，而不是 HTML", async () => {
    const { wrapper, vm } = await mountEditor();

    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();
    await flush();

    const value = wrapper.emitted("update:modelValue")?.at(-1)?.[0] as string;
    expect(value).toBe("@u1 ");
    expect(value).not.toContain("<p>");
  });

  it("仍可随时取扩展输出：getHTML / getText / getMarkdown / getJSON", async () => {
    const { wrapper, vm } = await mountEditor();

    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();
    await flush();

    expect(vm.getText()).toBe("@张三 ");
    expect(vm.getMarkdown().trim()).toBe("@张三");
    expect(wrapper.find(".vme-content").html()).toContain('data-id="u1"');
  });

  it("根据绑定值恢复出提及块（label 由 resolve 提供）", async () => {
    const { wrapper, vm } = await mountEditor({
      ...textProps,
      modelValue: "@/uploads/beach.png 帮我做成壁纸",
    });

    const chip = wrapper.find(".vme-mention");
    expect(chip.exists()).toBe(true);
    // 提及块的默认文本是「触发符 + label」
    expect(chip.text()).toBe("@海边清晨.png");
    expect(vm.getMentions()).toEqual([
      expect.objectContaining({ id: "/uploads/beach.png", label: "海边清晨.png" }),
    ]);
  });

  it("编辑后 v-model 输出 @ + src 的纯文本", async () => {
    const { wrapper, type } = await mountEditor({
      ...textProps,
      modelValue: "@/uploads/beach.png",
    });

    await type(" 做成壁纸");

    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("@/uploads/beach.png 做成壁纸");
  });

  it("没有 resolve 时 label 退化为 token", async () => {
    const { wrapper } = await mountEditor({
      modelValue: "@/uploads/unknown.bin",
    });

    expect(wrapper.find(".vme-mention").text()).toBe("@/uploads/unknown.bin");
  });
});

describe("MentionEditor · 文本 token 开关（id / label）", () => {
  /** token 为 label：文本里写 @张三，回显时用 resolve 换回真实 id */
  const labelTextValue = {
    token: "label" as const,
    resolve: (token: string) => members.find((member) => member.label === token),
  };

  it("token='label'：回显时用 resolve 换回真实 id，chip 仍显示名称", async () => {
    const { wrapper, vm } = await mountEditor({
      modelValue: "@张三 请看下这个",
      textValue: labelTextValue,
    });

    expect(wrapper.find(".vme-mention").text()).toBe("@张三");
    expect(vm.getMentions()[0]).toMatchObject({ id: "u1", label: "张三" });
  });

  it("token='label'：插入提及后 v-model 输出可读形式 @张三", async () => {
    const { wrapper, vm } = await mountEditor({ textValue: labelTextValue });

    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();
    await flush();

    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("@张三 ");
  });

  it("getText / getMarkdown 可指定 token，与 v-model 的形态解耦", async () => {
    const { vm } = await mountEditor({ modelValue: "@张三 请看", textValue: labelTextValue });

    expect(vm.getText()).toBe("@张三 请看");
    expect(vm.getText({ token: "id" })).toBe("@u1 请看");
  });

  it("默认（token='id'）：v-model 用 id，getText({ token: 'label' }) 得到可读形式", async () => {
    const { wrapper, vm } = await mountEditor();

    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();
    await flush();

    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toBe("@u1 ");
    expect(vm.getText()).toBe("@张三 ");
    expect(vm.getMarkdown().trim()).toBe("@张三");
    expect(vm.getMarkdown({ token: "id" }).trim()).toBe("@u1");
  });
});

describe("MentionEditor · 占位内容", () => {
  it("字符串占位：空内容展示，有内容时隐藏", async () => {
    const { wrapper, type } = await mountEditor({ placeholder: "说点什么…" });

    expect(wrapper.find(".vme-placeholder").text()).toBe("说点什么…");

    await type("hi");
    expect(wrapper.find(".vme-placeholder").exists()).toBe(false);
  });

  it("VNode 占位（含行内块）", async () => {
    const { wrapper } = await mountEditor({
      placeholder: h("span", null, ["按 ", h("kbd", { class: "kbd" }, "@"), " 提及"]),
    });

    expect(wrapper.find(".vme-placeholder kbd").text()).toBe("@");
  });

  it("#placeholder 插槽优先于 placeholder 属性", async () => {
    const { wrapper } = await mountEditor(
      { placeholder: "属性文案" },
      {
        placeholder: () => h("span", { class: "slot-ph" }, "插槽文案"),
      },
    );

    expect(wrapper.find(".slot-ph").text()).toBe("插槽文案");
    expect(wrapper.find(".vme-placeholder").text()).not.toContain("属性文案");
  });

  it("禁用时隐藏占位内容", async () => {
    const { wrapper } = await mountEditor({ placeholder: "说点什么…", disabled: true });

    expect(wrapper.find(".vme-placeholder").exists()).toBe(false);
  });
});

describe("MentionEditor · 只读与禁用", () => {
  it("editable=false：只读样式 + 不可编辑", async () => {
    const { wrapper } = await mountEditor({ editable: false });

    expect(wrapper.find(".vme-root").classes()).toContain("is-readonly");
    expect(wrapper.find(".vme-content").attributes("contenteditable")).toBe("false");
  });

  it("disabled：置灰并阻止聚焦", async () => {
    const { wrapper, vm } = await mountEditor({ disabled: true });

    expect(wrapper.find(".vme-root").classes()).toContain("is-disabled");
    expect(wrapper.find(".vme-root").attributes("aria-disabled")).toBe("true");
    expect(wrapper.find(".vme-content").attributes("contenteditable")).toBe("false");
    expect(vm.editor).toBeTruthy();
  });

  it("动态切换 editable / disabled", async () => {
    const { wrapper } = await mountEditor();
    const content = () => wrapper.find(".vme-content");

    await wrapper.setProps({ editable: false });
    expect(content().attributes("contenteditable")).toBe("false");

    await wrapper.setProps({ disabled: true, editable: true });
    expect(content().attributes("contenteditable")).toBe("false");
    expect(wrapper.find(".vme-root").classes()).toContain("is-disabled");

    await wrapper.setProps({ disabled: false });
    expect(content().attributes("contenteditable")).toBe("true");
  });
});

describe("MentionEditor · 键盘行为", () => {
  it("submitOnEnter：Enter 触发 submit，Shift + Enter 不触发并换行", async () => {
    const { wrapper, type, pressKey } = await mountEditor({ submitOnEnter: true });

    await type("第一行");
    await pressKey("Enter", { shiftKey: true });

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.find(".vme-content").html()).toContain("<br>");

    await pressKey("Enter");
    expect(wrapper.emitted("submit")).toHaveLength(1);
  });

  it("未开启 submitOnEnter 时 Enter 只换行", async () => {
    const { wrapper, type, pressKey } = await mountEditor();

    await type("第一行");
    await pressKey("Enter");

    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("输入法组词状态下不触发 submit", async () => {
    const { wrapper, type, pressKey } = await mountEditor({ submitOnEnter: true });

    await type("拼");
    await pressKey("Enter", { isComposing: true });

    expect(wrapper.emitted("submit")).toBeUndefined();
  });
});

describe("MentionEditor · 实例方法", () => {
  /** HTML 扩展格式下的 chip 内容 */
  const chipHtmlProps = { valueFormat: "html" } as const;
  const chipHtml =
    '<p>你好 <span class="vme-mention" data-type="mention" data-id="/uploads/a.png" data-label="a.png">@a.png</span> 与 <span class="vme-mention" data-type="mention" data-id="/uploads/b.png" data-label="b.png">@b.png</span></p>';

  it("insertMention：插入节点并补空格，相邻时补前置空格", async () => {
    const { vm, type, rawText } = await mountEditor();

    await type("hi");
    vm.insertMention({ id: "u1", label: "张三" });
    await nextTick();

    expect(rawText()).toBe("hi @张三 ");

    vm.insertMention({ id: "u2", label: "李四" });
    await nextTick();
    expect(rawText()).toBe("hi @张三 @李四 ");
  });

  it("insertMention：可指定触发符", async () => {
    const { wrapper, vm } = await mountEditor({
      triggers: [triggers[0], { char: "#", label: "标签", items: [] }],
    });

    vm.insertMention({ id: "t1", label: "前端" }, "#");
    await nextTick();

    expect(wrapper.find(".vme-mention").attributes("data-mention-suggestion-char")).toBe("#");
  });

  it("getMentions / removeMentions：按 id 删除并吃掉多余空格", async () => {
    const { wrapper, vm } = await mountEditor({ modelValue: chipHtml, ...chipHtmlProps });

    expect(vm.getMentions()).toHaveLength(2);

    expect(vm.removeMentions(["/uploads/a.png"])).toBe(1);
    await nextTick();

    expect(vm.getMentions()).toHaveLength(1);
    expect(wrapper.find(".vme-content").text()).toBe("你好 与 @b.png");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

  it("removeMentions：支持谓词，一次删掉多处引用", async () => {
    const { vm } = await mountEditor({
      ...chipHtmlProps,
      modelValue:
        '<p><span data-type="mention" data-id="/a.png" data-label="a.png">@a.png</span> <span data-type="mention" data-id="/a.png" data-label="a.png">@a.png</span> <span data-type="mention" data-id="/b.png" data-label="b.png">@b.png</span></p>',
    });

    expect(vm.removeMentions((attrs) => attrs.id === "/a.png")).toBe(2);
    await nextTick();

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getMentions()[0]).toMatchObject({ id: "/b.png" });
  });

  it("removeMentions：没有匹配项时返回 0 且不改动内容", async () => {
    const { vm } = await mountEditor({ modelValue: chipHtml, ...chipHtmlProps });

    expect(vm.removeMentions(["/not-exist.png"])).toBe(0);
  });

  it("setContent / getText / clear", async () => {
    const { wrapper, vm } = await mountEditor(chipHtmlProps);

    vm.setContent("<p>新内容</p>");
    await nextTick();
    expect(wrapper.find(".vme-content").text()).toBe("新内容");

    expect(vm.getText()).toBe("新内容");

    vm.editor?.commands.clearContent(true);
    await nextTick();
    expect(wrapper.find(".vme-content").text()).toBe("");
  });
});

describe("MentionEditor · 资源池联动清理", () => {
  const chipHtml =
    '<p><span data-type="mention" data-id="/uploads/a.png" data-label="a.png">@a.png</span> 和 <span data-type="mention" data-id="/uploads/b.png" data-label="b.png">@b.png</span></p>';

  it("资源池中移除某项后，内容里引用它的提及自动消失", async () => {
    const { wrapper, vm } = await mountEditor({
      modelValue: chipHtml,
      valueFormat: "html",
      mentionPool: [
        { id: "/uploads/a.png", label: "a.png" },
        { id: "/uploads/b.png", label: "b.png" },
      ],
    });

    expect(vm.getMentions()).toHaveLength(2);

    await wrapper.setProps({ mentionPool: [{ id: "/uploads/b.png", label: "b.png" }] });
    await nextTick();

    expect(vm.getMentions()).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).not.toContain("/uploads/a.png");
  });

  it("pruneMentions=false 时不自动清理", async () => {
    const { wrapper, vm } = await mountEditor({
      modelValue: chipHtml,
      valueFormat: "html",
      pruneMentions: false,
      mentionPool: [{ id: "/uploads/a.png", label: "a.png" }],
    });

    await wrapper.setProps({ mentionPool: [] });
    await nextTick();

    expect(vm.getMentions()).toHaveLength(2);
  });

  it("外部恢复内容时也会清理池中不存在的引用", async () => {
    const { wrapper, vm } = await mountEditor({
      valueFormat: "html",
      mentionPool: [{ id: "/uploads/b.png", label: "b.png" }],
    });

    await wrapper.setProps({ modelValue: chipHtml });
    await nextTick();

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getMentions()[0]).toMatchObject({ id: "/uploads/b.png" });
  });
});

describe("MentionEditor · 高度（minRows / maxRows）", () => {
  const computedStyle = {
    fontSize: "14px",
    lineHeight: "24px",
    paddingTop: "10px",
    paddingBottom: "10px",
  } as CSSStyleDeclaration;

  it("按行数换算成像素高度（行高 24px + 上下内边距 20px）", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue(computedStyle);

    const { wrapper } = await mountEditor({ minRows: 2, maxRows: 5 });

    expect(wrapper.find(".vme-root").attributes("style")).toContain("--vme-min-height: 68px");
    expect(wrapper.find(".vme-root").attributes("style")).toContain("--vme-max-height: 140px");
  });

  it("显式 minHeight / maxHeight 优先于行数", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue(computedStyle);

    const { wrapper } = await mountEditor({
      minRows: 2,
      maxRows: 5,
      minHeight: 120,
      maxHeight: "40vh",
    });

    expect(wrapper.find(".vme-root").attributes("style")).toContain("--vme-min-height: 120px");
    expect(wrapper.find(".vme-root").attributes("style")).toContain("--vme-max-height: 40vh");
  });

  it("未配置时使用默认最小高度令牌", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue(computedStyle);

    const { wrapper } = await mountEditor();

    expect(wrapper.find(".vme-root").attributes("style")).toContain("--vme-min-height: 96px");
  });
});
