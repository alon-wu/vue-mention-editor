import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionTrigger } from "../../src/types";

const triggers: MentionTrigger[] = [{ char: "@", items: [{ id: "u1", label: "张三" }] }];

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface EditorExposed {
  editor?: {
    commands: Record<string, (...args: unknown[]) => unknown>;
    state: { doc: { content: { size: number } } };
    view: { dom: HTMLElement };
  };
  getMentions: () => Record<string, unknown>[];
  getText: () => string;
}

async function setup(modelValue: string) {
  const wrapper = mount(MentionEditor, { props: { triggers, modelValue } });
  await nextTick();
  await flush();

  const vm = wrapper.vm as unknown as EditorExposed;
  const lastPos = () => (vm.editor?.state.doc.content.size ?? 1) - 1;
  const place = async (pos: number) => {
    vm.editor?.commands.setTextSelection(pos);
    await nextTick();
  };
  const press = async (key: string) => {
    vm.editor?.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
    await nextTick();
    await flush();
  };

  return { wrapper, vm, lastPos, place, press };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("MentionEditor · 提及节点的删除手感", () => {
  it("光标紧贴提及之后：Backspace 一次就删除（不会先进入选中态）", async () => {
    const { vm, place, press } = await setup("@u1 你好");

    expect(vm.getMentions()).toHaveLength(1);

    await place(2); // 提及占 [1, 2)，2 就是「紧随其后」的光标位置
    await press("Backspace");

    expect(vm.getMentions()).toHaveLength(0);
    // 顺带吞掉原本夹在中间的空格，不会留下双空格
    expect(vm.getText()).toBe("你好");
  });

  it("光标紧贴提及之前：Delete 一次就删除", async () => {
    const { vm, place, press } = await setup("你好 @u1");

    await place(4); // 「你好 」之后，正好在提及前
    await press("Delete");

    expect(vm.getMentions()).toHaveLength(0);
    expect(vm.getText()).toBe("你好");
  });

  it("相邻提及：一次只删一个，不会互相吞掉", async () => {
    const { vm, place, press } = await setup("@u1 @u1");

    expect(vm.getMentions()).toHaveLength(2);

    await place(2);
    await press("Backspace");

    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getText()).toBe("@u1");
  });

  it("不在提及旁边时：Backspace 交还给默认行为，提及不受影响", async () => {
    const { vm, lastPos, place } = await setup("@u1 你好");

    await place(lastPos());
    const event = new KeyboardEvent("keydown", {
      key: "Backspace",
      bubbles: true,
      cancelable: true,
    });
    vm.editor?.view.dom.dispatchEvent(event);
    await flush();

    // 普通位置上的退格由浏览器原生处理（jsdom 不会真的删字符），这里只确认提及没被误伤、
    // 事件也没有被我们的 keymap 拦截
    expect(vm.getMentions()).toHaveLength(1);
    expect(vm.getText()).toBe("@u1 你好");
    expect(event.defaultPrevented).toBe(false);
  });
});
