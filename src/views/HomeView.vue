<template>
  <div class="page-shell home-view">
    <div class="page-inner home-stage" :style="heroStyle">
      <div class="home-stage__mist home-stage__mist--left" />
      <div class="home-stage__mist home-stage__mist--right" />
      <div class="home-stage__grain" />

      <div v-if="loading" class="home-loading glass-panel">
        正在唤醒今日陪伴剧情...
      </div>

      <template v-else-if="homeCharacter">
        <header class="home-stage__topbar">
          <section class="home-identity glass-panel">
            <p class="home-identity__label">Current Route</p>
            <h1 class="home-identity__name">{{ homeCharacter.character.name }}</h1>
            <div class="home-identity__affection">
              <span class="home-identity__affection-label">好感度 {{ affectionValue }}</span>
              <div class="home-identity__meter">
                <span class="home-identity__meter-fill" :style="{ width: `${affectionValue}%` }" />
              </div>
            </div>
          </section>

          <button class="home-invite" type="button" @click="handleInvite">
            <span class="home-invite__sub">Side Story</span>
            <span class="home-invite__main">邀请</span>
          </button>
        </header>

        <main class="home-stage__body">
          <section class="home-drama">
            <div class="home-drama__dialog glass-panel">
              <p class="home-drama__lead">今日密语</p>
              <p class="home-drama__greeting">{{ greetingText }}</p>
            </div>

            <div class="home-drama__actions">
              <button class="home-action home-action--chat" type="button" @click="startChat('normal')">
                <span class="home-action__sub">Main Route</span>
                <span class="home-action__main">开始聊天</span>
              </button>
              <button class="home-action home-action--sleep" type="button" @click="openFeature('哄睡')">
                <span class="home-action__sub">Night Whisper</span>
                <span class="home-action__main">哄睡</span>
              </button>
              <button class="home-action home-action--story" type="button" @click="openFeature('剧情')">
                <span class="home-action__sub">Branch Story</span>
                <span class="home-action__main">剧情</span>
              </button>
            </div>
          </section>
        </main>

        <nav class="home-dock glass-panel" aria-label="底部导航">
          <button class="home-dock__item" type="button" @click="goToChat">
            <span class="home-dock__icon">CHAT</span>
            <span class="home-dock__label">聊天</span>
          </button>
          <button class="home-dock__item home-dock__item--active" type="button">
            <span class="home-dock__icon">HOME</span>
            <span class="home-dock__label">Home</span>
          </button>
          <button class="home-dock__item" type="button" @click="goToMe">
            <span class="home-dock__icon">ME</span>
            <span class="home-dock__label">我的</span>
          </button>
        </nav>
      </template>

      <section v-else class="home-empty glass-panel">
        <p class="home-empty__eyebrow">No Partner Assigned</p>
        <h2>还没有首页角色</h2>
        <p>先去选择一位你想常驻首页的角色，再回来进入乙游式主界面。</p>
        <button class="brand-button" type="button" @click="goToCharacters">去选角色</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
    return {
      background:
        'radial-gradient(circle at top, rgba(255, 228, 214, 0.88), transparent 34%), linear-gradient(160deg, #221a25 0%, #4f3240 55%, #d9c0b1 100%)'
    }
  }

  return {
    backgroundImage: [
      'linear-gradient(180deg, rgba(18, 12, 20, 0.18) 0%, rgba(18, 12, 20, 0.52) 48%, rgba(18, 12, 20, 0.78) 100%)',
      'radial-gradient(circle at top, rgba(255, 226, 210, 0.22), transparent 32%)',
      `url(${cover})`
    ].join(', ')
  }
})

