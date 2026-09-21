# 触发符与数据源

## 单个触发符

```ts
const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员", // 面板头部标题
    items: [
      { id: "u1", label: "张三" },
      { id: "u2", label: "李四" },
    ],
  },
];
```

## 多个触发符

`triggers` 是数组，每个元素是一套独立的「触发符 + 数据源 + 面板配置」：

```ts
const triggers: MentionTrigger[] = [
  { char: "@", label: "提及成员", items: members },
  { char: "#", label: "插入标签", items: tags },
  {
    char: "/",
    label: "快捷指令",
    items: commands,
    emptyText: "没有匹配的指令",
  },
];
```

示例：[dev/examples/MultiTriggerExample.vue](../../dev/examples/MultiTriggerExample.vue)

## 静态数据源与内置过滤

`items` 传数组时，组件会按关键词做本地过滤，规则是 `label` / `id` / `description` 任一命中（忽略大小写）：

```ts
{ char: "@", items: members }

// 响应式列表用同步函数返回，同样享受内置过滤（推荐）
{ char: "@", items: () => resources.value }

// 自定义过滤逻辑
{
  char: "@",
  items: members,
  filter: (item, query) => item.label.startsWith(query) || (item.pinyin ?? "").includes(query),
}
```

> 过滤规则：**数组与同步函数**做本地过滤；**异步函数**的结果则原样使用（视为服务端已过滤）。

## 异步数据源

传函数即可，函数可以返回 Promise。参数包含当前查询串、命中的触发符，以及一个 `AbortSignal`：

```ts
{
  char: "@",
  label: "提及成员",
  debounce: 300,        // 停止输入 300ms 后才发起请求
  minQueryLength: 1,    // 至少输入 1 个字符才查询（不足时 items 为空，配合 emptyText 提示）
  emptyText: "输入关键词开始搜索",
  async items({ query, signal }) {
    const res = await fetch(`/api/members?kw=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) throw new Error("请求失败");
    return (await res.json()) as MentionItem[];
  },
}
```

- **防抖**：`debounce` 期间连续输入不会重复请求。
- **请求中断**：新查询或面板关闭时，上一次请求的 `signal` 会被 abort；组件内部会把 `AbortError` 静默忽略，不会污染结果，也不会产生未捕获的 Promise 异常。
- **加载态**：请求进行中面板会显示「加载中…」（由 tiptap suggestion 的 `loading` 状态驱动）。
- **错误处理**：如果函数抛出的不是中断错误，异常会向上冒泡——建议在业务函数内部 `try/catch` 后返回空数组，以便展示自己的错误提示。

示例：[dev/examples/AsyncSourceExample.vue](../../dev/examples/AsyncSourceExample.vue)

## 触发规则：什么时候会弹出面板

| 选项              | 默认值  | 说明                                                                                        |
| ----------------- | ------- | ------------------------------------------------------------------------------------------- |
| `allowedPrefixes` | `[' ']` | 触发符前必须是行首或空格。希望「中文标点后也能触发」时传 `[' ', '。', '，', '；', '\n']` 等 |
| `allowSpaces`     | `false` | 查询串中允许空格（例如「@张 三」），与 `allowToIncludeChar` 互斥                            |
| `minQueryLength`  | `0`     | 最少输入字符数，低于该长度时面板展示 `emptyText`                                            |

```ts
// 让 @ 在中英文标点后都能触发
{ char: "@", items: members, allowedPrefixes: [" ", "。", "，", "；", "：", "\n", null] }
```

> Tiptap 的 `allowedPrefixes` 支持 `null` 表示行首，因此上面的写法覆盖了常见标点场景。

## 引用数量上限（例如「技能只能选一个」）

给触发符声明 `limit`，超出时默认**替换**已有引用（可改成忽略）：

```ts
const triggers: MentionTrigger[] = [
  { char: "/", label: "选择技能", items: skills, limit: 1 }, // 再次选择 = 替换
  { char: "@", items: members, limit: 3, onLimit: "ignore" }, // 最多 3 个，超出忽略
];
```

- 面板选择与 `insertMention()` 程序化插入都适用；
- 替换时保留**最新**的一次引用，其它同触发符的引用连同后面的空格一起删除；
- 不同触发符的上限互不影响。

完整示例：[技能引用（/ 只能引用一个）](../../dev/examples/AiSkillExample.vue)

## 面板行为

| 选项        | 类型                                   | 默认值            | 说明                                                    |
| ----------- | -------------------------------------- | ----------------- | ------------------------------------------------------- |
| `label`     | `string`                               | —                 | 面板头部标题                                            |
| `emptyText` | `string`                               | `无匹配结果`      | 空状态文案（也可用组件的 `emptyText` 属性统一设置）     |
| `placement` | `'bottom-start' \| 'top-start' \| ...` | `bottom-start`    | 相对光标的方位                                          |
| `offset`    | `{ mainAxis?, crossAxis? }`            | `{ mainAxis: 4 }` | 面板相对光标的偏移                                      |
| `container` | `string \| HTMLElement`                | `document.body`   | 面板挂载容器，弹窗/抽屉内使用时应指向弹窗内部的定位容器 |

面板定位由 Tiptap suggestion 的 `mount()`（内部是 Floating UI）托管：滚动、窗口缩放、容器尺寸变化都会自动重新定位，空间不足时自动翻转方向。

## 键盘与鼠标交互

| 操作                    | 行为                           |
| ----------------------- | ------------------------------ |
| `↑` / `↓`               | 切换高亮项（循环）             |
| `Enter` / `Tab`         | 选中当前高亮项并插入           |
| `Esc`                   | 关闭面板（文档内容不变）       |
| 鼠标移入                | 高亮跟随                       |
| 鼠标点击（`mousedown`） | 选中候选项，且不会让编辑器失焦 |

## 下一步

- [外观定制](./customizing.md)：自定义候选项与主题
- [数据与持久化](./data-persistence.md)：把提及存进后端并在回显时还原
