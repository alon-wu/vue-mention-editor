import type { MentionItem, MentionTrigger } from "../src";

export const members: MentionItem[] = [
  {
    id: "u1",
    label: "张三",
    description: "zhangsan@example.com",
    avatar: "https://i.pravatar.cc/40?img=12",
  },
  {
    id: "u2",
    label: "李四",
    description: "lisi@example.com",
    avatar: "https://i.pravatar.cc/40?img=32",
  },
  {
    id: "u3",
    label: "王五",
    description: "wangwu@example.com",
    avatar: "https://i.pravatar.cc/40?img=45",
  },
  {
    id: "u4",
    label: "Zoe Chen",
    description: "zoe@example.com",
    avatar: "https://i.pravatar.cc/40?img=5",
  },
];

export const tags: MentionItem[] = [
  { id: "t1", label: "前端", description: "12 篇文档" },
  { id: "t2", label: "后端", description: "8 篇文档" },
  { id: "t3", label: "设计", description: "5 篇文档" },
];

/** 模拟接口：演示异步数据源 + 防抖 */
export async function searchMembers(query: string, signal: AbortSignal): Promise<MentionItem[]> {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 200);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
  const keyword = query.trim().toLowerCase();
  if (!keyword) return members;
  return members.filter(
    (item) =>
      item.label.toLowerCase().includes(keyword) ||
      (item.description ?? "").toLowerCase().includes(keyword),
  );
}

export const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员",
    debounce: 200,
    items: ({ query, signal }) => searchMembers(query, signal),
  },
  {
    char: "#",
    label: "插入标签",
    items: tags,
  },
];

/** 快捷指令（示例：多触发符中的 '/'） */
export const commands: MentionItem[] = [
  { id: "c1", label: "今日待办", description: "列出今天的任务" },
  { id: "c2", label: "周报模板", description: "插入周报骨架" },
  { id: "c3", label: "会议纪要", description: "插入会议纪要模板" },
];

/** 关键词命中判断：label / id / description 任一命中即可（与组件内置默认规则一致） */
export function matchKeyword(item: MentionItem, query: string): boolean {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;
  return [item.label, item.id, item.description].some(
    (value) => typeof value === "string" && value.toLowerCase().includes(keyword),
  );
}

/** 高亮命中片段，返回 [是否命中, 片段] 列表 */
export function splitByKeyword(text: string, query: string): { text: string; hit: boolean }[] {
  const keyword = query.trim();
  if (!keyword) return [{ text, hit: false }];
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const index = lowerText.indexOf(lowerKeyword, cursor);
    if (index === -1) {
      parts.push({ text: text.slice(cursor), hit: false });
      break;
    }
    if (index > cursor) parts.push({ text: text.slice(cursor, index), hit: false });
    parts.push({ text: text.slice(index, index + keyword.length), hit: true });
    cursor = index + keyword.length;
  }
  return parts;
}
