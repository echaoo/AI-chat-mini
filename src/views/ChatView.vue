<template>
  <div class="page-shell chat-view">
    <div class="page-inner chat-view__layout">
      <section class="chat-view__hero glass-panel" :style="heroStyle">
        <div class="chat-view__hero-overlay" />
        <div class="chat-view__hero-body">
          <div class="chat-view__topbar">
            <RouterLink class="ghost-button" to="/">首页</RouterLink>
            <div class="chat-view__top-actions">
              <RouterLink class="ghost-button" to="/characters">角色</RouterLink>
              <RouterLink class="ghost-button" to="/conversations">历史</RouterLink>
            </div>
          </div>

          <div v-if="currentCharacter" class="chat-view__character-card">
            <div class="chat-view__character-meta">
              <span class="chat-view__chip">{{ currentCharacter.isOfficial ? '官方角色' : '自定义角色' }}</span>
              <span v-if="currentCharacter.isPinnedToHome" class="chat-view__chip chat-view__chip--soft">已固定首页</span>
            </div>
            <h1>{{ currentCharacter.name }}</h1>
            <p>{{ currentCharacter.description || currentCharacter.greetingMessage || '和 TA 聊聊最近的心事。' }}</p>

            <div class="chat-view__controls">
              <button class="chip-button" type="button" :disabled="charactersCount < 2" @click="stepCharacter(-1)">
                上一个
              </button>
              <button class="chip-button" type="button" :disabled="charactersCount < 2" @click="stepCharacter(1)">
                下一个
              </button>
              <button class="chip-button" type="button" @click="toggleMode">
                {{ chatMode === 'romantic' ? '心动模式' : '基本模式' }}
              </button>
            </div>

            <div class="chat-view__actions">
              <button class="ghost-button" type="button" @click="handleToggleFavorite">
                {{ currentCharacter.isFavorite ? '取消收藏' : '加入收藏' }}
              </button>
              <button class="ghost-button" type="button" @click="handleTogglePin">
                {{ currentCharacter.isPinnedToHome ? '取消固定' : '固定到首页' }}
              </button>
            </div>
          </div>

          <div v-else-if="loading" class="chat-view__empty">正在加载角色...</div>
          <div v-else class="chat-view__empty">
            <p>{{ error || '没有找到可聊天的角色。' }}</p>
            <RouterLink class="brand-button" to="/characters">去选角色</RouterLink>
          </div>
        </div>
      </section>

      <ChatPanel
        v-if="currentCharacter"
        :character="currentCharacter"
        :initial-conversation-id="panelConversationId"
        :chat-mode="chatMode"
        @conversation-ready="handleConversationReady"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character, ChatMode } from '@/types'
import { clearHomeCharacterCache, setHomeCharacterCache } from '@/utils/cache'
import { getCharacterCover } from '@/utils/character'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const characters = ref<Character[]>([])
const standaloneCharacter = ref<Character | null>(null)
const currentIndex = ref(0)
const panelConversationId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const chatMode = ref<ChatMode>('normal')

const routeCharacterId = computed(() => parseQueryNumber(route.query.characterId))
const routeConversationId = computed(() => parseQueryNumber(route.query.conversationId))
const allCharacters = computed(() => {
  const merged = [...characters.value]

  if (standaloneCharacter.value && !merged.some((item) => item.id === standaloneCharacter.value?.id)) {
    merged.unshift(standaloneCharacter.value)
  }

  return merged
})

