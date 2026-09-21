import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionItem, MentionTrigger } from "../../src/types";

const members: MentionItem[] = [
  { id: "u1", label: "张三", description: "zhangsan@example.com" },
  { id: "u2", label: "李四", description: "lisi@example.com" },
  { id: "u3", label: "王五" },
];

const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface EditorExposed {
  editor?: {
    commands: Record<string, (...args: unknown[]) => unknown>;
    state: { doc: { content: { size: number } } };
    view: { dom: HTMLElement };
    getText: () => string;
  };
}

async function setup(props: Record<string, unknown> = {}) {
  const wrapper = mount(MentionEditor, { props: { triggers, ...props } });
  await nextTick();
  await flush();

  const vm = wrapper.vm as unknown as EditorExposed;
  const editor = vm.editor!;

  const pressKey = async (key: string) => {
    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
    await nextTick();
    await flush();
  };

  /** 在文档末尾输入内容，触发 suggestion 插件 */
  const type = async (text: string) => {
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent(text);
    await nextTick();
    await flush();
  };

  return {
    wrapper,
    editor,
    type,
    pressKey,
    popup: () => document.querySelector(".vme-popup") as HTMLElement | null,
    popupItems: () => Array.from(document.querySelectorAll(".vme-popup__item")) as HTMLElement[],
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("MentionEditor · 候选面板交互", () => {
  it("输入触发符后弹出候选面板，并按查询串过滤", async () => {
    const { type, popup, popupItems } = await setup();

    expect(popup()).toBeNull();

    await type("@");
    expect(popup()).not.toBeNull();
    expect(popupItems()).toHaveLength(3);

    await type("李");
    expect(popupItems()).toHaveLength(1);
    expect(popupItems()[0].textContent).toContain("李四");
  });

  it("↓ / ↑ 切换高亮，Enter 插入提及并关闭面板", async () => {
    const { editor, type, pressKey, popup, popupItems } = await setup();

    await type("@");
    await pressKey("ArrowDown");

    expect(popupItems()[1].classList.contains("is-selected")).toBe(true);

    await pressKey("Enter");

    expect(editor.getText()).toBe("@李四 ");
    expect(popup()).toBeNull();
  });

  it("鼠标点击候选项同样可以插入", async () => {
    const { editor, type, popupItems } = await setup();

    await type("@王");
    popupItems()[0].dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    await flush();

    expect(editor.getText()).toBe("@王五 ");
  });

  it("Escape 关闭面板且不插入内容", async () => {
    const { editor, type, pressKey, popup } = await setup();

    await type("@zh");
    expect(popup()).not.toBeNull();

    await pressKey("Escape");

    expect(popup()).toBeNull();
    expect(editor.getText()).toBe("@zh");
  });

  it("选中候选项后派发 mention:select 事件", async () => {
    const { wrapper, type, pressKey } = await setup();

    await type("@");
    await pressKey("Enter");

    const payload = wrapper.emitted("mention:select")?.[0]?.[0] as {
      item: MentionItem;
      trigger: string;
    };
    expect(payload.trigger).toBe("@");
    expect(payload.item).toMatchObject({ id: "u1", label: "张三" });
  });

  it("异步数据源：面板先显示加载态，再渲染结果", async () => {
    const source = vi.fn(
      () => new Promise<MentionItem[]>((resolve) => setTimeout(() => resolve(members), 10)),
    );
    const { type, popupItems } = await setup({
      triggers: [{ char: "@", items: source }],
    });

    await type("@");

    expect(document.querySelector(".vme-popup__hint")?.textContent).toBe("加载中…");

    await new Promise((resolve) => setTimeout(resolve, 20));
    await nextTick();

    expect(popupItems()).toHaveLength(3);
  });

  it("未匹配到候选项时展示空状态文案", async () => {
    const { type, popupItems } = await setup({ emptyText: "没有匹配的资源" });

    await type("@zzz");

    expect(popupItems()).toHaveLength(0);
    expect(document.querySelector(".vme-popup__hint")?.textContent).toBe("没有匹配的资源");
  });

  it("替换内容后触发符之外不弹面板（默认要求行首或空格之后）", async () => {
    const { editor, type, popup } = await setup();

    await type("abc");
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent("@");
    await nextTick();
    await flush();

    expect(popup()).toBeNull();
  });
});
