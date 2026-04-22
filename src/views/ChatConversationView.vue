<template>
  <div class="chat-conversation" :style="backgroundStyle">
    <div class="chat-conversation__inner">
      <header class="chat-conversation__nav">
        <button class="chat-conversation__back-button" type="button" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>
        <div class="chat-conversation__summary">
          <h1 class="chat-conversation__title">{{ currentCharacter?.name || '聊天' }}</h1>
        </div>
        <button class="chat-conversation__icon-button" type="button" aria-label="设置" @click="openSettings">
          <img :src="settingIcon" alt="" />
        </button>
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import backIcon from '@/assets/chat/back.png'
import settingIcon from '@/assets/chat/setting.png'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character } from '@/types'
import { getHomeCharacterCache } from '@/utils/cache'
import { getCharacterCover } from '@/utils/character'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const currentCharacter = ref<Character | null>(null)
const panelConversationId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const backgroundStyle = computed(() => {
  const cover = getCharacterCover(currentCharacter.value)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 10, 10, 0.22), rgba(10, 10, 10, 0.28)), url(${cover})`
  }
})

onMounted(() => {
  void resolveChatTarget()
})

async function resolveChatTarget() {
  const characterId = Number(route.query.characterId)
  const conversationId = Number(route.query.conversationId)
  const cachedHomeCharacter = getHomeCharacterCache()

  loading.value = true
  error.value = ''

  currentCharacter.value = cachedHomeCharacter?.character.id === characterId ? cachedHomeCharacter.character : null
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

function openSettings() {
  uiStore.notify('设置入口预留中', 'info')
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
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.chat-conversation__inner {
  width: 100%;
  height: 100%;
  padding: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.chat-conversation__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: calc(env(safe-area-inset-top) + 10px) 0 10px;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.14));
  border-bottom: 1px solid rgba(255, 255, 255, 0.26);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(24px) saturate(130%);
  flex-shrink: 0;
}

.chat-conversation__back-button,
.chat-conversation__icon-button {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.chat-conversation__back-button,
.chat-conversation__icon-button {
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
}

.chat-conversation__back-button img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  opacity: 0.92;
}

.chat-conversation__icon-button img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  opacity: 0.8;
}

.chat-conversation__summary {
  flex: 1;
  min-width: 0;
}

.chat-conversation__title {
  margin: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.24);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-conversation__content {
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px 16px;
}

.chat-conversation__panel {
  height: 100%;
  min-height: 0;
}

.chat-conversation__state {
  min-height: 0;
  margin: 12px 16px 16px;
  padding: 40px 28px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 28px;
  background: rgba(255, 252, 247, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 18px 48px rgba(15, 31, 54, 0.08);
}

.chat-conversation__state-actions button {
  min-height: auto;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  color: var(--text-primary);
}

.chat-conversation__state-actions .ghost-button {
  color: var(--text-secondary);
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
  .chat-conversation__nav {
    min-height: 60px;
    padding: calc(env(safe-area-inset-top) + 8px) 0 8px;
  }

  .chat-conversation__title {
    font-size: 16px;
  }

  .chat-conversation__content {
    padding: 8px 12px 12px;
  }

  .chat-conversation__state {
    margin: 8px 12px 12px;
  }
}
</style>
