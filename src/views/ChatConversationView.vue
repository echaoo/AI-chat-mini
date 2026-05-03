<template>
  <div class="chat-conversation" :style="backgroundStyle">
    <div class="chat-conversation__inner">
      <OverlayHeader class="chat-conversation__header" :title="currentCharacter?.name || '聊天'" @back="goBack">
        <div class="chat-conversation__header-summary">
          <h1 class="chat-conversation__header-name">{{ currentCharacter?.name || '聊天' }}</h1>
          <div v-if="relationshipState" class="chat-conversation__relationship">
            <span class="chat-conversation__relationship-stage">{{ relationshipStage }}</span>
            <div class="chat-conversation__relationship-progress">
              <span class="chat-conversation__relationship-track" aria-hidden="true">
                <span class="chat-conversation__relationship-fill" :style="{ width: `${relationshipProgress}%` }" />
              </span>
              <span class="chat-conversation__relationship-value">{{ relationshipScoreText }}</span>
            </div>
          </div>
        </div>
        <template #right>
          <button class="chat-conversation__icon-button" type="button" aria-label="设置" @click="openSettings">
            <img :src="settingIcon" alt="" />
          </button>
        </template>
      </OverlayHeader>

      <section v-if="currentCharacter" class="chat-conversation__content">
        <ChatPanel
          class="chat-conversation__panel"
          :character="currentCharacter"
          :initial-conversation-id="panelConversationId"
          :chat-mode="chatSettings.chatMode"
          :show-toolbar="false"
          @conversation-ready="handleConversationReady"
          @relationship-updated="handleRelationshipUpdated"
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OverlayHeader from '@/components/common/OverlayHeader.vue'
import settingIcon from '@/assets/chat/setting.png'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { characterApi } from '@/services/api'
import type { Character, RelationshipStateSnapshot } from '@/types'
import { getChatEntryCharacterCache, getChatSettingsCache, setChatEntryCharacterCache } from '@/utils/cache'
import { getCharacterCover } from '@/utils/character'

const route = useRoute()
const router = useRouter()

const currentCharacter = ref<Character | null>(null)
const panelConversationId = ref<number | null>(null)
const chatSettings = ref(getChatSettingsCache())
const relationshipState = ref<RelationshipStateSnapshot | null>(null)
const loading = ref(true)
const error = ref('')
const resolveSeed = ref(0)
const backgroundStyle = computed(() => {
  const cover = getCharacterCover(currentCharacter.value)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 10, 10, 0.22), rgba(10, 10, 10, 0.28)), url(${cover})`
  }
})
const relationshipStage = computed(() => {
  const state = relationshipState.value
  return state ? `${state.intimacyStageLabel} · 信任值 ${state.trustScore}` : ''
})
const relationshipProgress = computed(() => {
  const progress = relationshipState.value?.progressToNextStage ?? 0
  return Math.max(0, Math.min(100, progress))
})
const relationshipScoreText = computed(() => {
  const state = relationshipState.value
  if (!state) return ''

  return typeof state.nextStageFavorabilityScore === 'number'
    ? `${state.favorabilityScore} / ${state.nextStageFavorabilityScore}`
    : String(state.favorabilityScore)
})

watch(
  () => route.fullPath,
  () => {
    chatSettings.value = getChatSettingsCache()
    void resolveChatTarget()
  },
  { immediate: true }
)

async function resolveChatTarget() {
  const currentSeed = ++resolveSeed.value
  const characterId = parsePositiveQuery(route.query.characterId)
  const conversationId = parsePositiveQuery(route.query.conversationId)
  const cachedCharacter = getChatEntryCharacterCache()

  loading.value = true
  error.value = ''
  panelConversationId.value = conversationId || null
  relationshipState.value = null

  if (!characterId) {
    currentCharacter.value = null
    error.value = '缺少角色信息'
    loading.value = false
    return
  }

  if (cachedCharacter?.id === characterId) {
    currentCharacter.value = cachedCharacter
    loading.value = false
    return
  }

  currentCharacter.value = null

  try {
    const character = await characterApi.getCharacterDetail(characterId)

    if (currentSeed !== resolveSeed.value) return

    currentCharacter.value = character
    setChatEntryCharacterCache(character)
  } catch (loadError) {
    if (currentSeed !== resolveSeed.value) return

    error.value = (loadError as Error).message || '加载聊天对象失败'
  } finally {
    if (currentSeed === resolveSeed.value) {
      loading.value = false
    }
  }
}

function parsePositiveQuery(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'characters' })
}

function openSettings() {
  router.push({
    name: 'chat-settings',
    query: {
      characterId: currentCharacter.value?.id ? String(currentCharacter.value.id) : undefined,
      conversationId: panelConversationId.value ? String(panelConversationId.value) : undefined
    }
  })
}

function handleConversationReady(payload: { conversationId: number; character: Character }) {
  currentCharacter.value = payload.character
  panelConversationId.value = payload.conversationId
  setChatEntryCharacterCache(payload.character)
}

function handleRelationshipUpdated(nextRelationshipState: RelationshipStateSnapshot | null) {
  relationshipState.value = nextRelationshipState
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

.chat-conversation__header :deep(.overlay-header__summary) {
  display: flex;
  align-items: center;
}

.chat-conversation__header-summary {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(84px, 1fr);
  align-items: center;
  gap: 10px;
}

.chat-conversation__header-name {
  max-width: 112px;
  margin: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.24);
}

.chat-conversation__relationship {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.chat-conversation__relationship-stage {
  min-width: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-conversation__relationship-progress {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(32px, 33%) auto;
  align-items: center;
  justify-content: start;
  gap: 6px;
}

.chat-conversation__relationship-track {
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.16);
}

.chat-conversation__relationship-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f1b7d2 0%, #f3d47a 100%);
}

.chat-conversation__relationship-value {
  color: rgba(255, 255, 255, 0.68);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.chat-conversation__icon-button {
  width: 100%;
  height: 100%;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  box-shadow: none;
}

.chat-conversation__icon-button img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  opacity: 0.8;
  filter: brightness(0) invert(1);
}

.chat-conversation__content {
  min-height: 0;
  overflow: hidden;
  padding: 0;
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
  border-radius: 14px;
  background: rgba(26, 18, 26, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(18px);
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
  .chat-conversation__content {
    padding: 0;
  }

  .chat-conversation__state {
    margin: 8px 12px 12px;
  }
}
</style>
