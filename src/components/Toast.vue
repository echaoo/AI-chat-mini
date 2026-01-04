<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const icon = ref<'success' | 'error' | 'none'>('none')

let timer: ReturnType<typeof setTimeout> | null = null

function show(msg: string, type: 'success' | 'error' | 'none' = 'none', duration = 2000) {
  if (timer) clearTimeout(timer)

  message.value = msg
  icon.value = type
  visible.value = true

  timer = setTimeout(() => {
    visible.value = false
  }, duration)
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] px-6 py-3 bg-black/70 text-white rounded-lg text-sm flex items-center gap-2"
      >
        <span v-if="icon === 'success'" class="text-green-400">✓</span>
        <span v-else-if="icon === 'error'" class="text-red-400">✕</span>
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
