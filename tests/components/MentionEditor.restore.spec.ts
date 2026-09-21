import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionAttributes, MentionItem, MentionTrigger } from "../../src/types";

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface EditorExposed {
  getMentions: () => Record<string, unknown>[];
  getText: () => string;
  refreshMentions: () => number;
}

/** 声明 avatar 字段，验证 resolve 恢复的不只是 label，还包括 extraAttributes 里的字段 */
const extraAttributes: MentionAttributes = {
  avatar: {
    default: "",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-avatar"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-avatar": attrs.avatar }),
  },
};

const triggers: MentionTrigger[] = [{ char: "@", items: [] }];

afterEach(() => {
  document.body.innerHTML = "";
});

describe("MentionEditor · 按绑定值恢复（valueFormat=text）", () => {
  it("挂载时：数据存在则恢复标题与自定义字段", async () => {
    const resources = ref<MentionItem[]>([
      { id: "u1", label: "张三", avatar: "https://cdn/1.png" },
    ]);

    const wrapper = mount(MentionEditor, {
      props: {
        modelValue: "@u1 你好",
        valueFormat: "text",
        triggers,
        extraAttributes,
        textValue: {
          resolve: (token: string) => resources.value.find((item) => item.id === token),
        },
      },
    });
    await nextTick();
    await flush();

    const vm = wrapper.vm as unknown as EditorExposed;
    expect(vm.getMentions()[0]).toMatchObject({
      id: "u1",
      label: "张三",
      avatar: "https://cdn/1.png",
    });
    wrapper.unmount();
  });

  it("数据后到：refreshMentions() 补齐展示字段，且不改写 v-model 值", async () => {
    const resources = ref<MentionItem[]>([]);
    const wrapper = mount(MentionEditor, {
      props: {
        modelValue: "@/uploads/a.png 帮我处理",
        valueFormat: "text",
        triggers,
        extraAttributes,
        textValue: {
          resolve: (token: string) => resources.value.find((item) => item.id === token),
        },
      },
    });
    await nextTick();
    await flush();

    const vm = wrapper.vm as unknown as EditorExposed;
    // 资源还没到：只有 id 可用，chip 退化为显示 src
    expect(vm.getMentions()[0]).toMatchObject({ id: "/uploads/a.png", label: "/uploads/a.png" });

    resources.value = [{ id: "/uploads/a.png", label: "海边清晨.png", avatar: "/t.png" }];
    const updated = vm.refreshMentions();
    await flush();

    expect(updated).toBe(1);
    expect(vm.getMentions()[0]).toMatchObject({
      id: "/uploads/a.png",
      label: "海边清晨.png",
      avatar: "/t.png",
    });
    // 文本值仍然是 `@ + id`，不受展示字段影响
    const emitted = wrapper.emitted("update:modelValue") ?? [];
    expect(emitted.at(-1)?.[0]).toBe("@/uploads/a.png 帮我处理");
    expect(vm.getText()).toBe("@海边清晨.png 帮我处理");

    wrapper.unmount();
  });

  it("传了 mentionPool 时：资源池变化会自动补齐（无需手动调用）", async () => {
    const resource: MentionItem = { id: "/uploads/a.png", label: "海边清晨.png", avatar: "/t.png" };
    /** 资源列表：初始为空，稍后异步到位 */
    const pool = ref<MentionItem[]>([]);
    const wrapper = mount(MentionEditor, {
      props: {
        modelValue: "@/uploads/a.png 帮我处理",
        valueFormat: "text",
        triggers,
        extraAttributes,
        mentionPool: pool.value,
        textValue: {
          resolve: (token: string) => pool.value.find((item) => item.id === token),
        },
      },
    });
    await nextTick();
    await flush();

    const vm = wrapper.vm as unknown as EditorExposed;
    expect(vm.getMentions()[0]).toMatchObject({ label: "/uploads/a.png" });

    // 模拟资源列表异步到位：池变化 → 清理失效引用 + 补齐展示信息
    pool.value = [resource];
    await wrapper.setProps({ mentionPool: pool.value });
    await nextTick();
    await flush();

    expect(vm.getMentions()[0]).toMatchObject({
      id: "/uploads/a.png",
      label: "海边清晨.png",
      avatar: "/t.png",
    });
    wrapper.unmount();
  });

  it("没有 resolve 时不做事；字段已是最新时返回 0", async () => {
    const withoutResolve = mount(MentionEditor, {
      props: { modelValue: "@u1 你好", valueFormat: "text", triggers },
    });
    await nextTick();
    await flush();
    expect((withoutResolve.vm as unknown as EditorExposed).refreshMentions()).toBe(0);
    withoutResolve.unmount();

    const resource: MentionItem = { id: "u1", label: "张三" };
    const filled = mount(MentionEditor, {
      props: {
        modelValue: "@u1 你好",
        valueFormat: "text",
        triggers,
        textValue: { resolve: () => resource },
      },
    });
    await nextTick();
    await flush();
    const vm = filled.vm as unknown as EditorExposed;
    expect(vm.refreshMentions()).toBe(0); // 挂载时已解析过，无需再次更新
    filled.unmount();
  });
});
