import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { h } from "vue";
import MentionList from "../../src/components/MentionList.vue";
import type { MentionItem, MentionListProps } from "../../src/types";

const items: MentionItem[] = [
  { id: "u1", label: "张三", description: "zhangsan@example.com", avatar: "/avatar.png" },
  { id: "u2", label: "李四" },
  { id: "u3", label: "王五" },
];

interface MentionListExposed {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  selectItem: (index: number) => void;
  selectedIndex: number;
}

function mountList(props: Partial<MentionListProps> = {}) {
  const command = vi.fn();
  const wrapper = mount(MentionList, {
    props: { items, query: "z", trigger: "@", command, ...props },
  });

  return { wrapper, command, vm: wrapper.vm as unknown as MentionListExposed };
}

function keydown(key: string) {
  return { event: new KeyboardEvent("keydown", { key }) };
}

describe("MentionList", () => {
  it("渲染候选项的标签、描述与头像", () => {
    const { wrapper } = mountList();
    const first = wrapper.findAll(".vme-popup__item")[0];

    expect(wrapper.findAll(".vme-popup__item")).toHaveLength(3);
    expect(first.find(".vme-popup__label").text()).toBe("张三");
    expect(first.find(".vme-popup__desc").text()).toBe("zhangsan@example.com");
    expect(first.find(".vme-popup__avatar").attributes("src")).toBe("/avatar.png");
  });

  it("默认高亮第一项，并把触发符与查询串展示在头部", () => {
    const { wrapper } = mountList({ title: "提及成员", query: "zh" });

    expect(wrapper.findAll(".vme-popup__item")[0].classes()).toContain("is-selected");
    expect(wrapper.find(".vme-popup__title").text()).toBe("提及成员");
    expect(wrapper.find(".vme-popup__query").text()).toBe("@zh");
  });

  it("↑ / ↓ 循环切换高亮", () => {
    const { wrapper, vm } = mountList();

    expect(vm.onKeyDown(keydown("ArrowDown"))).toBe(true);
    expect(wrapper.vm.selectedIndex).toBe(1);

    vm.onKeyDown(keydown("ArrowUp"));
    expect(wrapper.vm.selectedIndex).toBe(0);

    vm.onKeyDown(keydown("ArrowUp"));
    expect(wrapper.vm.selectedIndex).toBe(2);

    vm.onKeyDown(keydown("ArrowDown"));
    expect(wrapper.vm.selectedIndex).toBe(0);
  });

  it("Enter / Tab 选中当前高亮项", () => {
    const { command, vm } = mountList();

    vm.onKeyDown(keydown("ArrowDown"));
    expect(vm.onKeyDown(keydown("Enter"))).toBe(true);
    expect(command).toHaveBeenCalledWith(items[1]);

    vm.onKeyDown(keydown("ArrowUp"));
    expect(vm.onKeyDown(keydown("Tab"))).toBe(true);
    expect(command).toHaveBeenLastCalledWith(items[0]);
  });

  it("未处理的按键返回 false，交给编辑器处理", () => {
    const { command, vm } = mountList();

    expect(vm.onKeyDown(keydown("a"))).toBe(false);
    expect(command).not.toHaveBeenCalled();
  });

  it("空列表时敲 Enter 不会触发选中", () => {
    const { command, vm } = mountList({ items: [] });

    expect(vm.onKeyDown(keydown("Enter"))).toBe(true);
    expect(command).not.toHaveBeenCalled();
  });

  it("鼠标移入切换高亮，mousedown 触发选中", async () => {
    const { wrapper, command } = mountList();
    const third = wrapper.findAll(".vme-popup__item")[2];

    await third.trigger("mouseenter");
    expect(third.classes()).toContain("is-selected");

    await third.trigger("mousedown");
    expect(command).toHaveBeenCalledWith(items[2]);
  });

  it("候选列表变化时把高亮重置到第一项", async () => {
    const { wrapper } = mountList();

    wrapper.vm.selectedIndex = 2;
    await wrapper.setProps({ items: [items[1]] });

    expect(wrapper.vm.selectedIndex).toBe(0);
    expect(wrapper.findAll(".vme-popup__item")).toHaveLength(1);
  });

  it("加载态展示提示文案", () => {
    const { wrapper } = mountList({ loading: true });

    expect(wrapper.find(".vme-popup__hint").text()).toBe("加载中…");
    expect(wrapper.findAll(".vme-popup__item")).toHaveLength(0);
  });

  it("空状态使用 emptyText，并可用 renderEmpty 自定义", () => {
    const { wrapper } = mountList({ items: [], emptyText: "没有匹配的资源" });
    expect(wrapper.find(".vme-popup__hint").text()).toBe("没有匹配的资源");

    const { wrapper: custom } = mountList({
      items: [],
      renderEmpty: () => h("div", { class: "my-empty" }, "换个关键词试试"),
    });
    expect(custom.find(".my-empty").text()).toBe("换个关键词试试");
  });

  it("renderItem 接管候选项渲染", () => {
    const { wrapper } = mountList({
      renderItem: ({ item, selected }) =>
        h("div", { class: "my-item" }, `${item.label}${selected ? " ✓" : ""}`),
    });

    const first = wrapper.findAll(".my-item")[0];
    expect(first.text()).toBe("张三 ✓");
    expect(wrapper.find(".vme-popup__label").exists()).toBe(false);
  });

  it("popupClass 会加到面板根元素上", () => {
    const { wrapper } = mountList({ popupClass: "my-popup--member" });
    expect(wrapper.find(".vme-popup").classes()).toContain("my-popup--member");
  });
});
