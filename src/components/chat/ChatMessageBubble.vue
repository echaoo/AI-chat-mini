<template>
  <article class="message-bubble" :class="message.role === 'user' ? 'message-bubble--user' : 'message-bubble--assistant'">
    <div class="message-bubble__inner">
      <div v-if="message.isLoading" class="message-bubble__loading">
        <span />
        <span />
        <span />
      </div>
      <div v-else class="message-bubble__content">
        <template v-for="segment in segments" :key="segment.key">
          <span :class="{ 'message-bubble__aside': segment.isAside }">{{ segment.text }}</span>
        </template>
      </div>
      <time v-if="!message.isLoading" class="message-bubble__time">{{ formatClock(message.createdAt) }}</time>
    </div>
    <div v-if="canRollback || canRegenerate" class="message-bubble__actions">
      <button v-if="canRollback" class="ghost-button" type="button" @click="$emit('rollback')">回溯</button>
      <button v-if="canRegenerate" class="ghost-button" type="button" @click="$emit('regenerate')">重新生成</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@/types'
import { parseContentSegments } from '@/utils/chat'
import { formatClock } from '@/utils/time'

const props = defineProps<{
  message: Message
  canRollback?: boolean
  canRegenerate?: boolean
}>()

defineEmits<{
  (event: 'rollback'): void
  (event: 'regenerate'): void
}>()

const segments = computed(() => parseContentSegments(props.message.content || ''))
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble__inner {
  max-width: min(100%, 540px);
  padding: 18px 18px 14px;
  border-radius: 24px;
  backdrop-filter: blur(16px);
}

.message-bubble--assistant {
  align-items: flex-start;
}

.message-bubble--assistant .message-bubble__inner {
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  box-shadow: 0 12px 24px rgba(16, 29, 48, 0.06);
}

.message-bubble--user {
  align-items: flex-end;
}

.message-bubble--user .message-bubble__inner {
  background: rgba(17, 25, 37, 0.86);
  color: rgba(255, 255, 255, 0.94);
}

.message-bubble__content {
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble__aside {
  color: rgba(93, 104, 120, 0.88);
}

.message-bubble--user .message-bubble__aside {
  color: rgba(255, 255, 255, 0.62);
}

.message-bubble__time {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(93, 104, 120, 0.88);
}

.message-bubble--user .message-bubble__time {
  color: rgba(255, 255, 255, 0.64);
}

.message-bubble__loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.message-bubble__loading span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
  animation: loading-bounce 1.1s infinite ease-in-out;
}

.message-bubble__loading span:nth-child(2) {
  animation-delay: 0.18s;
}

.message-bubble__loading span:nth-child(3) {
  animation-delay: 0.36s;
}

.message-bubble__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-bubble__actions .ghost-button {
  min-height: 34px;
  padding: 0 14px;
  font-size: 13px;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
