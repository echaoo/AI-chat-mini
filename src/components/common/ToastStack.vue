<template>
  <div class="toast-stack" aria-live="polite">
    <transition-group name="toast">
      <div
        v-for="notice in uiStore.notices"
        :key="notice.id"
        class="toast-item"
        :class="`toast-item--${notice.type}`"
      >
        {{ notice.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>

<style scoped lang="scss">
.toast-stack {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 80;
  display: grid;
  gap: 10px;
  justify-items: center;
  transform: translate(-50%, -50%);
  width: min(82vw, 360px);
  pointer-events: none;
}

.toast-item {
  width: fit-content;
  max-width: 100%;
  border-radius: 16px;
  padding: 14px 18px;
  text-align: center;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  background: rgba(8, 8, 8, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}

.toast-item--info {
  background: rgba(8, 8, 8, 0.9);
}

.toast-item--success {
  background: rgba(8, 8, 8, 0.9);
}

.toast-item--error {
  background: rgba(8, 8, 8, 0.9);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
