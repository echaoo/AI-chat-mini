<script setup lang="ts">
import type { Message } from '../types'

defineProps<{
  message: Message
}>()

function formatTime(time: string): string {
  const date = new Date(time)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<template>
  <div
    class="flex mb-4 px-4"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[70%] p-3 rounded-2xl flex flex-col"
      :class="message.role === 'user'
        ? 'bg-primary text-white'
        : 'bg-white shadow-sm'"
    >
      <span
        class="text-sm leading-relaxed break-words"
        :class="message.role === 'user' ? 'text-white' : 'text-gray-800'"
      >
        {{ message.content }}
      </span>
      <span
        class="text-xs mt-1"
        :class="message.role === 'user' ? 'text-white/70' : 'text-gray-400'"
      >
        {{ formatTime(message.createdAt) }}
      </span>
    </div>
  </div>
</template>
