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
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 60;
  display: grid;
  gap: 10px;
  transform: translateX(-50%);
  width: min(92vw, 420px);
}

.toast-item {
  border-radius: 999px;
  padding: 12px 16px;
  text-align: center;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 12px 36px rgba(14, 31, 53, 0.18);
  backdrop-filter: blur(12px);
}

.toast-item--info {
  background: rgba(24, 38, 58, 0.86);
}

.toast-item--success {
  background: rgba(28, 96, 69, 0.9);
}

.toast-item--error {
  background: rgba(167, 47, 47, 0.92);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
