<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { conversationApi } from '../api'
import type { Conversation } from '../types'

const router = useRouter()

const conversations = ref<Conversation[]>([])
const loading = ref(true)
const error = ref('')

onMounted(() => {
  loadConversations()
})

async function loadConversations() {
  loading.value = true
  error.value = ''

  try {
    const result = await conversationApi.getConversations()
    conversations.value = Array.isArray(result) ? result : []
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function openConversation(conv: Conversation) {
  router.push({ path: '/chat', query: { conversationId: String(conv.id) } })
}

async function deleteConversation(conv: Conversation, e: Event) {
  e.stopPropagation()

  if (!confirm(`确定要删除与 ${conv.character?.name || '角色'} 的对话吗？`)) {
    return
  }

  try {
    await conversationApi.deleteConversation(conv.id)
    conversations.value = conversations.value.filter(c => c.id !== conv.id)
  } catch (err: any) {
    alert(err.message || '删除失败')
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <div class="flex items-center px-4 py-3 bg-white border-b border-gray-200 safe-area-top">
      <button class="text-gray-600 mr-3" @click="goBack">←</button>
      <span class="text-lg font-medium">对话历史</span>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-500">
      加载中...
    </div>

    <div v-else-if="error" class="text-center py-20 text-gray-500">
      <p>{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-primary text-white rounded-full"
        @click="loadConversations"
      >
        重试
      </button>
    </div>

    <div v-else-if="conversations.length === 0" class="text-center py-20 text-gray-500">
      暂无对话记录
    </div>

    <div v-else class="p-4">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="flex items-center p-3 bg-white rounded-xl mb-3 shadow-sm cursor-pointer"
        @click="openConversation(conv)"
      >
        <img
          :src="conv.character?.avatarUrl || '/default-avatar.png'"
          :alt="conv.character?.name"
          class="w-12 h-12 rounded-full mr-3 bg-gray-100 object-cover"
        />
        <div class="flex-1 overflow-hidden">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-gray-800">
              {{ conv.character?.name || '未知角色' }}
            </span>
            <span class="text-xs text-gray-400">
              {{ formatTime(conv.lastMessageAt) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 truncate">
              {{ conv.messageCount }} 条消息
            </span>
            <button
              class="text-red-400 text-sm"
              @click="(e) => deleteConversation(conv, e)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}
</style>