const affectionValue = computed(() => {
  const character = homeCharacter.value?.character
  if (!character) return 0

  if (typeof character.likeCount === 'number' && character.likeCount > 0) {
    return Math.max(48, Math.min(99, character.likeCount))
  }

  if (typeof character.messageCount === 'number' && character.messageCount > 0) {
    return Math.max(42, Math.min(96, character.messageCount * 6))
  }

  return character.isFavorite ? 88 : 76
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

function openFeature(name: string) {
  uiStore.notify(`${name}入口已预留，后续会接入独立玩法`, 'info')
}

function handleInvite() {
  uiStore.notify('邀请入口已预留，后续可接入分享或共创玩法', 'info')
}

function goToChat() {
  startChat('normal')
}

function goToCharacters() {
  router.push({ name: 'characters' })
}

function goToMe() {
  router.push({ name: 'me' })
}
</script>

<style scoped lang="scss">
.home-view {
  padding-bottom: calc(132px + env(safe-area-inset-bottom));
}

.home-stage {
  position: relative;
  min-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 38px;
  background-size: cover;
  background-position: center top;
  box-shadow: 0 28px 90px rgba(18, 12, 20, 0.24);
}

.home-stage__mist,
.home-stage__grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-stage__mist--left {
  background: radial-gradient(circle at 0% 0%, rgba(255, 233, 219, 0.22), transparent 36%);
}

.home-stage__mist--right {
  background: radial-gradient(circle at 100% 20%, rgba(250, 216, 224, 0.18), transparent 28%);
}

.home-stage__grain {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 22px 22px;
  mix-blend-mode: soft-light;
  opacity: 0.42;
}

.home-stage__topbar,
.home-stage__body,
.home-dock {
  position: relative;
  z-index: 1;
}

.home-stage__topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 0;
}

.home-identity {
  width: min(100%, 360px);
  padding: 20px 22px;
  background: rgba(24, 18, 24, 0.28);
  border-color: rgba(255, 242, 234, 0.22);
  color: rgba(255, 244, 239, 0.92);
}

.home-identity__label,
.home-action__sub,
.home-invite__sub,
.home-empty__eyebrow,
.home-drama__lead,
.home-dock__icon {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-identity__name {
  margin: 10px 0 16px;
  font-family: 'Songti SC', 'STSong', serif;
  font-size: clamp(30px, 6vw, 44px);
  font-weight: 600;
  line-height: 1.05;
}

.home-identity__affection {
  display: grid;
  gap: 10px;
}

.home-identity__affection-label {
  font-size: 14px;
  letter-spacing: 0.08em;
}

.home-identity__meter {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.home-identity__meter-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffe2cb 0%, #f9a77e 52%, #f06d79 100%);
  box-shadow: 0 0 14px rgba(240, 109, 121, 0.5);
}

.home-invite {
  display: grid;
  gap: 6px;
  align-items: center;
  min-width: 112px;
  padding: 14px 18px;
  border-radius: 22px;
  background: rgba(255, 248, 242, 0.16);
  border: 1px solid rgba(255, 243, 236, 0.28);
  color: rgba(255, 247, 243, 0.94);
  backdrop-filter: blur(18px);
  text-align: center;
}

.home-invite__main {
  font-family: 'Songti SC', 'STSong', serif;
  font-size: 24px;
}

.home-stage__body {
  display: flex;
  align-items: flex-end;
  min-height: calc(100vh - 210px);
  padding: 24px;
}

.home-drama {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
}

.home-drama__dialog {
  padding: 20px 22px;
  background: linear-gradient(180deg, rgba(255, 249, 244, 0.8), rgba(253, 242, 236, 0.58));
  border-color: rgba(255, 255, 255, 0.46);
  color: #3b2731;
}

.home-drama__greeting {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.85;
}

.home-drama__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.home-action {
  display: grid;
  gap: 8px;
  min-height: 118px;
  padding: 18px 18px 20px;
  border-radius: 28px;
  color: rgba(255, 248, 244, 0.96);
  text-align: left;
  box-shadow: 0 20px 48px rgba(25, 16, 20, 0.24);
}

.home-action--chat {
  background: linear-gradient(160deg, rgba(184, 102, 85, 0.9), rgba(94, 46, 41, 0.94));
}

.home-action--sleep {
  background: linear-gradient(160deg, rgba(71, 77, 126, 0.88), rgba(31, 37, 71, 0.94));
}

.home-action--story {
  background: linear-gradient(160deg, rgba(126, 94, 150, 0.88), rgba(58, 32, 68, 0.94));
}

.home-action__main {
  font-family: 'Songti SC', 'STSong', serif;
  font-size: clamp(22px, 4.5vw, 28px);
  line-height: 1.1;
}

.home-dock {
  position: absolute;
  left: 50%;
  right: auto;
  bottom: calc(18px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(88px, 1fr));
  gap: 10px;
  width: min(calc(100% - 28px), 420px);
  padding: 12px;
  background: rgba(26, 18, 26, 0.46);
  border-color: rgba(255, 242, 236, 0.16);
}

.home-dock__item {
  display: grid;
  gap: 6px;
  place-items: center;
  min-height: 64px;
  border-radius: 22px;
  background: transparent;
  color: rgba(255, 245, 238, 0.78);
}

.home-dock__item--active {
  background: rgba(255, 246, 241, 0.14);
  color: #fff8f3;
}

.home-dock__label {
  font-size: 14px;
  letter-spacing: 0.04em;
}

.home-empty,
.home-loading {
  position: relative;
  z-index: 1;
  width: min(100%, 520px);
  margin: 120px auto 0;
  padding: 28px;
  text-align: center;
}

.home-empty h2,
.home-empty p {
  margin: 0;
}

.home-empty h2 {
  margin-top: 10px;
  font-family: 'Songti SC', 'STSong', serif;
  font-size: 32px;
}

.home-empty p {
  margin: 14px 0 22px;
  line-height: 1.8;
  color: var(--text-secondary);
}

@media (max-width: 780px) {
  .home-view {
    padding: 0;
  }

  .home-stage {
    min-height: 100vh;
    border-radius: 0;
  }

  .home-stage__topbar,
  .home-stage__body {
    padding-inline: 16px;
  }

  .home-stage__topbar {
    padding-top: 18px;
    align-items: stretch;
  }

  .home-drama {
    width: 100%;
  }

  .home-drama__actions {
    grid-template-columns: 1fr;
  }

  .home-action {
    min-height: 96px;
  }

  .home-dock {
    width: calc(100% - 18px);
    bottom: calc(10px + env(safe-area-inset-bottom));
  }
}
</style>
