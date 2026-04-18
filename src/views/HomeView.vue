<template>
  <div class="page-shell home-view">
    <div class="page-inner">
      <ViewHeader
        eyebrow="H5 首版"
        title="AI 陪伴"
        description="先用测试 token 直通，保留你现在的聊天、历史、角色创建能力，后续再替换成正式登录。"
      >
        <template #actions>
          <RouterLink class="ghost-button home-view__nav-link" to="/characters">换角色</RouterLink>
          <RouterLink class="ghost-button home-view__nav-link" to="/conversations">消息</RouterLink>
          <RouterLink class="brand-button home-view__nav-link" to="/create-character">创建角色</RouterLink>
        </template>
      </ViewHeader>

      <section class="home-hero glass-panel" :style="heroStyle">
        <div class="home-hero__veil" />
        <div class="home-hero__content">
          <div v-if="loading" class="home-hero__empty">正在加载首页角色...</div>
          <div v-else-if="homeCharacter" class="home-hero__body">
            <div class="home-hero__card">
              <span class="home-hero__eyebrow">当前角色</span>
              <h2>{{ homeCharacter.character.name }}</h2>
              <p>{{ greetingText }}</p>
            </div>

            <div class="home-hero__actions">
              <button class="brand-button home-hero__main-btn" type="button" @click="startChat('normal')">
                开始聊天
              </button>
              <button class="chip-button" type="button" @click="startChat('romantic')">心动模式</button>
              <button class="chip-button" type="button" @click="goToCharacters">重新选择</button>
            </div>
          </div>

          <div v-else class="home-hero__empty">
            <p>还没有固定到首页的角色，先去挑一个你喜欢的吧。</p>
            <button class="brand-button" type="button" @click="goToCharacters">去选角色</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ViewHeader from '@/components/common/ViewHeader.vue'
