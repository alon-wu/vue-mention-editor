<script setup lang="ts">
import { ref } from "vue";
import { MentionEditor } from "vue-mention-editor";
import type { MentionTrigger } from "vue-mention-editor";
import { members, tags } from "../mock";

const visible = ref(false);
const content = ref("");

// 关键：把面板容器指向弹窗内部，避免面板跑到弹窗外层或被裁剪
const modalTriggers: MentionTrigger[] = [
  {
    char: "@",
    label: "提及成员",
    items: members,
    container: ".modal-card__body",
  },
  {
    char: "#",
    label: "标签",
    items: tags,
    container: ".modal-card__body",
  },
];

function close() {
  visible.value = false;
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <button class="btn btn--primary" type="button" @click="visible = true">打开弹窗</button>
      <span class="muted">弹窗内的编辑器通过 container 指定面板挂载位置</span>
    </div>

    <Teleport to="body">
      <div v-if="visible" class="modal-mask" @click.self="close">
        <div class="modal-card" role="dialog" aria-modal="true">
          <header class="modal-card__header">
            <strong>新建任务</strong>
            <button class="btn" type="button" @click="close">关闭</button>
          </header>

          <div class="modal-card__body">
            <MentionEditor
              v-model="content"
              :triggers="modalTriggers"
              placeholder="指派给 @ 某位成员，或 # 加标签"
              :min-height="96"
              :max-height="150"
              autofocus
            />
          </div>

          <footer class="modal-card__footer">
            <button class="btn" type="button" @click="close">取消</button>
            <button class="btn btn--primary" type="button" @click="close">确定</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(17 24 39 / 45%);
}

.modal-card {
  width: min(560px, 92vw);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 50px rgb(0 0 0 / 25%);
  overflow: visible;
}

.modal-card__header,
.modal-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
}

.modal-card__header {
  border-bottom: 1px solid #e5e7eb;
}

.modal-card__footer {
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

/* 面板容器：相对定位 + 允许溢出，保证浮层显示完整 */
.modal-card__body {
  position: relative;
  padding: 16px;
  overflow: visible;
}
</style>
