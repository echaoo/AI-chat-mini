<template>
  <div class="chat-conversation">
    <div class="chat-conversation__inner">
      <header class="chat-conversation__nav">
        <button class="ghost-button" type="button" @click="goBack">返回</button>
        <h1 class="chat-conversation__title">{{ currentCharacter?.name || '聊天' }}</h1>
        <button class="ghost-button" type="button" @click="goHome">首页</button>
      </header>

      <section v-if="currentCharacter" class="chat-conversation__content">
        <ChatPanel
          class="chat-conversation__panel"
          :character="currentCharacter"
          :initial-conversation-id="panelConversationId"
          chat-mode="normal"
          :show-toolbar="false"
          @conversation-ready="handleConversationReady"
        />
      </section>

      <section v-else-if="loading" class="chat-conversation__state">
        正在加载聊天...
      </section>

      <section v-else class="chat-conversation__state">
        <h1>先选择一个聊天对象</h1>
        <p>{{ error || '聊天页现在只保留对话功能，你可以从角色页或历史记录进入。' }}</p>
        <div class="chat-conversation__state-actions">
          <button class="brand-button" type="button" @click="router.push({ name: 'characters' })">去选角色</button>
          <button class="ghost-button" type="button" @click="router.push({ name: 'conversations' })">查看历史</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character } from '@/types'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const currentCharacter = ref<Character | null>(null)
const panelConversationId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(() => {
  void resolveChatTarget()
})

async function resolveChatTarget() {
  const characterId = Number(route.query.characterId)
  const conversationId = Number(route.query.conversationId)

  loading.value = true
  error.value = ''

  currentCharacter.value = null
  panelConversationId.value = conversationId || null

  try {
    if (characterId) {
      const character = await characterApi.getCharacterDetail(characterId)

      currentCharacter.value = character
      panelConversationId.value = conversationId || null
    }
  } catch (loadError) {
    error.value = (loadError as Error).message || '加载聊天失败'
    uiStore.notify(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'characters' })
}

function goHome() {
  router.push({ name: 'home' })
}

function handleConversationReady(payload: { conversationId: number; character: Character }) {
  currentCharacter.value = payload.character
  panelConversationId.value = payload.conversationId
}
</script>

<style scoped lang="scss">
.chat-conversation {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.chat-conversation__inner {
  width: min(100%, 960px);
  height: 100%;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  overflow: hidden;
}

.chat-conversation__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: 10px 14px;
  border-radius: 24px;
  background: rgba(255, 252, 247, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 18px 48px rgba(15, 31, 54, 0.08);
  backdrop-filter: blur(18px);
  flex-shrink: 0;
}

.chat-conversation__title {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-conversation__content {
  min-height: 0;
  overflow: hidden;
}

.chat-conversation__panel {
  height: 100%;
  min-height: 0;
}

.chat-conversation__state {
  min-height: 0;
  padding: 40px 28px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 28px;
  background: rgba(255, 252, 247, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 18px 48px rgba(15, 31, 54, 0.08);
}

.chat-conversation__state h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 36px);
}

.chat-conversation__state p {
  margin: 12px 0 0;
  max-width: 420px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.chat-conversation__state-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 720px) {
  .chat-conversation__inner {
    padding: 12px;
  }

  .chat-conversation__nav {
    min-height: 56px;
    padding: 8px 10px;
  }

  .chat-conversation__title {
    font-size: 16px;
  }
}
</style>
