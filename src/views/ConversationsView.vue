<template>
  <div class="page-shell">
    <div class="page-inner">
      <ViewHeader
        eyebrow="历史记录"
        title="对话历史"
        description="继续上一次的聊天，或者清理不需要的对话。"
      >
        <template #actions>
          <RouterLink class="ghost-button" to="/">首页</RouterLink>
          <RouterLink class="ghost-button" to="/characters">换角色</RouterLink>
        </template>
      </ViewHeader>

      <section class="conversations-view__list">
        <div v-if="loading" class="empty-card glass-panel">正在加载对话...</div>
        <div v-else-if="conversations.length === 0" class="empty-card glass-panel">
          暂无对话记录
        </div>
        <article
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversations-view__item glass-panel"
        >
          <button class="conversations-view__content" type="button" @click="openConversation(conversation.id, conversation.character?.id || conversation.characterId)">
            <div class="conversations-view__avatar">
              <img v-if="conversation.character?.avatarUrl" :src="conversation.character.avatarUrl" :alt="conversation.character?.name" />
              <span v-else>{{ (conversation.character?.name || 'A').slice(0, 1) }}</span>
            </div>
            <div class="conversations-view__meta">
              <div class="conversations-view__topline">
                <h2>{{ conversation.character?.name || `角色 #${conversation.characterId}` }}</h2>
                <time>{{ formatRelativeTime(conversation.lastMessageAt) }}</time>
              </div>
              <p>{{ conversation.messageCount }} 条消息</p>
            </div>
          </button>
          <button class="danger-button" type="button" @click="removeConversation(conversation.id)">删除</button>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ViewHeader from '@/components/common/ViewHeader.vue'
import { conversationApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Conversation } from '@/types'
import { formatRelativeTime } from '@/utils/time'

const router = useRouter()
const uiStore = useUiStore()
const conversations = ref<Conversation[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadConversations()
})

async function loadConversations() {
  loading.value = true

  try {
    conversations.value = await conversationApi.getConversations()
  } catch (error) {
    uiStore.notify((error as Error).message || '加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function openConversation(conversationId: number, characterId: number) {
  router.push({
    name: 'chat',
    query: {
      characterId: String(characterId),
      conversationId: String(conversationId)
    }
  })
}

async function removeConversation(conversationId: number) {
  const confirmed = window.confirm('删除后无法恢复，确定要删除这个对话吗？')
  if (!confirmed) return

  try {
    await conversationApi.deleteConversation(conversationId)
    conversations.value = conversations.value.filter((item) => item.id !== conversationId)
    uiStore.notify('删除成功', 'success')
  } catch (error) {
    uiStore.notify((error as Error).message || '删除失败', 'error')
  }
}
</script>

<style scoped lang="scss">
.conversations-view__list {
  display: grid;
  gap: 14px;
}

.conversations-view__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
}

.conversations-view__content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  background: transparent;
  color: inherit;
  padding: 0;
}

.conversations-view__avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #efc8b6 0%, #d7e6fa 100%);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--brand-deep);
}

.conversations-view__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conversations-view__meta {
  min-width: 0;
  flex: 1;
}

.conversations-view__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.conversations-view__topline h2,
.conversations-view__meta p {
  margin: 0;
}

.conversations-view__topline time,
.conversations-view__meta p {
  color: var(--text-secondary);
}

@media (max-width: 720px) {
  .conversations-view__item {
    flex-direction: column;
    align-items: stretch;
  }

  .danger-button {
    width: 100%;
  }
}
</style>
