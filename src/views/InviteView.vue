<template>
  <div class="page-shell invite-view-page">
    <div class="page-inner invite-view">
      <OverlayHeader title="邀请" @back="goBack" />

      <section class="invite-view__list">
        <div v-if="loading" class="empty-card glass-panel">正在加载角色...</div>

        <div v-else-if="items.length === 0" class="empty-card glass-panel invite-view__empty">
          <p>还没有可邀请的角色</p>
          <button class="brand-button" type="button" @click="router.push({ name: 'characters' })">去选角色</button>
        </div>

        <template v-else>
          <article v-for="item in items" :key="item.id" class="invite-view__item">
            <div class="invite-view__content">
              <div class="invite-view__avatar">
                <img v-if="item.character?.avatarUrl" :src="item.character.avatarUrl" :alt="getCharacterName(item)" />
                <span v-else>{{ getCharacterName(item).slice(0, 1) }}</span>
              </div>

              <div class="invite-view__meta">
                <div class="invite-view__topline">
                  <h2>{{ getCharacterName(item) }}</h2>
                  <button class="invite-view__action" type="button" @click="handleInvite(item)">
                    {{ isPinned(item) ? '已邀请' : '邀请+' }}
                  </button>
                </div>

                <div class="invite-view__subline">
                  <span>好感度 {{ formatFavorability(item.favorabilityScore) }}</span>
                  <span>{{ item.relationshipPhase || '关系培养中' }}</span>
                </div>
              </div>
            </div>
          </article>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import OverlayHeader from '@/components/common/OverlayHeader.vue'
import { characterApi, conversationApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character, Conversation } from '@/types'
import { getHomeCharacterCache, setHomeCharacterCache } from '@/utils/cache'

const router = useRouter()
const uiStore = useUiStore()
const items = ref<Conversation[]>([])
const loading = ref(true)
const pinnedCharacterId = ref<number | null>(getHomeCharacterCache()?.characterId || null)

onMounted(async () => {
  await loadInviteCharacters()
})

async function loadInviteCharacters() {
  loading.value = true

  try {
    items.value = await conversationApi.getConversations()
  } catch (error) {
    uiStore.notify((error as Error).message || '加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function getCharacterName(item: Conversation) {
  return item.character?.name || item.characterName || `角色 #${item.characterId}`
}

function formatFavorability(score: number | null | undefined) {
  return typeof score === 'number' ? score : 0
}

function isPinned(item: Conversation) {
  return pinnedCharacterId.value === item.characterId || Boolean(item.character?.isPinnedToHome)
}

function buildCharacter(item: Conversation) {
  return (
    item.character ||
    ({
      id: item.characterId,
      name: getCharacterName(item),
      avatarUrl: item.characterAvatar || null,
      description: item.lastMessagePreview || null,
      greetingMessage: null,
      chatBackgroundUrl: null,
      sleepBackgroundUrl: null,
      companionBackgroundUrl: null
    } as Character)
  )
}

async function handleInvite(item: Conversation) {
  if (isPinned(item)) {
    uiStore.notify('已邀请', 'success')
    return
  }

  try {
    const result = await characterApi.togglePinToHome(item.characterId)

    if (!result.isPinnedToHome) {
      uiStore.notify('邀请失败', 'error')
      return
    }

    const character = {
      ...buildCharacter(item),
      isPinnedToHome: true
    }

    pinnedCharacterId.value = item.characterId
    items.value = items.value.map((current) => ({
      ...current,
      character: current.character
        ? {
            ...current.character,
            isPinnedToHome: current.characterId === item.characterId
          }
        : current.characterId === item.characterId
          ? character
          : current.character
    }))
    setHomeCharacterCache({
      characterId: item.characterId,
      conversationId: item.id,
      character,
      timestamp: Date.now()
    })
    uiStore.notify('已邀请', 'success')
  } catch (error) {
    uiStore.notify((error as Error).message || '邀请失败', 'error')
  }
}

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
.invite-view-page {
  padding: 0 0 calc(36px + env(safe-area-inset-bottom));
}

.invite-view {
  display: grid;
  gap: 16px;
  width: 100%;
}

.invite-view__list {
  display: grid;
  gap: 4px;
  padding: 0 16px calc(36px + env(safe-area-inset-bottom));
}

.invite-view__empty {
  display: grid;
  gap: 16px;
  place-items: center;
}

.invite-view__empty p {
  margin: 0;
}

.invite-view__item {
  padding: 0;
}

.invite-view__content {
  width: 100%;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 0;
}

.invite-view__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #efc8b6 0%, #d7e6fa 100%);
  color: var(--brand-deep);
  font-size: 28px;
  font-weight: 700;
}

.invite-view__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invite-view__meta {
  min-width: 0;
}

.invite-view__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.invite-view__topline h2 {
  margin: 0;
  min-width: 0;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 600;
}

.invite-view__action {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  font-size: 13px;
  font-weight: 600;
}

.invite-view__subline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .invite-view__content {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .invite-view__avatar {
    width: 52px;
    height: 52px;
  }

  .invite-view__topline h2 {
    font-size: 16px;
  }

  .invite-view__subline {
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
