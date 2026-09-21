import { mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import MentionEditor from "../../src/components/MentionEditor.vue";
import type { MentionAttributes, MentionTrigger } from "../../src/types";

const triggers: MentionTrigger[] = [
  { char: "@", label: "提及资源", items: [{ id: "/a.png", label: "海边.png" }] },
];

const extraAttributes: MentionAttributes = {
  kind: {
    default: "file",
    parseHTML: (element: HTMLElement) => element.getAttribute("data-kind"),
    renderHTML: (attrs: Record<string, unknown>) => ({ "data-kind": attrs.kind }),
  },
};

const content =
  '<p><span class="vme-mention" data-type="mention" data-id="/a.png" data-label="海边.png" data-kind="image">@海边.png</span></p>';

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function setup(options: { tip?: boolean; hover?: unknown; withSlot?: boolean } = {}) {
  const wrapper = mount(MentionEditor, {
    props: {
      triggers,
      modelValue: content,
      // 本套用例的 fixture 是 HTML（自定义 chip 结构），显式使用 html 值格式
      valueFormat: "html",
      extraAttributes,
      mentionHover: options.hover ?? { delay: 0, hideDelay: 0 },
    },
    slots:
      options.withSlot === false
        ? {}
        : {
            "mention-tip": (slotProps: {
              trigger: string;
              label: string;
              attrs: Record<string, unknown>;
            }) =>
              h(
                "div",
                { class: "tip-content" },
                `${slotProps.trigger}${slotProps.label}|${slotProps.attrs.kind}`,
              ),
          },
  });
  await nextTick();
  await flush();

  const chip = wrapper.find(".vme-mention");
  const tip = () => document.querySelector(".vme-tip") as HTMLElement | null;

  return { wrapper, chip, tip };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("MentionEditor · 提及块悬浮提示", () => {
  it("悬浮到提及块上展示插槽内容，并把节点属性传给插槽", async () => {
    const { chip, tip } = await setup();

    expect(tip()).toBeNull();

    await chip.trigger("mouseover");
    await nextTick();
    await flush();

    expect(tip()).not.toBeNull();
    // 插槽拿到 id / label / trigger 与 extraAttributes 声明的字段
    expect(tip()?.textContent).toBe("@海边.png|image");
    expect(tip()?.getAttribute("role")).toBe("tooltip");
  });

  it("鼠标移开后隐藏", async () => {
    const { chip, tip } = await setup();

    await chip.trigger("mouseover");
    await nextTick();
    await flush();
    expect(tip()).not.toBeNull();

    await chip.trigger("mouseout", { relatedTarget: document.body });
    await nextTick();
    await flush();

    expect(tip()).toBeNull();
  });

  it("移入浮层本身时不隐藏（便于在浮层内播放视频/音频）", async () => {
    const { chip, tip } = await setup();

    await chip.trigger("mouseover");
    await nextTick();
    await flush();

    await chip.trigger("mouseout", { relatedTarget: tip() });
    await nextTick();
    await flush();
    expect(tip()).not.toBeNull();

    // 鼠标在浮层内移动同样保持显示
    await tip()?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await nextTick();
    await flush();
    expect(tip()).not.toBeNull();
  });

  it("未提供 #mention-tip 插槽时不创建浮层（零开销）", async () => {
    const { chip, tip } = await setup({ withSlot: false });

    await chip.trigger("mouseover");
    await nextTick();
    await flush();

    expect(tip()).toBeNull();
  });

  it("mentionHover=false 时即使有插槽也不展示", async () => {
    const { chip, tip } = await setup({ hover: false });

    await chip.trigger("mouseover");
    await nextTick();
    await flush();

    expect(tip()).toBeNull();
  });

  it("支持自定义浮层容器", async () => {
    const host = document.createElement("div");
    host.id = "tip-host";
    document.body.appendChild(host);

    const { chip, tip } = await setup({
      hover: { delay: 0, hideDelay: 0, container: "#tip-host" },
    });

    await chip.trigger("mouseover");
    await nextTick();
    await flush();

    expect(host.contains(tip())).toBe(true);
  });
});
