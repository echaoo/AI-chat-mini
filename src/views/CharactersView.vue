<template>
  <div class="characters-view">
    <header class="characters-view__nav">
      <button class="characters-view__back-button" type="button" aria-label="返回" @click="goBack">
        <img :src="backIcon" alt="" />
      </button>

      <div class="characters-view__summary">
        <h1 class="characters-view__title">{{ currentCharacter?.name || pageTitle }}</h1>
      </div>

      <div class="characters-view__nav-spacer" aria-hidden="true" />
    </header>

    <section v-if="loading" class="characters-view__state-shell">
      <div class="characters-view__state-card">
        <h2>正在加载角色</h2>
        <p>稍等一下，角色卡片马上出现。</p>
      </div>
    </section>

    <section v-else-if="!orderedCharacters.length" class="characters-view__state-shell">
      <div class="characters-view__state-card">
        <h2>暂无可选角色</h2>
        <p>{{ error || '现在还没有可展示的角色。' }}</p>
      </div>
    </section>

    <main
      v-else
      ref="scrollContainer"
      class="characters-view__scroller"
      @scroll.passive="handleScroll"
    >
      <section
        v-for="(character, index) in orderedCharacters"
        :key="character.id"
        class="characters-view__slide"
      >
        <div class="characters-view__slide-inner">
          <article class="characters-view__card" :style="getCardStyle(character)">
            <div class="characters-view__scrim" />

            <div class="characters-view__content">
              <div class="characters-view__topbar">
                <p class="characters-view__watermark">AI 角色</p>

                <div class="characters-view__chips">
                  <span class="characters-view__chip">{{ progressText(index) }}</span>
                  <span class="characters-view__chip">{{ character.isOfficial ? '官方角色' : '自定义角色' }}</span>
                  <span v-if="character.isFavorite" class="characters-view__chip">已收藏</span>
                </div>
              </div>

              <div class="characters-view__main">
                <section class="characters-view__intro-panel">
                  <div class="characters-view__intro-title">介绍</div>
                  <p>{{ getIntroText(character) }}</p>
                </section>

                <section class="characters-view__story-panel">
                  <p>{{ getStoryText(character) }}</p>
                </section>

                <footer class="characters-view__footer">
                  <div class="characters-view__identity">
                    <h2>{{ character.name }}</h2>
                    <p>{{ getMetaText(character) }}</p>
                  </div>

                  <button class="characters-view__invite-button" type="button" @click="openCharacter(character)">
                    邀请聊天
                  </button>
                </footer>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import backIcon from '@/assets/chat/back.png'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character } from '@/types'
import { getChatSettingsCache, setChatEntryCharacterCache } from '@/utils/cache'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const scrollContainer = ref<HTMLElement | null>(null)
const favoriteCharacters = ref<Character[]>([])
const officialCharacters = ref<Character[]>([])
const standaloneCharacter = ref<Character | null>(null)
const currentIndex = ref(0)
const loading = ref(true)
const error = ref('')

const routeCharacterId = computed(() => parsePositiveQuery(route.query.characterId))
const isInviteEntry = computed(() => {
  const from = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  return from === 'home-invite'
})
const orderedCharacters = computed(() => {
  const map = new Map<number, Character>()

  if (standaloneCharacter.value) {
    map.set(standaloneCharacter.value.id, standaloneCharacter.value)
  }

  favoriteCharacters.value.forEach((item) => {
    map.set(item.id, item)
  })

  officialCharacters.value.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item)
    }
  })

  return Array.from(map.values())
})
const currentCharacter = computed(() => orderedCharacters.value[currentIndex.value] || null)
const pageTitle = computed(() => (isInviteEntry.value ? '邀请角色' : '选择角色'))

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await loadCharacters()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

