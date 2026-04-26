<template>
  <div class="page-shell chatted-characters-view-page">
    <div class="page-inner chatted-characters-view">
      <OverlayHeader title="聊过的角色" :show-back="false" @back="goBack" />

      <section class="chatted-characters__list">
        <div v-if="loading" class="empty-card glass-panel">正在加载角色...</div>

        <div v-else-if="items.length === 0" class="empty-card glass-panel chatted-characters__empty">
          <p>还没有聊过的角色</p>
          <button class="brand-button" type="button" @click="router.push({ name: 'characters' })">去选角色</button>
        </div>

        <template v-else>
          <article
            v-for="item in items"
            :key="item.id"
            class="chatted-characters__item"
          >
            <button class="chatted-characters__content" type="button" @click="openCharacter(item)">
              <div class="chatted-characters__avatar">
                <img
                  v-if="item.character?.avatarUrl"
                  :src="item.character.avatarUrl"
                  :alt="getCharacterName(item)"
                />
                <span v-else>{{ getCharacterName(item).slice(0, 1) }}</span>
              </div>

              <div class="chatted-characters__meta">
                <div class="chatted-characters__topline">
                  <h2>{{ getCharacterName(item) }}</h2>
                  <time>{{ formatRelativeTime(item.lastMessageAt) || '更早' }}</time>
                </div>

                <div class="chatted-characters__subline">
                  <p class="chatted-characters__summary">{{ item.lastMessagePreview || getCharacterSummary(item.character) }}</p>
                </div>
              </div>
            </button>
          </article>
        </template>
      </section>
    </div>
    <BottomMenu />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomMenu from '@/components/common/BottomMenu.vue'
import OverlayHeader from '@/components/common/OverlayHeader.vue'
import { conversationApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Conversation } from '@/types'
import { getChatSettingsCache, setChatEntryCharacterCache } from '@/utils/cache'
import { getCharacterSummary } from '@/utils/character'
import { formatRelativeTime } from '@/utils/time'

const router = useRouter()
const uiStore = useUiStore()
const items = ref<Conversation[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadChattedCharacters()
})

async function loadChattedCharacters() {
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

function openCharacter(item: Conversation) {
  if (item.character) {
    setChatEntryCharacterCache(item.character)
  }

  router.push({
    name: 'chat',
    query: {
      characterId: String(item.characterId),
      conversationId: String(item.id),
      mode: getChatSettingsCache().chatMode
    }
  })
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
.chatted-characters-view-page {
  padding: 0 0 calc(104px + env(safe-area-inset-bottom));
}

.chatted-characters-view {
  display: grid;
  gap: 16px;
  width: 100%;
}

.chatted-characters__list {
  display: grid;
  gap: 4px;
  padding: 0 16px calc(104px + env(safe-area-inset-bottom));
}

.chatted-characters__empty {
  display: grid;
  gap: 16px;
  place-items: center;
}

.chatted-characters__empty p {
  margin: 0;
}

.chatted-characters__item {
  padding: 0;
}

.chatted-characters__content {
  width: 100%;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  background: transparent;
  color: inherit;
  box-shadow: none;
}

.chatted-characters__avatar {
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

.chatted-characters__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chatted-characters__meta {
  min-width: 0;
}

.chatted-characters__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chatted-characters__topline h2,
.chatted-characters__summary {
  margin: 0;
}

.chatted-characters__topline h2 {
  min-width: 0;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 600;
}

.chatted-characters__topline time,
.chatted-characters__summary {
  color: var(--text-secondary);
}

.chatted-characters__topline time {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1.4;
}

.chatted-characters__subline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.chatted-characters__summary {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .chatted-characters__content {
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 12px;
  }

  .chatted-characters__avatar {
    width: 52px;
    height: 52px;
  }

  .chatted-characters__topline {
    gap: 8px;
  }

  .chatted-characters__topline h2 {
    font-size: 16px;
  }

  .chatted-characters__subline {
    margin-top: 8px;
  }
}
</style>
