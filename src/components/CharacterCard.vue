<script setup lang="ts">
import type { Character } from '../types'

defineProps<{
  character: Character
}>()

const emit = defineEmits<{
  tap: [character: Character]
}>()
</script>

<template>
  <div
    class="flex items-center p-3 bg-white rounded-2xl mb-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    @click="emit('tap', character)"
  >
    <img
      :src="character.avatarUrl || '/default-avatar.png'"
      :alt="character.name"
      class="w-14 h-14 rounded-full mr-3 bg-gray-100 object-cover"
    />
    <div class="flex-1 flex flex-col overflow-hidden">
      <span class="text-base font-semibold text-gray-800 mb-1">
        {{ character.name }}
      </span>
      <span class="text-sm text-gray-500 line-clamp-2">
        {{ character.description || '暂无描述' }}
      </span>
    </div>
  </div>
</template>