async function loadCharacters() {
  loading.value = true
  error.value = ''

  try {
    const [favorites, official] = await Promise.all([
      characterApi.getFavoriteCharacters().catch(() => []),
      characterApi.getOfficialCharacters()
    ])

    favoriteCharacters.value = favorites
    officialCharacters.value = official

    const knownIds = new Set([...favorites, ...official].map((item) => item.id))
    if (routeCharacterId.value && !knownIds.has(routeCharacterId.value)) {
      standaloneCharacter.value = await characterApi.getCharacterDetail(routeCharacterId.value)
    }

    currentIndex.value = resolveInitialIndex()
    await nextTick()
    scrollToIndex(currentIndex.value, false)
  } catch (loadError) {
    error.value = (loadError as Error).message || '加载失败'
    uiStore.notify(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function resolveInitialIndex() {
  const preferredId =
    routeCharacterId.value ||
    orderedCharacters.value.find((item) => Boolean(item.isPinnedToHome))?.id ||
    orderedCharacters.value[0]?.id ||
    0

  const targetIndex = orderedCharacters.value.findIndex((item) => item.id === preferredId)
  return targetIndex >= 0 ? targetIndex : 0
}

function parsePositiveQuery(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function handleResize() {
  scrollToIndex(currentIndex.value, false)
}

function handleScroll() {
  const container = scrollContainer.value
  if (!container || !orderedCharacters.value.length) return

  const nextIndex = Math.round(container.scrollTop / container.clientHeight)
  currentIndex.value = Math.max(0, Math.min(orderedCharacters.value.length - 1, nextIndex))
}

function scrollToIndex(index: number, smooth: boolean) {
  const container = scrollContainer.value
  if (!container || !orderedCharacters.value.length) return

  const nextIndex = Math.max(0, Math.min(orderedCharacters.value.length - 1, index))
  currentIndex.value = nextIndex
  container.scrollTo({
    top: nextIndex * container.clientHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'home' })
}

function progressText(index: number) {
  return `${index + 1}/${orderedCharacters.value.length}`
}

function getCardCover(character: Character) {
  return character.companionBackgroundUrl || character.chatBackgroundUrl || character.avatarUrl || ''
}

function getCardStyle(character: Character) {
  const cover = getCardCover(character)

  if (!cover) {
    return {
      backgroundImage:
        'radial-gradient(circle at top, rgba(96, 118, 163, 0.34), transparent 30%), linear-gradient(180deg, #313a4b 0%, #121720 42%, #080a0f 100%)'
    }
  }

  return {
    backgroundImage: [
      'linear-gradient(180deg, rgba(8, 10, 16, 0.08) 0%, rgba(8, 10, 16, 0.24) 34%, rgba(8, 10, 16, 0.56) 72%, rgba(8, 10, 16, 0.82) 100%)',
      `url(${cover})`
    ].join(', ')
  }
}

function getIntroText(character: Character) {
  return character.description || character.profileJson?.core_summary || '这位角色已经准备好接受你的邀请。'
}

function getStoryText(character: Character) {
  return (
    character.profileJson?.background_story ||
    character.greetingMessage ||
    character.profileJson?.other_info ||
    character.profileJson?.core_summary ||
    character.description ||
    '点下邀请聊天，直接进入和 TA 的第一段对话。'
  )
}

function getMetaText(character: Character) {
  const parts = [
    character.organization,
    character.speciesType,
    character.isPinnedToHome ? '首页角色' : '',
    character.isOfficial ? '官方设定' : '自定义设定'
  ].filter(Boolean)

  return parts.join(' · ')
}

function openCharacter(character: Character) {
  setChatEntryCharacterCache(character)

  router.push({
    name: 'chat',
    query: {
      characterId: String(character.id),
      mode: getChatSettingsCache().chatMode
    }
  })
}
</script>

<style scoped lang="scss">
.characters-view {
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at top, rgba(38, 47, 71, 0.5), transparent 34%),
    linear-gradient(180deg, #151922 0%, #0b0d12 54%, #050607 100%);
  color: rgba(255, 255, 255, 0.96);
}

.characters-view__nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: calc(env(safe-area-inset-top) + 10px) 16px 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.12));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(24px) saturate(130%);
}

.characters-view__back-button,
.characters-view__nav-spacer {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.characters-view__back-button {
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
}

.characters-view__back-button img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  opacity: 0.92;
}

.characters-view__summary {
  flex: 1;
  min-width: 0;
}

.characters-view__title {
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

.characters-view__scroller {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  overscroll-behavior-y: contain;
}

.characters-view__scroller::-webkit-scrollbar {
  display: none;
}

.characters-view__slide {
  min-height: 100vh;
  min-height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.characters-view__slide-inner {
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top)) 0 calc(env(safe-area-inset-bottom) + 24px);
  display: grid;
  place-items: stretch center;
}

.characters-view__card {
  position: relative;
  width: min(100%, 560px);
  height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  min-height: 620px;
  overflow: hidden;
  background-color: #11151d;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.3);
}

.characters-view__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 16%),
    linear-gradient(180deg, rgba(6, 8, 12, 0.02), rgba(6, 8, 12, 0.1) 28%, rgba(6, 8, 12, 0.44) 70%, rgba(6, 8, 12, 0.76) 100%);
}

.characters-view__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 18px 20px;
}

.characters-view__topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.characters-view__watermark {
  margin: 0;
  width: 18px;
  font-size: 12px;
  line-height: 1.25;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.72);
  writing-mode: vertical-rl;
}

.characters-view__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.characters-view__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(9, 12, 18, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.94);
}

.characters-view__main {
  margin-top: auto;
  display: grid;
  gap: 16px;
}

.characters-view__intro-panel {
  padding: 18px 18px 16px;
  border-radius: 24px;
  background: rgba(5, 7, 11, 0.82);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(14px);
}

.characters-view__intro-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
}

.characters-view__intro-panel p,
.characters-view__story-panel p {
  margin: 0;
  line-height: 1.75;
}

.characters-view__intro-panel p {
  display: -webkit-box;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.94);
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.characters-view__story-panel {
  padding: 22px 20px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  color: #1d2230;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
}

.characters-view__story-panel p {
  display: -webkit-box;
  overflow: hidden;
  font-size: clamp(17px, 3.8vw, 20px);
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
}

.characters-view__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.characters-view__identity {
  min-width: 0;
}

.characters-view__identity h2 {
  margin: 0;
  font-size: clamp(34px, 7vw, 42px);
  line-height: 1.05;
  text-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.characters-view__identity p {
  margin: 10px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.6;
}

.characters-view__invite-button {
  min-height: 48px;
  flex-shrink: 0;
  padding: 0 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #12151d;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
}

.characters-view__state-shell {
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(env(safe-area-inset-top) + 108px) 16px calc(env(safe-area-inset-bottom) + 24px);
  display: grid;
  place-items: center;
}

.characters-view__state-card {
  width: min(100%, 520px);
  padding: 32px 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.08);
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(18px);
}

.characters-view__state-card h2 {
  margin: 0;
  font-size: 28px;
}

.characters-view__state-card p {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.7;
}

.characters-view__hint {
  position: fixed;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  z-index: 8;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(18px);
}

@media (max-width: 640px) {
  .characters-view__card {
    min-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 116px);
  }
}

@media (max-width: 480px) {
  .characters-view__content {
    padding: 18px 16px 18px;
  }

  .characters-view__story-panel p {
    -webkit-line-clamp: 7;
  }

  .characters-view__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .characters-view__invite-button {
    width: 100%;
  }
}
</style>
