<script setup lang="ts">
import type { Message } from '../types'

defineProps<{
  message: Message
}>()
</script>

<template>
  <div
    class="flex mb-3"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[75%] px-4 py-2.5 rounded-2xl"
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
