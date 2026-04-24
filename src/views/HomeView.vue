<template>
  <div class="page-shell home-view">
    <div class="page-inner home-stage" :style="heroStyle">
      <div class="home-stage__mist home-stage__mist--left" />
      <div class="home-stage__mist home-stage__mist--right" />
      <div class="home-stage__grain" />

      <div v-if="loading" class="home-loading" aria-label="加载中">
        <span class="home-loading__ring" />
      </div>

      <template v-else-if="homeCharacter">
        <header class="home-stage__topbar">
          <section class="home-identity">
            <h1 class="home-identity__name">{{ homeCharacter.character.name }}</h1>
            <div class="home-identity__affection">
              <span class="home-identity__affection-label">好感度 {{ affectionValue }}</span>
              <div class="home-identity__meter">
                <span class="home-identity__meter-fill" :style="{ width: `${affectionValue}%` }" />
              </div>
            </div>
          </section>

          <button class="home-invite" type="button" @click="handleInvite" aria-label="邀请">邀请 +</button>
        </header>

        <main class="home-stage__body">
          <section class="home-drama">
            <div class="home-drama__dialog glass-panel">
              <div
                class="home-drama__avatar"
                :style="messageAvatarStyle"
                aria-hidden="true"
              />
              <p class="home-drama__greeting">{{ greetingText }}</p>
            </div>

            <div class="home-drama__actions">
              <button class="home-action home-action--sleep" type="button" @click="openFeature('哄睡')">
                <span class="home-action__main">哄睡</span>
              </button>
              <button class="home-action home-action--chat" type="button" @click="startChat()">
                <span class="home-action__main">聊天</span>
              </button>
              <button class="home-action home-action--story" type="button" @click="openFeature('剧情')">
                <span class="home-action__main">剧情</span>
              </button>
            </div>
          </section>
        </main>

        <nav class="home-dock glass-panel" aria-label="底部导航">
          <button class="home-dock__item" type="button" @click="goToCharacters">
            <span class="home-dock__label">发现</span>
          </button>
          <button class="home-dock__item" type="button" @click="goToChat">
            <span class="home-dock__label">聊天</span>
          </button>
          <button class="home-dock__item home-dock__item--active" type="button">
            <span class="home-dock__label">首页</span>
          </button>
          <button class="home-dock__item" type="button" @click="goToMe">
            <span class="home-dock__label">我的</span>
          </button>
        </nav>
      </template>

      <section v-else class="home-empty glass-panel">
        <p class="home-empty__eyebrow">尚未设定首页角色</p>
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
import type { Character, ChatMode, PinnedCharacterSummary } from '@/types'
import {
  clearHomeCharacterCache,
  getChatSettingsCache,
  getGreetingCache,
  getHomeCharacterCache,
  setChatEntryCharacterCache,
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

const messageAvatarStyle = computed(() => {
  const cover = getCharacterCover(homeCharacter.value?.character)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `url(${cover})`
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
  const cached = getHomeCharacterCache()
  loading.value = !cached

  if (cached) {
    homeCharacter.value = cached
    updateAndDisplayGreeting()
    loading.value = false
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

function startChat(mode: ChatMode = getChatSettingsCache().chatMode) {
  if (!homeCharacter.value) {
    goToCharacters()
    return
  }

  const currentCharacter = homeCharacter.value.character
  setChatEntryCharacterCache(currentCharacter)

  router.push({
    name: 'chat',
    query: {
      characterId: String(currentCharacter.id),
      conversationId: homeCharacter.value.conversationId ? String(homeCharacter.value.conversationId) : undefined,
      mode
    }
  })
}

function openFeature(name: string) {
  uiStore.notify(`${name}入口已预留，后续会接入独立玩法`, 'info')
}

function handleInvite() {
  router.push({
    name: 'characters',
    query: { from: 'home-invite' }
  })
}

function goToChat() {
  startChat()
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
  padding: 0;
}

.home-stage {
  position: relative;
  height: 100dvh;
  min-height: 100dvh;
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
  border-radius: 28px 28px 0 0;
}

.home-stage__topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 56px 24px 0;
}

.home-identity {
  width: min(100%, 360px);
  color: rgba(255, 244, 239, 0.92);
  text-shadow: 0 4px 18px rgba(10, 6, 12, 0.36);
}

.home-identity__label,
.home-action__sub,
.home-empty__eyebrow,
.home-dock__icon {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.18em;
}

.home-identity__name {
  margin: 10px 0 14px;
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
  width: min(220px, 52vw);
  background: rgba(255, 255, 255, 0.22);
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
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  color: rgba(255, 247, 243, 0.94);
  text-shadow: 0 4px 18px rgba(10, 6, 12, 0.36);
}

.home-invite__main {
  font-family: 'Songti SC', 'STSong', serif;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.home-stage__body {
  display: flex;
  align-items: center;
  min-height: 0;
  height: calc(100% - 148px);
  padding: 12px 24px 96px;
}

.home-drama {
  width: min(100%, 520px);
  display: grid;
  gap: 24px;
}

.home-drama__dialog {
  position: relative;
  padding: 22px 24px 22px 30px;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 244, 238, 0.18);
  color: rgba(255, 247, 242, 0.94);
  box-shadow: 0 16px 34px rgba(16, 10, 18, 0.18);
  overflow: visible;
}

.home-drama__avatar {
  position: absolute;
  top: -14px;
  left: -14px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background:
    linear-gradient(135deg, rgba(255, 239, 230, 0.88), rgba(238, 205, 188, 0.74));
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 245, 240, 0.82);
  box-shadow:
    0 0 0 10px rgba(255, 247, 242, 0.08),
    0 10px 22px rgba(15, 9, 15, 0.2);
}

.home-drama__greeting {
  margin: 0;
  padding-top: 12px;
  font-size: 16px;
  line-height: 1.9;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(8, 5, 10, 0.22);
}

.home-drama__actions {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr) minmax(0, 0.9fr);
  gap: 14px;
  align-items: end;
}

.home-action {
  display: grid;
  place-items: center;
  min-height: 110px;
  padding: 18px 16px 20px;
  border-radius: 30px;
  background: rgba(255, 246, 241, 0.08);
  border: 1px solid rgba(255, 242, 236, 0.16);
  backdrop-filter: blur(18px);
  color: rgba(255, 248, 244, 0.96);
  text-align: center;
  box-shadow: 0 18px 38px rgba(25, 16, 20, 0.16);
}

.home-action--chat {
  min-height: 132px;
  padding: 22px 20px 24px;
  background: rgba(255, 247, 241, 0.12);
  border-color: rgba(255, 240, 234, 0.24);
  box-shadow: 0 22px 44px rgba(25, 16, 20, 0.2);
}

.home-action__main {
  font-family: 'Songti SC', 'STSong', serif;
  font-size: clamp(22px, 4.5vw, 28px);
  line-height: 1.1;
}

.home-action--chat .home-action__main {
  font-size: clamp(28px, 5.2vw, 36px);
}

.home-dock {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(4, minmax(72px, 1fr));
  gap: 10px;
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

.home-loading {
  position: relative;
  z-index: 1;
  width: min(100%, 520px);
  min-height: 220px;
  margin: 120px auto 0;
  display: grid;
  place-items: center;
}

.home-loading__ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 244, 238, 0.26);
  border-top-color: rgba(255, 244, 238, 0.92);
  animation: home-loading-spin 0.9s linear infinite;
}

