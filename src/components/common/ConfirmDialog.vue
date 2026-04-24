<template>
  <Teleport to="body">
    <transition name="confirm-dialog">
      <div
        v-if="uiStore.confirmDialog.open"
        class="confirm-dialog__overlay"
        @click="uiStore.cancelCurrentDialog"
      >
        <div
          class="confirm-dialog glass-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          @click.stop
        >
          <div class="confirm-dialog__body">
            <h2 id="confirm-dialog-title" class="confirm-dialog__title">
              {{ uiStore.confirmDialog.title }}
            </h2>
            <p id="confirm-dialog-message" class="confirm-dialog__message">
              {{ uiStore.confirmDialog.message }}
            </p>
          </div>

          <div class="confirm-dialog__actions">
            <button
              ref="cancelButtonRef"
              class="confirm-dialog__button confirm-dialog__button--cancel"
              type="button"
              @click="uiStore.cancelCurrentDialog"
            >
              {{ uiStore.confirmDialog.cancelText }}
            </button>
            <button
              class="confirm-dialog__button"
              :class="confirmButtonClass"
              type="button"
              @click="uiStore.confirmCurrentDialog"
            >
              {{ uiStore.confirmDialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
const confirmButtonClass = computed(() =>
  uiStore.confirmDialog.variant === 'danger'
    ? 'confirm-dialog__button--danger'
    : 'confirm-dialog__button--confirm'
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && uiStore.confirmDialog.open) {
    uiStore.cancelCurrentDialog()
  }
}

watch(
  () => uiStore.confirmDialog.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', handleKeydown)
      void nextTick(() => {
        cancelButtonRef.value?.focus()
      })
      return
    }

    window.removeEventListener('keydown', handleKeydown)
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.confirm-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: rgba(7, 7, 7, 0.42);
  backdrop-filter: blur(10px);
}

.confirm-dialog {
  width: min(100%, 360px);
  padding: 24px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.66);
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.18);
}

.confirm-dialog__body {
  display: grid;
  gap: 12px;
}

.confirm-dialog__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.confirm-dialog__message {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.confirm-dialog__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.confirm-dialog__button {
  min-height: 44px;
  border-radius: 14px;
  padding: 0 16px;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.confirm-dialog__button:active {
  transform: scale(0.98);
}

.confirm-dialog__button--cancel {
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-primary);
  border-color: rgba(17, 17, 17, 0.1);
}

.confirm-dialog__button--confirm {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.14);
}

.confirm-dialog__button--danger {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  color: #fff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.14);
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-dialog-enter-active .confirm-dialog,
.confirm-dialog-leave-active .confirm-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-from .confirm-dialog,
.confirm-dialog-leave-to .confirm-dialog {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}
</style>