import { getGreeting } from '@/constants/greetings'
import { characterApi, conversationApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { CachedConversationCharacter, Character, ChatMode, PinnedCharacterSummary } from '@/types'
import {
  clearHomeCharacterCache,
  getGreetingCache,
  getHomeCharacterCache,
  getLastConversationCache,
  setGreetingCache,
  setHomeCharacterCache,
  type HomeCharacterCache
} from '@/utils/cache'
import { getCharacterCover } from '@/utils/character'

const GREETING_CACHE_DURATION_MS = 3 * 60 * 60 * 1000
const GREETING_COMMAND = '[GET_GREETING]'

const router = useRouter()
const uiStore = useUiStore()
const homeCharacter = ref<HomeCharacterCache | null>(null)
const greetingText = ref('')
const loading = ref(true)

const heroStyle = computed(() => {
  const cover = getCharacterCover(homeCharacter.value?.character)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(135deg, rgba(14, 22, 35, 0.55), rgba(38, 24, 18, 0.35)), url(${cover})`
  }
})

onMounted(async () => {
  await loadHomeCharacter()
})

async function loadHomeCharacter() {
  loading.value = true
  const cached = getHomeCharacterCache()

  if (cached) {
    homeCharacter.value = cached
    updateAndDisplayGreeting()
  }

  try {
    const serverData = await characterApi.getPinnedCharacter()

    if (serverData) {
      const mapped = mapPinnedCharacter(serverData)
      homeCharacter.value = mapped
      setHomeCharacterCache(mapped)
      updateAndDisplayGreeting()
      await fetchAndCacheNewGreeting()
      return
    }

    const lastConversation = getLastConversationCache()
    if (lastConversation?.character?.id) {
      applyHomeCharacterFromCache(lastConversation)
      try {
        await characterApi.togglePinToHome(lastConversation.character.id)
      } catch (error) {
        // 首页兜底固定失败时保留本地体验即可。
      }
      return
    }

    clearHomeCharacterCache()
    homeCharacter.value = null
  } catch (error) {
    if (!cached) {
      uiStore.notify((error as Error).message || '加载首页角色失败', 'error')
    }
  } finally {
    loading.value = false
  }
}

function mapPinnedCharacter(serverData: PinnedCharacterSummary): HomeCharacterCache {
  return {
    characterId: serverData.characterId,
    conversationId: serverData.conversationId,
    character: {
      id: serverData.characterId,
      name: serverData.name,
      avatarUrl: serverData.avatarUrl,
      description: serverData.description,
      greetingMessage: serverData.greetingMessage,
      chatBackgroundUrl: serverData.chatBackgroundUrl || null,
      companionBackgroundUrl: serverData.companionBackgroundUrl || null,
      sleepBackgroundUrl: serverData.sleepBackgroundUrl || null
    } as Character,
    timestamp: Date.now()
  }
}

function applyHomeCharacterFromCache(cached: CachedConversationCharacter) {
  const mapped: HomeCharacterCache = {
    characterId: cached.character.id,
    conversationId: cached.conversationId,
    character: cached.character,
    timestamp: Date.now()
  }

  homeCharacter.value = mapped
  setHomeCharacterCache(mapped)
  updateAndDisplayGreeting()
}

function updateAndDisplayGreeting() {
  const cachedGreeting = getGreetingCache()
  const now = Date.now()

  if (cachedGreeting && !cachedGreeting.used && now - cachedGreeting.timestamp < GREETING_CACHE_DURATION_MS) {
    greetingText.value = cachedGreeting.text
    setGreetingCache({
      ...cachedGreeting,
      used: true
    })
    return
  }

  greetingText.value = getGreeting()
}

async function fetchAndCacheNewGreeting() {
  if (!homeCharacter.value?.conversationId) return

  try {
    const response = await conversationApi.sendMessage(homeCharacter.value.conversationId, GREETING_COMMAND)
    if (response.assistantMessage?.content) {
      setGreetingCache({
        text: response.assistantMessage.content,
        timestamp: Date.now(),
        used: false
      })
    }
  } catch (error) {
    setGreetingCache({
      text: getGreeting(),
      timestamp: Date.now(),
      used: false
    })
  }
}

function startChat(mode: ChatMode) {
  if (!homeCharacter.value) {
    goToCharacters()
    return
  }

  router.push({
    name: 'chat',
    query: {
      characterId: String(homeCharacter.value.character.id),
      conversationId: homeCharacter.value.conversationId ? String(homeCharacter.value.conversationId) : undefined,
      mode
    }
  })
}

function goToCharacters() {
  router.push({ name: 'characters' })
}
</script>

<style scoped lang="scss">
.home-hero {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(23, 31, 46, 0.72), rgba(84, 46, 33, 0.54)),
    linear-gradient(160deg, #8a604f 0%, #1f3552 100%);
  background-size: cover;
  background-position: center;
}

.home-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 11, 18, 0.06), rgba(7, 11, 18, 0.24));
}

.home-hero__content {
  position: relative;
  z-index: 1;
  min-height: 620px;
  display: grid;
  align-items: end;
  padding: 32px;
}

.home-hero__body {
  display: grid;
  gap: 28px;
}

.home-hero__card {
  width: min(100%, 520px);
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-light);
  backdrop-filter: blur(18px);
}

.home-hero__card h2 {
  margin: 8px 0 14px;
  font-size: clamp(28px, 5vw, 42px);
}

.home-hero__card p {
  margin: 0;
  line-height: 1.8;
}

.home-hero__eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-hero__actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.home-hero__main-btn {
  min-width: 160px;
  min-height: 58px;
}

.home-hero__empty {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 16px;
  text-align: center;
  color: var(--text-light);
}

.home-view__nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 720px) {
  .home-hero__content {
    padding: 20px;
  }

  .home-hero__actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .home-hero__main-btn,
  .home-hero__actions .chip-button {
    width: 100%;
  }
}
</style>
