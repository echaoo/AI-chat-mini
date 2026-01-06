<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { characterApi, conversationApi } from '../api'
import { storage, STORAGE_KEYS } from '../utils/storage'
import MessageBubble from '../components/MessageBubble.vue'
import type { Character, Message, Conversation } from '../types'

const router = useRouter()
const route = useRoute()

const characters = ref<Character[]>([])
const currentIndex = ref(0)
const loading = ref(true)

// 触摸滑动相关
const touchStartY = ref(0)
const touchStartTime = ref(0)
const translateY = ref(0)
const isSwiping = ref(false)
const isAnimating = ref(false)
const containerHeight = ref(window.innerHeight)

// 聊天相关
const inputText = ref('')
const sending = ref(false)
const pinnedCharacterIds = ref<Set<number>>(new Set())
const favoriteCharacterIds = ref<Set<number>>(new Set())

// 会话和消息相关
const characterConversations = ref<Map<number, Conversation>>(new Map())
const characterMessages = ref<Map<number, Message[]>>(new Map())
const characterLastMessages = ref<Map<number, Message>>(new Map()) // 存储最后一条消息
const showHistoryForCharacter = ref<number | null>(null)
const loadingMessages = ref<Set<number>>(new Set())
const waitingReply = ref<Set<number>>(new Set()) // 等待AI回复的角色
const messageListRefs = ref<Map<number, HTMLElement>>(new Map())

// 当前角色
const currentCharacter = computed(() => characters.value[currentIndex.value] || null)

onMounted(async () => {
  try {
    const [official, my] = await Promise.all([
      characterApi.getOfficialCharacters().catch(() => []),
      characterApi.getMyCharacters().catch(() => [])
    ])
    characters.value = [...my, ...official]

    const characterId = route.query.characterId as string
    if (characterId) {
      const idx = characters.value.findIndex(c => c.id === parseInt(characterId))
      if (idx !== -1) {
        currentIndex.value = idx
      }
    }

    loadPinnedStatus()
    await loadConversations()
  } catch (e) {
    console.error('加载角色失败', e)
  } finally {
    loading.value = false
  }

  window.addEventListener('resize', () => {
    containerHeight.value = window.innerHeight
  })
})

async function loadConversations() {
  try {
    const result = await conversationApi.getConversations()
    const conversations = result?.list || result || []

    if (Array.isArray(conversations)) {
      conversations.forEach(conv => {
        characterConversations.value.set(conv.characterId, {
          id: conv.id,
          visitorId: 0,
          characterId: conv.characterId,
          title: conv.title,
          lastMessage: conv.lastMessagePreview,
          messageCount: conv.messageCount,
          createdAt: '',
          updatedAt: conv.lastMessageAt
        })
        // 保存最后一条消息
        if (conv.lastMessagePreview) {
          characterLastMessages.value.set(conv.characterId, {
            id: 0,
            conversationId: conv.id,
            role: 'assistant',
            content: conv.lastMessagePreview,
            tokens: null,
            createdAt: conv.lastMessageAt
          })
        }
      })
    }
  } catch (e) {
    console.error('加载会话失败', e)
  }
}

function getConversation(characterId: number): Conversation | undefined {
  return characterConversations.value.get(characterId)
}

function getMessages(characterId: number): Message[] {
  return characterMessages.value.get(characterId) || []
}

function getLastMessage(characterId: number): Message | null {
  return characterLastMessages.value.get(characterId) || null
}

function hasHistory(characterId: number): boolean {
  return characterConversations.value.has(characterId)
}

async function loadCharacterMessages(characterId: number) {
  const conv = getConversation(characterId)
  if (!conv) return

  if (loadingMessages.value.has(characterId)) return
  loadingMessages.value.add(characterId)

  try {
    const response = await conversationApi.getConversationMessages(conv.id)
    characterMessages.value.set(characterId, response.messages || [])
  } catch (e) {
    console.error('加载消息失败', e)
  } finally {
    loadingMessages.value.delete(characterId)
  }
}

function toggleHistory(char: Character, event: Event) {
  event.stopPropagation()
  event.preventDefault()

  if (showHistoryForCharacter.value === char.id) {
    showHistoryForCharacter.value = null
  } else {
    showHistoryForCharacter.value = char.id
    if (!characterMessages.value.has(char.id)) {
      loadCharacterMessages(char.id)
    }
    nextTick(() => scrollToBottom(char.id))
  }
}