.home-empty {
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

@keyframes home-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 780px) {
  .home-view {
    padding: 0;
  }

  .home-stage {
    height: 100dvh;
    min-height: 100dvh;
    border-radius: 0;
  }

  .home-stage__topbar,
  .home-stage__body {
    padding-inline: 16px;
    padding-bottom: 164px;
  }

  .home-stage__topbar {
    padding-top: 42px;
    align-items: stretch;
  }

  .home-stage__body {
    height: calc(100% - 132px);
    padding-bottom: 96px;
  }

  .home-drama {
    width: 100%;
  }

  .home-drama__actions {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 10px;
  }

  .home-action {
    min-height: 88px;
    padding: 14px 12px 16px;
    border-radius: 24px;
  }

  .home-drama__avatar {
    top: -12px;
    left: -10px;
    width: 42px;
    height: 42px;
  }

  .home-action--chat {
    min-height: 104px;
    padding: 18px 14px 20px;
  }

  .home-action__sub {
    font-size: 9px;
  }

  .home-action__main {
    font-size: clamp(18px, 4.8vw, 22px);
  }

  .home-action--chat .home-action__main {
    font-size: clamp(22px, 5.4vw, 28px);
  }

  .home-dock {
    bottom: calc(env(safe-area-inset-bottom));
  }
}
</style>