const charactersCount = computed(() => allCharacters.value.length)
const currentCharacter = computed(() => allCharacters.value[currentIndex.value] || null)
const heroStyle = computed(() => {
  const cover = getCharacterCover(currentCharacter.value)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(135deg, rgba(10, 18, 30, 0.6), rgba(56, 31, 24, 0.35)), url(${cover})`
  }
})

onMounted(async () => {
  await loadCharacters()
})

watch(
  () => route.query.mode,
  (value) => {
    chatMode.value = value === 'romantic' ? 'romantic' : 'normal'
  },
  { immediate: true }
)

watch(
  () => routeConversationId.value,
  (value) => {
    panelConversationId.value = value || null
  },
  { immediate: true }
)

watch(
  [allCharacters, routeCharacterId],
  ([list, characterId]) => {
    if (!list.length) return

    const targetIndex = characterId ? list.findIndex((item) => item.id === characterId) : 0
    currentIndex.value = targetIndex >= 0 ? targetIndex : 0
  },
  { immediate: true }
)

async function loadCharacters() {
  loading.value = true
  error.value = ''

  try {
    const officialCharacters = await characterApi.getOfficialCharacters()
    characters.value = officialCharacters

    if (routeCharacterId.value) {
      const existing = officialCharacters.find((item) => item.id === routeCharacterId.value)
      if (!existing) {
        standaloneCharacter.value = await characterApi.getCharacterDetail(routeCharacterId.value)
      }
    }

    if (!routeCharacterId.value && officialCharacters.length > 0) {
      syncRoute(officialCharacters[0].id, undefined, true)
    }
  } catch (loadError) {
    error.value = (loadError as Error).message || '加载角色失败'
    uiStore.notify(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function parseQueryNumber(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function syncRoute(characterId: number, conversationId?: number, replace = false) {
  const query: Record<string, string> = {
    characterId: String(characterId),
    mode: chatMode.value
  }

  if (conversationId) {
    query.conversationId = String(conversationId)
  }

  const target = {
    name: 'chat' as const,
    query
  }

  if (replace) {
    router.replace(target)
    return
  }

  router.push(target)
}

function stepCharacter(direction: number) {
  if (allCharacters.value.length < 2 || !currentCharacter.value) return

  const nextIndex = (currentIndex.value + direction + allCharacters.value.length) % allCharacters.value.length
  const nextCharacter = allCharacters.value[nextIndex]
  if (!nextCharacter) return

  panelConversationId.value = null
  syncRoute(nextCharacter.id)
}

function toggleMode() {
  chatMode.value = chatMode.value === 'romantic' ? 'normal' : 'romantic'
  if (currentCharacter.value) {
    syncRoute(currentCharacter.value.id, panelConversationId.value || undefined, true)
  }
}

function patchCharacterState(characterId: number, patch: Partial<Character>, clearOthersPinned = false) {
  characters.value = characters.value.map((item) => {
    if (item.id === characterId) {
      return { ...item, ...patch }
    }

    if (clearOthersPinned) {
      return { ...item, isPinnedToHome: false }
    }

    return item
  })

  if (standaloneCharacter.value?.id === characterId) {
    standaloneCharacter.value = {
      ...standaloneCharacter.value,
      ...patch
    }
  } else if (clearOthersPinned && standaloneCharacter.value) {
    standaloneCharacter.value = {
      ...standaloneCharacter.value,
      isPinnedToHome: false
    }
  }
}

async function handleToggleFavorite() {
  if (!currentCharacter.value) return

  const nextValue = !Boolean(currentCharacter.value.isFavorite)
  patchCharacterState(currentCharacter.value.id, { isFavorite: nextValue })

  try {
    await characterApi.toggleFavorite(currentCharacter.value.id)
    uiStore.notify(nextValue ? '已加入收藏' : '已取消收藏', 'success')
  } catch (error) {
    patchCharacterState(currentCharacter.value.id, { isFavorite: !nextValue })
    uiStore.notify((error as Error).message || '操作失败', 'error')
  }
}

async function handleTogglePin() {
  if (!currentCharacter.value) return

  try {
    const result = await characterApi.togglePinToHome(currentCharacter.value.id)
    const isPinned = result.isPinnedToHome

    patchCharacterState(currentCharacter.value.id, { isPinnedToHome: isPinned }, isPinned)

    if (isPinned) {
      setHomeCharacterCache({
        characterId: currentCharacter.value.id,
        conversationId: panelConversationId.value,
        character: currentCharacter.value,
        timestamp: Date.now()
      })
      uiStore.notify('已固定到首页', 'success')
    } else {
      clearHomeCharacterCache()
      uiStore.notify('已取消固定', 'success')
    }
  } catch (error) {
    uiStore.notify((error as Error).message || '操作失败', 'error')
  }
}

function handleConversationReady(payload: { conversationId: number; character: Character }) {
  panelConversationId.value = payload.conversationId
  patchCharacterState(payload.character.id, payload.character)
  syncRoute(payload.character.id, payload.conversationId, true)
}
</script>

<style scoped lang="scss">
.chat-view__layout {
  display: grid;
  gap: 20px;
  align-items: stretch;
}

.chat-view__hero {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  background:
    linear-gradient(150deg, rgba(18, 26, 39, 0.88), rgba(69, 38, 29, 0.6)),
    linear-gradient(135deg, #2d425f 0%, #7f5745 100%);
  background-size: cover;
  background-position: center;
}

.chat-view__hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(11, 16, 22, 0.2));
}

.chat-view__hero-body {
  position: relative;
  z-index: 1;
  padding: 20px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--text-light);
}

.chat-view__topbar,
.chat-view__top-actions,
.chat-view__controls,
.chat-view__actions,
.chat-view__character-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.chat-view__topbar {
  justify-content: space-between;
}

.chat-view__character-card {
  width: min(100%, 580px);
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
}

.chat-view__character-card h1 {
  margin: 12px 0;
  font-size: clamp(28px, 5vw, 40px);
}

.chat-view__character-card p {
  margin: 0;
  line-height: 1.8;
}

.chat-view__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
}

.chat-view__chip--soft {
  background: rgba(201, 109, 75, 0.18);
}

.chat-view__controls,
.chat-view__actions {
  margin-top: 18px;
}

.chat-view__empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 16px;
  text-align: center;
}

@media (min-width: 1024px) {
  .chat-view__layout {
    grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
  }
}

@media (max-width: 720px) {
  .chat-view__topbar {
    flex-direction: column;
  }
}
</style>
