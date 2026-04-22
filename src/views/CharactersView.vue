<template>
  <div class="characters-view">
    <header class="characters-view__nav-shell">
      <div class="characters-view__nav-inner">
        <div class="characters-view__nav">
          <button class="characters-view__back-button" type="button" aria-label="返回" @click="goBack">
            <img :src="backIcon" alt="" />
          </button>

          <div class="characters-view__summary">
            <p class="characters-view__label">{{ pageTitle }}</p>
            <h1 class="characters-view__title">{{ currentCharacter?.name || pageTitle }}</h1>
          </div>

          <div class="characters-view__counter" aria-label="当前角色进度">
            {{ progressLabel }}
          </div>
        </div>
      </div>
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
              <p class="characters-view__watermark">AI 角色</p>

              <div class="characters-view__badges">
                <span class="characters-view__badge">{{ character.isOfficial ? '官方角色' : '自定义角色' }}</span>
                <span v-if="character.isFavorite" class="characters-view__badge">已收藏</span>
                <span v-if="character.isPinnedToHome" class="characters-view__badge">首页角色</span>
              </div>

              <div class="characters-view__main">
                <div class="characters-view__intro">
                  <strong>介绍</strong>
                  <p>{{ getIntroText(character) }}</p>
                </div>

                <div class="characters-view__story">
                  {{ getStoryText(character) }}
                </div>

                <footer class="characters-view__footer">
                  <div class="characters-view__identity">
                    <h2>{{ character.name }}</h2>
                    <p>{{ getMetaText(character) }}</p>
                  </div>

                  <div class="characters-view__actions">
                    <button class="characters-view__ghost-action" type="button" @click="scrollToIndex(index - 1, true)">
                      上一个
                    </button>
                    <button class="characters-view__ghost-action" type="button" @click="scrollToIndex(index + 1, true)">
                      下一个
                    </button>
                    <button class="characters-view__invite-button" type="button" @click="openCharacter(character)">
                      邀请聊天
                    </button>
                  </div>
                </footer>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <div v-if="orderedCharacters.length > 1 && !loading" class="characters-view__hint">
      上下滑动切换角色
    </div>
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
import { getCharacterCover } from '@/utils/character'

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
const progressLabel = computed(() => {
  if (!orderedCharacters.value.length) return '--'
  return `${currentIndex.value + 1}/${orderedCharacters.value.length}`
})

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

function getCardStyle(character: Character) {
  const cover = getCharacterCover(character)

  if (!cover) {
    return {
      background:
        'radial-gradient(circle at top, rgba(99, 120, 164, 0.3), transparent 34%), linear-gradient(180deg, #18202d 0%, #0b0d12 100%)'
    }
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(7, 10, 18, 0.18) 0%, rgba(7, 10, 18, 0.42) 48%, rgba(7, 10, 18, 0.84) 100%), url(${cover})`
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
    radial-gradient(circle at top, rgba(43, 51, 74, 0.48), transparent 36%),
    linear-gradient(180deg, #14171f 0%, #0a0c11 52%, #040506 100%);
  color: rgba(255, 255, 255, 0.96);
}

.characters-view__nav-shell {
  position: fixed;
  inset: 0 0 auto;
  z-index: 10;
  pointer-events: none;
}

.characters-view__nav-inner,
.characters-view__slide-inner {
  width: min(100%, 560px);
  margin: 0 auto;
}

.characters-view__nav {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: calc(env(safe-area-inset-top) + 10px) 12px 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(24px) saturate(130%);
}

.characters-view__back-button,
.characters-view__counter {
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

.characters-view__label {
  margin: 0 0 4px;
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.66);
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

.characters-view__counter {
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

.characters-view__scroller {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
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
  padding: calc(env(safe-area-inset-top) + 84px) 16px calc(env(safe-area-inset-bottom) + 24px);
  display: flex;
}

.characters-view__card {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 34px;
  background-color: #11151d;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.28);
}

.characters-view__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.14) 30%, rgba(0, 0, 0, 0.48) 72%, rgba(0, 0, 0, 0.7) 100%);
}

.characters-view__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 18px 20px;
}

.characters-view__watermark {
  margin: 0;
  width: 18px;
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.72);
  writing-mode: vertical-rl;
}

.characters-view__badges {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.characters-view__badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(8, 12, 20, 0.58);
  backdrop-filter: blur(12px);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

.characters-view__main {
  margin-top: auto;
  display: grid;
  gap: 16px;
}

.characters-view__intro {
  padding: 18px 18px 16px;
  border-radius: 24px;
  background: rgba(6, 8, 12, 0.84);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(14px);
}

.characters-view__intro strong {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 14px;
}

.characters-view__intro p,
.characters-view__story {
  margin: 0;
  line-height: 1.75;
}

.characters-view__intro p {
  display: -webkit-box;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.94);
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.characters-view__story {
  padding: 22px 20px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  color: #202531;
  font-size: clamp(17px, 3.8vw, 20px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.16);
  display: -webkit-box;
  overflow: hidden;
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
}

.characters-view__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.characters-view__ghost-action,
.characters-view__invite-button {
  min-height: 48px;
  border-radius: 999px;
  padding: 0 18px;
}

.characters-view__ghost-action {
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.characters-view__invite-button {
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
  color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

@media (max-width: 420px) {
  .characters-view__slide-inner {
    padding-inline: 12px;
  }

  .characters-view__content {
    padding-inline: 16px;
  }

  .characters-view__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .characters-view__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
