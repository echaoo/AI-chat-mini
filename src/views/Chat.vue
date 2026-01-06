<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MessageBubble from '../components/MessageBubble.vue'
import { characterApi, conversationApi } from '../api'
import { storage, STORAGE_KEYS } from '../utils/storage'
import type { Character, Message, ChatMode } from '../types'

const route = useRoute()
const router = useRouter()

const characterId = ref(0)
const conversationId = ref(0)
const character = ref<Character | null>(null)
const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(true)
const sending = ref(false)
const isPinned = ref(false)
const messageListRef = ref<HTMLElement | null>(null)
const chatMode = ref<ChatMode>('normal')

onMounted(() => {
  const queryConvId = route.query.conversationId as string
  const queryCharId = route.query.characterId as string
  const initialMessage = route.query.initialMessage as string

  if (queryConvId) {
    conversationId.value = parseInt(queryConvId)
    loadExistingConversation()

    if (initialMessage) {
      setTimeout(() => {
        inputText.value = decodeURIComponent(initialMessage)
        handleSend()
      }, 500)
    }
  } else if (queryCharId) {
    characterId.value = parseInt(queryCharId)
    init()
  } else {
    alert('参数错误')
    router.back()
  }
})

onUnmounted(() => {
  storage.remove(STORAGE_KEYS.GREETING_CACHE)
})

async function init() {
  try {
    loading.value = true
    character.value = await characterApi.getCharacterDetail(characterId.value)

    const conversation = await conversationApi.createConversation(characterId.value)
    conversationId.value = conversation.id

    if (conversation.messages?.length > 0) {
      messages.value = conversation.messages.map((msg) => ({
        id: msg.id,
        conversationId: conversationId.value,
        role: msg.role,
        content: msg.content,
        tokens: null,
        createdAt: msg.createdAt
      }))
    } else {
      messages.value = [{
        id: 0,
        conversationId: conversationId.value,
        role: 'assistant',
        content: character.value.greetingMessage || '你好',
        tokens: null,
        createdAt: new Date().toISOString()
      }]
    }

    loading.value = false
    checkIfPinned()
    scrollToBottom()
  } catch (err: any) {
    alert(err.message || '初始化失败')
    loading.value = false
  }
}

async function loadExistingConversation() {
  try {
    loading.value = true
    const response = await conversationApi.getConversationMessages(conversationId.value)

    character.value = {
      id: response.character.id,
      name: response.character.name,
      avatarUrl: response.character.avatarUrl,
      description: null,
      greetingMessage: null,
      systemPrompt: '',
      isOfficial: 1,
      isActive: 1,
      sortOrder: 0,
      createdAt: '',
      updatedAt: ''
    }
    characterId.value = response.character.id
    messages.value = response.messages || []

    loading.value = false
    checkIfPinned()
    scrollToBottom()
  } catch (err: any) {
    alert(err.message || '加载失败')
    loading.value = false
  }
}

function handleInput(e: Event) {
  inputText.value = (e.target as HTMLInputElement).value
}

async function handleSend() {
  const content = inputText.value.trim()
  if (!content || sending.value) return

  const userMessage: Message = {
    id: Date.now(),
    conversationId: conversationId.value,
    role: 'user',
    content: content,
    tokens: null,
    createdAt: new Date().toISOString()
  }

  messages.value = [...messages.value, userMessage]
  inputText.value = ''
  sending.value = true
  scrollToBottom()

  try {
    const response = await conversationApi.sendMessage(conversationId.value, content, chatMode.value)
    messages.value = [...messages.value, response.assistantMessage]
    scrollToBottom()
  } catch (err: any) {
    alert(err.message || '发送失败')
  } finally {
    sending.value = false
  }
}

function toggleChatMode() {
  const newMode: ChatMode = chatMode.value === 'normal' ? 'romantic' : 'normal'
  chatMode.value = newMode

  // 添加系统消息提示
  const systemMessage: Message = {
    id: Date.now(),
    conversationId: conversationId.value,
    role: 'system',
    content: newMode === 'romantic' ? '已切换到心动模式' : '已切换到基础模式',
    tokens: null,
    createdAt: new Date().toISOString()
  }
  messages.value = [...messages.value, systemMessage]
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function checkIfPinned() {
  const cached = storage.get<any>(STORAGE_KEYS.HOME_CHARACTER)
  isPinned.value = cached?.characterId === characterId.value
}

async function handlePinToHome() {
  if (!character.value || !characterId.value) {
    alert('角色信息加载中...')
    return
  }

  try {
    const result = await characterApi.togglePinToHome(characterId.value)
    isPinned.value = result.isPinnedToHome

    if (result.isPinnedToHome) {
      storage.set(STORAGE_KEYS.HOME_CHARACTER, {
        characterId: characterId.value,
        conversationId: conversationId.value || null,
        character: {
          id: character.value.id,
          name: character.value.name,
          avatarUrl: character.value.avatarUrl,
          description: character.value.description
        },
        timestamp: Date.now()
      })
      alert('已固定到首页')
    } else {
      storage.remove(STORAGE_KEYS.HOME_CHARACTER)
      alert('已取消固定')
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- 顶部导航 -->
    <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 safe-area-top">
      <div class="flex items-center">
        <button class="text-gray-600 mr-3" @click="goBack">←</button>
        <span class="text-lg font-medium">{{ character?.name || '聊天' }}</span>
      </div>
      <!-- 模式切换按钮 -->
      <button
        class="px-3 py-1 rounded-full text-xs font-medium transition-all"
        :class="chatMode === 'romantic'
          ? 'bg-pink-100 text-pink-600 border border-pink-300'
          : 'bg-gray-100 text-gray-600 border border-gray-300'"
        @click="toggleChatMode"
      >
        {{ chatMode === 'romantic' ? '心动模式' : '基础模式' }}
      </button>
    </div>

    <!-- 消息列表 -->
    <div ref="messageListRef" class="flex-1 overflow-y-auto py-4">
      <div v-if="loading" class="text-center py-20 text-gray-500">
        加载中...
      </div>
      <template v-else>
        <MessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
        />
      </template>
    </div>

    <!-- 输入框 -->
    <div class="flex items-center px-4 py-3 bg-white border-t border-gray-200 safe-area-bottom">
      <input
        type="text"
        placeholder="输入消息..."
        :value="inputText"
        @input="handleInput"
        @keyup.enter="handleSend"
        :disabled="sending"
        class="flex-1 h-9 px-4 bg-gray-100 rounded-full text-sm outline-none"
      />
      <button
        class="ml-2 w-9 h-9 rounded-full text-xl flex items-center justify-center transition-colors"
        :class="isPinned ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-100 text-gray-400'"
        @click="handlePinToHome"
      >
        {{ isPinned ? '★' : '☆' }}
      </button>
      <button
        class="ml-2 px-4 h-9 rounded-full text-sm transition-colors"
        :class="inputText ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
        :disabled="sending || !inputText"
        @click="handleSend"
      >
        {{ sending ? '发送中' : '发送' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}
.safe-area-bottom {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
</style>
