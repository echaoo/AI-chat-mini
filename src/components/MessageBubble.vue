<script setup lang="ts">
import type { Message } from '../types'

defineProps<{
  message: Message
}>()
</script>

<template>
  <!-- 系统消息（居中显示） -->
  <div v-if="message.role === 'system'" class="flex justify-center mb-3">
    <div class="px-4 py-1.5 rounded-full bg-gray-200/80 text-gray-500 text-xs">
      {{ message.content }}
    </div>
  </div>

  <!-- 用户/AI消息 -->
  <div
    v-else
    class="flex mb-3"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[85%] px-4 py-2.5 rounded-2xl"
      :class="message.role === 'user'
        ? 'bg-black text-white'
        : 'bg-white/90 shadow-sm'"
    >
      <span
        class="text-sm leading-relaxed break-words"
        :class="message.role === 'user' ? 'text-white' : 'text-gray-800'"
      >
        {{ message.content }}
      </span>
    </div>
  </div>
</template>
