<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members, splitByKeyword } from "../mock";

const content = ref("");
const triggers: MentionTrigger[] = [{ char: "@", label: "提及成员", items: members }];
</script>

<template>
  <div class="stack">
    <MentionEditor
      v-model="content"
      :triggers="triggers"
      :min-height="110"
      placeholder="输入 @ 查看自定义候选样式"
    >
      <!-- #item 插槽：item/index/query/selected/trigger -->
      <template #item="{ item, selected, query }">
        <div class="member-item" :class="{ 'is-selected': selected }">
          <img class="member-item__avatar" :src="item.avatar" :alt="item.label" />
          <div class="member-item__main">
            <div class="member-item__label">
              <template v-for="(part, index) in splitByKeyword(item.label, query)" :key="index">
                <mark v-if="part.hit">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </div>
            <div class="member-item__desc">{{ item.description }}</div>
          </div>
          <span v-if="selected" class="member-item__hint">Enter</span>
        </div>
      </template>
    </MentionEditor>

    <p class="muted">
      插槽内容在父组件作用域中渲染，所以可以直接用本组件的响应式数据、组件与样式。
    </p>
  </div>
</template>

<style scoped>
.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.member-item__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.member-item__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-item__label {
  font-weight: 500;
}

.member-item__label mark {
  background: #fde68a;
  color: inherit;
  border-radius: 3px;
}

.member-item__desc {
  overflow: hidden;
  font-size: 12px;
  color: #6b7280;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-item__hint {
  margin-left: auto;
  padding: 1px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
}

.member-item.is-selected .member-item__hint {
  border-color: #c7d2fe;
  color: #4f46e5;
}
</style>
