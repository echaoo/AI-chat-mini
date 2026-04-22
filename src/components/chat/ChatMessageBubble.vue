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
      <div v-if="!message.isLoading" class="message-bubble__actions">
        <button class="message-bubble__action" type="button" aria-label="复制" @click="handleCopy">
          <img :src="resolvedCopyIcon" alt="" />
        </button>
        <button v-if="canRollback" class="message-bubble__action" type="button" aria-label="回溯" @click="$emit('rollback')">
          <img :src="resolvedBackwardIcon" alt="" />
        </button>
        <button v-if="canRegenerate" class="message-bubble__action" type="button" aria-label="重新生成" @click="$emit('regenerate')">
          <img :src="regenIcon" :class="{ 'message-bubble__action-icon--invert': isUserMessage }" alt="" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import backwardIcon from '@/assets/chat/backward.png'
import backwardWhiteIcon from '@/assets/chat/backward-white.png'
import copyIcon from '@/assets/chat/copy.png'
import copyWhiteIcon from '@/assets/chat/copy-white.png'
import regenIcon from '@/assets/chat/regen.png'
import { useUiStore } from '@/stores/ui'
import type { Message } from '@/types'
import { parseContentSegments } from '@/utils/chat'

const props = defineProps<{
  message: Message
  canRollback?: boolean
  canRegenerate?: boolean
}>()

defineEmits<{
  (event: 'rollback'): void
  (event: 'regenerate'): void
}>()

const uiStore = useUiStore()
const isUserMessage = computed(() => props.message.role === 'user')
const resolvedCopyIcon = computed(() => (isUserMessage.value ? copyWhiteIcon : copyIcon))
const resolvedBackwardIcon = computed(() => (isUserMessage.value ? backwardWhiteIcon : backwardIcon))
const segments = computed(() => parseContentSegments(props.message.content || ''))

function handleCopy() {
  void navigator.clipboard.writeText(props.message.content || '')
  uiStore.notify('已复制', 'success')
}
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble__inner {
  max-width: min(100%, 540px);
  padding: 18px 18px 12px;
  border-radius: 12px;
  backdrop-filter: blur(16px);
}

.message-bubble--assistant {
  align-items: flex-start;
}

.message-bubble--assistant .message-bubble__inner {
  background: rgba(255, 255, 255, 0.96);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.06);
}

.message-bubble--user {
  align-items: flex-end;
}

.message-bubble--user .message-bubble__inner {
  background: linear-gradient(135deg, #2a2a2a 0%, #111111 100%);
  color: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18);
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
  justify-content: flex-end;
  gap: 0;
}

.message-bubble__action {
  width: 30px;
  height: 30px;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
}

.message-bubble__action img {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.message-bubble__action-icon--invert {
  filter: brightness(0) invert(1);
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