function scrollToBottom(characterId: number) {
  nextTick(() => {
    const el = messageListRefs.value.get(characterId)
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

function setMessageListRef(characterId: number, el: HTMLElement | null) {
  if (el) {
    messageListRefs.value.set(characterId, el)
  }
}

function loadPinnedStatus() {
  const cached = storage.get<any>(STORAGE_KEYS.HOME_CHARACTER)
  if (cached?.characterId) {
    pinnedCharacterIds.value.add(cached.characterId)
  }
}

function goBack() {
  router.back()
}

function handleButtonClick(event: Event) {
  event.stopPropagation()
  event.preventDefault()
}

async function toggleFavorite(char: Character, event: Event) {
  handleButtonClick(event)
  try {
    const result = await characterApi.toggleFavorite(char.id)
    if (result.isFavorite) {
      favoriteCharacterIds.value.add(char.id)
    } else {
      favoriteCharacterIds.value.delete(char.id)
    }
  } catch (e) {
    if (favoriteCharacterIds.value.has(char.id)) {
      favoriteCharacterIds.value.delete(char.id)
    } else {
      favoriteCharacterIds.value.add(char.id)
    }
  }
}

async function togglePin(char: Character, event: Event) {
  handleButtonClick(event)
  try {
    const result = await characterApi.togglePinToHome(char.id)

    if (result.isPinnedToHome) {
      pinnedCharacterIds.value.add(char.id)
      storage.set(STORAGE_KEYS.HOME_CHARACTER, {
        characterId: char.id,
        conversationId: null,
        character: {
          id: char.id,
          name: char.name,
          avatarUrl: char.avatarUrl,
          description: char.description
        },
        timestamp: Date.now()
      })
    } else {
      pinnedCharacterIds.value.delete(char.id)
      storage.remove(STORAGE_KEYS.HOME_CHARACTER)
    }
  } catch (e: any) {
    console.error('固定失败', e)
  }
}

// 发送消息
async function handleSend() {
  const content = inputText.value.trim()
  if (!content || sending.value || !currentCharacter.value) return

  sending.value = true
  const char = currentCharacter.value
  inputText.value = ''

  try {
    // 获取或创建会话
    let conv = getConversation(char.id)
    if (!conv) {
      const newConv = await conversationApi.createConversation(char.id)
      conv = {
        id: newConv.id,
        visitorId: 0,
        characterId: char.id,
        title: char.name,
        lastMessage: null,
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      characterConversations.value.set(char.id, conv)

      // 添加欢迎消息到消息列表
      if (newConv.messages?.length > 0) {
        characterMessages.value.set(char.id, newConv.messages.map(msg => ({
          id: msg.id,
          conversationId: conv!.id,
          role: msg.role,
          content: msg.content,
          tokens: null,
          createdAt: msg.createdAt
        })))
      } else if (char.greetingMessage) {
        characterMessages.value.set(char.id, [{
          id: 0,
          conversationId: conv.id,
          role: 'assistant',
          content: char.greetingMessage,
          tokens: null,
          createdAt: new Date().toISOString()
        }])
      }
    }

    // 如果还没有加载消息，先加载
    if (!characterMessages.value.has(char.id)) {
      await loadCharacterMessages(char.id)
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      conversationId: conv.id,
      role: 'user',
      content: content,
      tokens: null,
      createdAt: new Date().toISOString()
    }

    const messages = getMessages(char.id)
    characterMessages.value.set(char.id, [...messages, userMessage])

    // 更新最后一条消息显示为用户消息
    characterLastMessages.value.set(char.id, userMessage)

    // 如果历史面板打开，滚动到底部
    if (showHistoryForCharacter.value === char.id) {
      scrollToBottom(char.id)
    }

    // 设置等待回复状态
    waitingReply.value.add(char.id)

    // 发送消息并获取回复
    const response = await conversationApi.sendMessage(conv.id, content)

    // 移除等待状态
    waitingReply.value.delete(char.id)

    // 添加AI回复到消息列表
    const updatedMessages = getMessages(char.id)
    characterMessages.value.set(char.id, [...updatedMessages, response.assistantMessage])

    // 更新最后一条消息
    characterLastMessages.value.set(char.id, response.assistantMessage)

    // 更新会话信息
    conv.lastMessage = response.assistantMessage.content
    conv.updatedAt = new Date().toISOString()

    if (showHistoryForCharacter.value === char.id) {
      scrollToBottom(char.id)
    }
  } catch (e: any) {
    console.error('发送失败', e)
    waitingReply.value.delete(char.id)

    // 显示错误消息
    const errorMessage: Message = {
      id: Date.now() + 1,
      conversationId: 0,
      role: 'assistant',
      content: '消息发送失败，请重试',
      tokens: null,
      createdAt: new Date().toISOString()
    }

    const messages = getMessages(char.id)
    characterMessages.value.set(char.id, [...messages, errorMessage])
    characterLastMessages.value.set(char.id, errorMessage)
  } finally {
    sending.value = false
  }
}

// 触摸事件处理
function onTouchStart(e: TouchEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.input-area') || target.closest('.history-panel') || target.closest('.action-buttons')) return

  if (isAnimating.value) return
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
  isSwiping.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value || isAnimating.value) return

  const currentY = e.touches[0].clientY
  let delta = currentY - touchStartY.value

  const isAtTop = currentIndex.value === 0 && delta > 0
  const isAtBottom = currentIndex.value === characters.value.length - 1 && delta < 0

  if (isAtTop || isAtBottom) {
    delta = delta * 0.3
  }

  translateY.value = delta
}

function onTouchEnd() {
  if (!isSwiping.value || isAnimating.value) return
  isSwiping.value = false

  const touchEndTime = Date.now()
  const duration = touchEndTime - touchStartTime.value
  const velocity = Math.abs(translateY.value) / duration

  const threshold = containerHeight.value * 0.15
  const velocityThreshold = 0.3

  const shouldSwitch = Math.abs(translateY.value) > threshold || velocity > velocityThreshold

  if (shouldSwitch) {
    if (translateY.value < 0 && currentIndex.value < characters.value.length - 1) {
      animateToIndex(currentIndex.value + 1)
    } else if (translateY.value > 0 && currentIndex.value > 0) {
      animateToIndex(currentIndex.value - 1)
    } else {
      animateToIndex(currentIndex.value)
    }
  } else {
    animateToIndex(currentIndex.value)
  }
}

function animateToIndex(targetIndex: number) {
  isAnimating.value = true
  showHistoryForCharacter.value = null
  currentIndex.value = targetIndex
  translateY.value = 0

  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

function getCardStyle(index: number) {
  const diff = index - currentIndex.value
  const baseOffset = diff * containerHeight.value

  const swipeOffset = isSwiping.value ? translateY.value : 0
  const finalOffset = baseOffset + swipeOffset

  if (Math.abs(diff) > 1) {
    return {
      transform: `translateY(${diff > 0 ? '100%' : '-100%'})`,
      opacity: 0,
      pointerEvents: 'none' as const
    }
  }

  return {
    transform: `translateY(${finalOffset}px)`,
    transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    zIndex: index === currentIndex.value ? 10 : 5
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-black relative overflow-hidden">
    <!-- 顶部导航 -->
    <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 safe-area-top">
      <button class="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white" @click="goBack">
        <span class="text-lg">←</span>
      </button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-white">
      加载中...
    </div>

    <template v-else-if="characters.length > 0">
      <!-- 角色卡片轮播容器 -->
      <div
        class="flex-1 relative touch-none"
        @touchstart="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- 所有卡片 -->
        <div
          v-for="(char, index) in characters"
          :key="char.id"
          class="absolute inset-0 will-change-transform flex flex-col"
          :style="getCardStyle(index)"
        >
          <!-- 背景图区域 -->
          <div class="flex-1 relative min-h-0">
            <div
              class="absolute inset-0 bg-cover bg-center"
              :style="{ backgroundImage: `url(${char.avatarUrl || '/qiyu.jpg'})` }"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            </div>

            <!-- 历史消息面板 -->
            <div
              v-if="showHistoryForCharacter === char.id"
              :ref="(el) => setMessageListRef(char.id, el as HTMLElement)"
              class="history-panel absolute left-0 right-0 bottom-0 z-10 overflow-y-auto max-h-[calc(100%-56px)]"
            >
              <div class="p-4 pt-2 pb-4">
                <div v-if="loadingMessages.has(char.id)" class="text-center text-white/60 py-10">
                  加载中...
                </div>
                <template v-else>
                  <MessageBubble
                    v-for="msg in getMessages(char.id)"
                    :key="msg.id"
                    :message="msg"
                  />
                  <div v-if="getMessages(char.id).length === 0" class="text-center text-white/60 py-10">
                    暂无消息记录
                  </div>
                  <!-- 等待回复动画 -->
                  <div v-if="waitingReply.has(char.id)" class="flex justify-start mb-3">
                    <div class="bg-white/90 rounded-2xl px-4 py-3">
                      <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 最后一条消息或角色介绍 -->
            <div v-if="showHistoryForCharacter !== char.id" class="absolute bottom-0 left-0 right-0 p-4">
              <!-- 有聊天记录：显示最后一条消息 -->
              <template v-if="hasHistory(char.id) || getLastMessage(char.id)">
                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
                  <!-- 等待回复时显示加载动画 -->
                  <template v-if="waitingReply.has(char.id)">
                    <div class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </template>
                  <template v-else>
                    <p class="text-gray-800 text-sm leading-relaxed line-clamp-3">
                      {{ getLastMessage(char.id)?.content || '...' }}
                    </p>
                  </template>
                </div>
              </template>
              <!-- 无聊天记录：显示角色介绍 -->
              <template v-else>
                <p class="text-white/90 text-sm leading-relaxed line-clamp-4">
                  {{ char.description || '这个角色很神秘，没有留下任何介绍...' }}
                </p>
              </template>
            </div>
          </div>

          <!-- 底部信息区域 -->
          <div class="bg-black px-4 pt-4 pb-2 safe-area-bottom">
            <!-- 欢迎语 (仅无聊天记录时显示) -->
            <div v-if="!hasHistory(char.id) && !getLastMessage(char.id)" class="bg-white/10 rounded-2xl p-3 mb-4">
              <p class="text-white/80 text-sm leading-relaxed">
                {{ char.greetingMessage || '你好，很高兴认识你！' }}
              </p>
            </div>

            <!-- 角色名称和按钮行 -->
            <div class="flex items-center justify-between mb-4">
              <!-- 左侧：名称和创作者 -->
              <div class="flex-1 min-w-0">
                <h2 class="text-white text-xl font-bold truncate">{{ char.name }}</h2>
                <p class="text-white/50 text-xs mt-0.5">
                  by {{ char.creatorName || '官方' }}
                </p>
              </div>

              <!-- 右侧：按钮 -->
              <div class="action-buttons flex items-center gap-2 ml-4">
                <!-- 查看历史消息按钮 -->
                <button
                  v-if="hasHistory(char.id) || getLastMessage(char.id)"
                  class="h-9 px-4 rounded-full flex items-center justify-center text-xs font-medium transition-colors active:scale-95"
                  :class="showHistoryForCharacter === char.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'"
                  @click="toggleHistory(char, $event)"
                  @touchend.stop="toggleHistory(char, $event)"
                >
                  {{ showHistoryForCharacter === char.id ? '收起' : '历史' }}
                </button>

                <!-- 收藏按钮 -->
                <button
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95"
                  :class="favoriteCharacterIds.has(char.id) ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white/60'"
                  @click="toggleFavorite(char, $event)"
                  @touchend.stop="toggleFavorite(char, $event)"
                >
                  <span>{{ favoriteCharacterIds.has(char.id) ? '♥' : '♡' }}</span>
                </button>

                <!-- 固定到首页按钮 -->
                <button
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95"
                  :class="pinnedCharacterIds.has(char.id) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/60'"
                  @click="togglePin(char, $event)"
                  @touchend.stop="togglePin(char, $event)"
                >
                  <span>{{ pinnedCharacterIds.has(char.id) ? '★' : '☆' }}</span>
                </button>
              </div>
            </div>

            <!-- 输入框 -->
            <div class="input-area flex items-center gap-2">
              <input
                type="text"
                v-model="inputText"
                placeholder="说点什么开始聊天..."
                @keyup.enter="handleSend"
                :disabled="sending"
                class="flex-1 h-11 px-4 bg-white/10 rounded-full text-white text-sm outline-none placeholder-white/40"
              />
              <button
                class="h-11 px-5 rounded-full text-sm font-medium transition-all active:scale-95"
                :class="inputText.trim() && !sending ? 'bg-gradient-btn text-white' : 'bg-white/10 text-white/40'"
                :disabled="sending || !inputText.trim()"
                @click="handleSend"
              >
                {{ sending ? '...' : '发送' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="flex-1 flex items-center justify-center text-white">
      暂无角色
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}

.safe-area-bottom {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.bg-gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.history-panel {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.history-panel::-webkit-scrollbar {
  display: none;
}

/* 三个点加载动画 */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
