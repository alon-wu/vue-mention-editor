<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { searchMembers } from "../mock";

const content = ref("");
const requestCount = ref(0);
const lastQuery = ref("—");
const history = ref<string[]>([]);

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "远程搜索成员",
    // 停顿 300ms 才发起请求
    debounce: 300,
    // 至少输入 1 个字符才查询
    minQueryLength: 1,
    emptyText: "输入关键词开始搜索",
    async items({ query, signal }) {
      requestCount.value += 1;
      lastQuery.value = query || "（空）";
      history.value = [`#${requestCount.value} 查询「${query}」`, ...history.value].slice(0, 5);
      // 组件会把 signal 传进来：新查询 / 组件销毁时会中断上一次请求
      return searchMembers(query, signal);
    },
  },
];
</script>

<template>
  <div class="stack">
    <MentionEditor
      v-model="content"
      :triggers="triggers"
      placeholder="输入 @ 后停顿一下，观察请求次数"
      :min-height="96"
    />

    <div class="muted">已发起 {{ requestCount }} 次查询 · 最近一次：{{ lastQuery }}</div>

    <ul class="log">
      <li v-for="(line, index) in history" :key="index">{{ line }}</li>
    </ul>

    <p class="muted">
      提示：快速连打字符时只有最后一次会真正发出请求（防抖），输入过程中被中断的请求不会污染结果。
    </p>
  </div>
</template>
