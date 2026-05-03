<template>
  <section class="chat-panel">
    <div class="chat-panel__body">
      <div v-if="hasToolbar" class="chat-panel__toolbar">
        <div class="chat-panel__identity">
          <div class="chat-panel__avatar">
            <img v-if="character?.avatarUrl" :src="character.avatarUrl" :alt="character?.name || '聊天对象'" />
            <span v-else>{{ avatarFallback }}</span>
          </div>
          <div class="chat-panel__identity-copy">
            <h2 class="chat-panel__title">{{ character?.name || '聊天中' }}</h2>
            <p class="chat-panel__subtitle">{{ toolbarSubtitle }}</p>
          </div>
        </div>
        <div class="chat-panel__toolbar-actions">
          <button
            v-if="messages.length > previewLimit"
            class="ghost-button"
            type="button"
            @click="toggleHistory"
          >
            {{ showHistory ? '收起历史' : '展开历史' }}
          </button>
        </div>
      </div>

      <div v-if="loading && messages.length === 0" class="chat-panel__placeholder">
        正在建立对话...
      </div>

      <template v-else>
        <div
          v-if="!hasStartedChat && greetingMessage"
          class="chat-panel__welcome"
        >
          {{ greetingMessage }}
        </div>

        <div v-else ref="messageListRef" class="chat-panel__messages">
          <button
            v-if="shouldShowAllMessages && hasMoreHistory"
            class="chip-button chat-panel__load-more"
            type="button"
            :disabled="isLoadingHistory"
            @click="handleLoadMoreHistory"
          >
            {{ isLoadingHistory ? '加载中...' : '查看更早消息' }}
          </button>

          <div v-if="visibleMessages.length === 0" class="chat-panel__placeholder">
            还没有消息，发一句开始吧。
          </div>

          <ChatMessageBubble
            v-for="entry in visibleEntries"
            :key="entry.message.id"
            :message="entry.message"
            :can-rollback="canRollback(entry.message, entry.index)"
            :can-regenerate="canRegenerate(entry.message, entry.index)"
            @rollback="handleRollbackMessage(entry.message, entry.index)"
            @regenerate="handleRegenerateMessage(entry.message, entry.index)"
          />
        </div>
      </template>
    </div>

    <div v-if="!(loading && messages.length === 0)" class="chat-panel__composer">
      <div class="chat-panel__composer-field">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat-panel__textarea"
          placeholder="输入消息开始聊天..."
          maxlength="2000"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
        />
        <div class="chat-panel__composer-actions">
          <button
            class="chat-panel__quick-action chat-panel__quick-action--left"
            type="button"
            aria-label="输入左括号"
            @click="handleQuickInsert('（')"
          >
            （
          </button>
          <button
            class="chat-panel__quick-action chat-panel__quick-action--right"
            type="button"
            aria-label="输入右括号"
            @click="handleQuickInsert('）')"
          >
            ）
          </button>
          <button
            class="chat-panel__send"
            type="button"
            :disabled="sending || !trimmedInput"
            aria-label="发送"
            @click="handleSend"
          >
            <img :src="sendIcon" alt="" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import sendIcon from '@/assets/chat/send.png'
import ChatMessageBubble from '@/components/chat/ChatMessageBubble.vue'
import { MESSAGE_CACHE_PREFIX, STORAGE_KEYS } from '@/constants/storage'
import { conversationApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type {
  Character,
  ChatMode,
  ConversationMessagesResponse,
  CreateConversationResponse,
  Message,
  RelationshipStateSnapshot,
  SendMessageResponse
} from '@/types'
import { getHomeCharacterCache, setHomeCharacterCache } from '@/utils/cache'
import { getJson, setJson, setString } from '@/utils/storage'

type UIMessage = Message & { isLoading?: boolean; isLocal?: boolean }
type RelationshipResponse = Pick<SendMessageResponse, 'relationshipState'>

const HISTORY_PAGE_SIZE = 10
const MEMORY_UPDATE_MESSAGE_INTERVAL = 20

const props = defineProps<{
  character: Character | null
  initialConversationId?: number | null
  chatMode: ChatMode
  showToolbar?: boolean
}>()

const emit = defineEmits<{
  (event: 'conversation-ready', payload: { conversationId: number; character: Character }): void
  (event: 'relationship-updated', payload: RelationshipStateSnapshot | null): void
}>()

const uiStore = useUiStore()
const messageListRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const conversationId = ref(0)
const activeCharacterId = ref(0)
const messages = ref<UIMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const sending = ref(false)
const showHistory = ref(false)
const historyPage = ref(1)
const hasMoreHistory = ref(false)
const isLoadingHistory = ref(false)
const initSeed = ref(0)
const relationshipState = ref<RelationshipStateSnapshot | null>(null)
const previewLimit = HISTORY_PAGE_SIZE

const hasToolbar = computed(() => props.showToolbar !== false)
const trimmedInput = computed(() => inputText.value.trim())
const hasStartedChat = computed(() => messages.value.length > 1)
const greetingMessage = computed(() => {
  if (messages.value[0]?.content) return messages.value[0].content
  return props.character?.greetingMessage || '你好，我在这里陪你。'
})
const avatarFallback = computed(() => (props.character?.name || '聊').slice(0, 1))
const shouldShowAllMessages = computed(() => !hasToolbar.value || showHistory.value)
const toolbarSubtitle = computed(() => (shouldShowAllMessages.value ? '全部消息' : '最近消息'))

const visibleMessages = computed(() => {
  if (shouldShowAllMessages.value) return messages.value
  return messages.value.slice(-previewLimit)
})

const visibleEntries = computed(() => {
  const slice = visibleMessages.value
  const startIndex = showHistory.value ? 0 : Math.max(messages.value.length - slice.length, 0)
  return slice.map((message, index) => ({
    message,
    index: startIndex + index
  }))
})

watch(
  () => [props.character?.id ?? 0, props.initialConversationId ?? 0] as const,
  ([nextCharacterId, nextConversationId]) => {
    if (!nextCharacterId) return

    const sameCharacter = nextCharacterId === activeCharacterId.value
    const sameConversation = (nextConversationId || 0) === conversationId.value

    if (sameCharacter && (sameConversation || (!nextConversationId && conversationId.value))) {
      return
    }

    void initConversation(nextCharacterId, nextConversationId)
  },
  { immediate: true }
)

watch(inputText, () => {
  void nextTick(() => {
    resizeTextarea()
  })
})

onBeforeUnmount(() => {
  rememberConversation()
  triggerMemoryUpdate()
})

async function initConversation(nextCharacterId: number, nextConversationId: number) {
  if (!props.character?.id) return

  const currentInit = ++initSeed.value
  activeCharacterId.value = nextCharacterId
  loading.value = true
  sending.value = false
  inputText.value = ''
  showHistory.value = false
  historyPage.value = 1
  hasMoreHistory.value = false
  messages.value = []
  updateRelationshipState(null)

  const cachedHome = getHomeCharacterCache()
  if (cachedHome?.characterId === props.character.id) {
    updateRelationshipState(cachedHome.relationshipState || null)
  }

  try {
    if (nextConversationId) {
      conversationId.value = nextConversationId
      await loadExistingConversation(currentInit)
    } else {
      const cachedConversationId = cachedHome?.characterId === props.character.id ? cachedHome.conversationId || 0 : 0

      if (cachedConversationId) {
        conversationId.value = cachedConversationId
        await loadExistingConversation(currentInit)
      } else {
        await createNewConversation(currentInit)
      }
    }
  } finally {
    if (currentInit === initSeed.value) {
      loading.value = false
    }
  }
}

async function createNewConversation(currentInit: number) {
  if (!props.character?.id) return

  try {
    const response: CreateConversationResponse = await conversationApi.createConversation(props.character.id)

    if (currentInit !== initSeed.value) return

    conversationId.value = response.id
    updateMessages(
      (response.messages || []).map((item) => ({
        id: item.id,
        conversationId: response.id,
        role: item.role,
        content: item.content,
        tokens: null,
        createdAt: item.createdAt
      }))
    )
    historyPage.value = 1
    hasMoreHistory.value = false
    rememberConversation()
    await scrollToBottom(false)
  } catch (error) {
    uiStore.notify((error as Error).message || '初始化失败', 'error')
  }
}

async function loadExistingConversation(currentInit: number) {
  if (!conversationId.value) return

  const cachedMessages = getCachedMessages(conversationId.value)
  if (cachedMessages.length > 0) {
    updateMessages(cachedMessages)
  }

  try {
    const response: ConversationMessagesResponse = await conversationApi.getConversationMessages(
      conversationId.value,
      1,
      HISTORY_PAGE_SIZE
    )

    if (currentInit !== initSeed.value) return

    updateMessages(response.messages || [])
    updateRelationshipState(response.relationshipState || null)
    historyPage.value = 1
    hasMoreHistory.value = (response.messages || []).length === HISTORY_PAGE_SIZE
    rememberConversation()
    await scrollToBottom(false)
  } catch (error) {
    uiStore.notify((error as Error).message || '加载失败', 'error')
  }
}

async function refreshConversationMessages() {
  if (!conversationId.value) return []

  const response = await conversationApi.getConversationMessages(conversationId.value, 1, HISTORY_PAGE_SIZE)
  const latestMessages = response.messages || []
  updateMessages(latestMessages)
  if (response.relationshipState) {
    updateRelationshipState(response.relationshipState)
  }
  historyPage.value = 1
  hasMoreHistory.value = latestMessages.length === HISTORY_PAGE_SIZE
  return latestMessages
}

async function handleSend() {
  const content = trimmedInput.value

  if (!content || sending.value) return

  if (!conversationId.value) {
    await createNewConversation(initSeed.value)
  }

  if (!conversationId.value) return

  const optimisticUser: UIMessage = {
    id: -Date.now(),
    conversationId: conversationId.value,
    role: 'user',
    content,
    tokens: null,
    createdAt: new Date().toISOString(),
    isLocal: true
  }

  const optimisticAssistant: UIMessage = {
    id: Date.now() + 1,
    conversationId: conversationId.value,
    role: 'assistant',
    content: '',
    tokens: null,
    createdAt: new Date().toISOString(),
    isLoading: true
  }

  updateMessages([...messages.value, optimisticUser, optimisticAssistant])
  inputText.value = ''
  sending.value = true
  await scrollToBottom()

  try {
    const response: SendMessageResponse = await conversationApi.sendMessage(
      conversationId.value,
      content,
      props.chatMode
    )

    const nextMessages = [...messages.value]
    const loadingIndex = nextMessages.findIndex((item) => item.isLoading)

    if (loadingIndex >= 0) {
      nextMessages[loadingIndex] = response.assistantMessage
    } else {
      nextMessages.push(response.assistantMessage)
    }

    syncRelationshipState(response)
    updateMessages(nextMessages)
    rememberConversation()
    await scrollToBottom()

    if (nextMessages.length > 0 && nextMessages.length % MEMORY_UPDATE_MESSAGE_INTERVAL === 0) {
      triggerMemoryUpdate()
    }
  } catch (error) {
    updateMessages(messages.value.filter((item) => !item.isLoading))
    uiStore.notify((error as Error).message || '发送失败', 'error', 3200)
  } finally {
    sending.value = false
  }
}

function handleQuickInsert(content: string) {
  const textarea = textareaRef.value

  if (!textarea) {
    inputText.value += content
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  inputText.value = `${inputText.value.slice(0, start)}${content}${inputText.value.slice(end)}`

  void nextTick(() => {
    const cursor = start + content.length
    textarea.focus()
    textarea.setSelectionRange(cursor, cursor)
  })
}

function resizeTextarea() {
  const textarea = textareaRef.value
  if (!textarea) return

  textarea.style.height = '54px'
  const nextHeight = Math.min(textarea.scrollHeight, 160)
  textarea.style.height = `${Math.max(nextHeight, 54)}px`
  textarea.style.overflowY = textarea.scrollHeight > 160 ? 'auto' : 'hidden'
}

function toggleHistory() {
  showHistory.value = !showHistory.value

  if (!showHistory.value) {
    void scrollToBottom(false)
  }
}

function updateMessages(nextMessages: UIMessage[]) {
  messages.value = nextMessages
  cacheMessages()
}

async function handleLoadMoreHistory() {
  if (!conversationId.value || !hasMoreHistory.value || isLoadingHistory.value) return

  isLoadingHistory.value = true
  const nextPage = historyPage.value + 1

  try {
    const response = await conversationApi.getConversationMessages(conversationId.value, nextPage, HISTORY_PAGE_SIZE)
    const mergedIds = new Set(messages.value.map((item) => item.id))
    const olderMessages = (response.messages || []).filter((item) => !mergedIds.has(item.id))

    if (olderMessages.length > 0) {
      updateMessages([...olderMessages, ...messages.value])
      historyPage.value = nextPage
    }

    hasMoreHistory.value = (response.messages || []).length === HISTORY_PAGE_SIZE
  } catch (error) {
    uiStore.notify((error as Error).message || '加载失败', 'error')
  } finally {
    isLoadingHistory.value = false
  }
}

function canRegenerate(message: UIMessage, index: number) {
  if (message.role !== 'assistant') return false
  if (index !== messages.value.length - 1) return false
  return Boolean(getRegenerateSource(index)?.message.content)
}

function canRollback(message: UIMessage, index: number) {
  if (index !== messages.value.length - 1) return true
  return message.role !== 'assistant'
}

function getRegenerateSource(index: number) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = messages.value[cursor]
    if (candidate?.role === 'user') {
      return {
        message: candidate,
        index: cursor
      }
    }
  }

  return null
}

async function resolveServerMessage(message: UIMessage, index: number) {
  if (!message.isLocal) return { message, index }

  const nextMessage = messages.value[index + 1]
  const latestMessages = await refreshConversationMessages()

  if (nextMessage) {
    const nextIndex = latestMessages.findIndex((item) => item.id === nextMessage.id)
    if (nextIndex > 0) {
      return {
        message: latestMessages[nextIndex - 1],
        index: nextIndex - 1
      }
    }
  }

  const matchedIndex = latestMessages.findIndex((item) => item.role === message.role && item.content === message.content)
  if (matchedIndex < 0) return null

  return {
    message: latestMessages[matchedIndex],
    index: matchedIndex
  }
}

async function handleRegenerateMessage(message: UIMessage, index: number) {
  if (!conversationId.value || sending.value) return

  let targetIndex = index
  let source = getRegenerateSource(targetIndex)
  if (!source?.message.content) {
    uiStore.notify('未找到可重新生成的用户消息', 'error')
    return
  }

  if (source.message.isLocal) {
    try {
      const latestMessages = await refreshConversationMessages()
      targetIndex = latestMessages.findIndex((item) => item.id === message.id)
      source = targetIndex >= 0 ? getRegenerateSource(targetIndex) : null
    } catch (error) {
      uiStore.notify((error as Error).message || '同步消息失败', 'error')
      return
    }

    if (!source?.message.content) {
      uiStore.notify('消息同步中，请稍后再试', 'error')
      return
    }
  }

  const content = source.message.content

  const originalAssistant = { ...messages.value[targetIndex] }
  const nextMessages = [...messages.value]
  nextMessages[targetIndex] = { ...originalAssistant, isLoading: true }
  updateMessages(nextMessages)
  sending.value = true
  let didRollback = false

  try {
    await conversationApi.rollbackConversation(conversationId.value, source.message.id)
    didRollback = true

    const response = await conversationApi.sendMessage(conversationId.value, content, props.chatMode)

    syncRelationshipState(response)
    await refreshConversationMessages()
    await scrollToBottom()
  } catch (error) {
    if (didRollback) {
      const rollbackMessages = [...messages.value]
      rollbackMessages.splice(source.index, targetIndex - source.index + 1)
      updateMessages(rollbackMessages)
      inputText.value = content
    } else {
      const rollbackMessages = [...messages.value]
      rollbackMessages[targetIndex] = originalAssistant
      updateMessages(rollbackMessages)
    }

    uiStore.notify((error as Error).message || '重新生成失败', 'error')
  } finally {
    sending.value = false
  }
}

async function handleRollbackMessage(message: UIMessage, index: number) {
  if (!conversationId.value) return

  const confirmed = await uiStore.confirm({
    title: '确认回溯',
    message:
      message.role === 'assistant'
        ? '回溯后，该回复之后的消息会被移除。确认回到这条回复吗？'
        : '回溯后，会从这条用户消息重新开始，并把内容放回输入框。确认继续吗？',
    confirmText: '确认回溯',
    variant: 'danger'
  })
  if (!confirmed) return

  try {
    const resolved = await resolveServerMessage(message, index)
    if (!resolved) {
      uiStore.notify('消息同步中，请稍后再试', 'error')
      return
    }

    const targetMessage = resolved.message
    const targetIndex = resolved.index

    if (targetMessage.role === 'assistant') {
      if (!canRollback(targetMessage, targetIndex)) {
        uiStore.notify('无法回溯最新回复', 'error')
        return
      }
      const nextMessage = messages.value[targetIndex + 1]
      const rollbackMessageId = nextMessage ? nextMessage.id : targetMessage.id
      await conversationApi.rollbackConversation(conversationId.value, rollbackMessageId)
      const response = await conversationApi.getConversationMessages(conversationId.value, 1, HISTORY_PAGE_SIZE)
      const messageIndex = (response.messages || []).findIndex((item) => item.id === targetMessage.id)
      updateMessages(messageIndex >= 0 ? response.messages.slice(0, messageIndex + 1) : response.messages || [])
      historyPage.value = 1
      hasMoreHistory.value = (response.messages || []).length === HISTORY_PAGE_SIZE
      await scrollToBottom(false)
      return
    }

    await conversationApi.rollbackConversation(conversationId.value, targetMessage.id)
    await refreshConversationMessages()
    inputText.value = targetMessage.content || ''
    await scrollToBottom(false)
  } catch (error) {
    uiStore.notify((error as Error).message || '回溯失败', 'error')
  }
}

function cacheMessages() {
  if (!conversationId.value) return

  setJson(`${MESSAGE_CACHE_PREFIX}${conversationId.value}`, messages.value.slice(-HISTORY_PAGE_SIZE))
}

function getCachedMessages(targetConversationId: number) {
  const cached = getJson<UIMessage[]>(`${MESSAGE_CACHE_PREFIX}${targetConversationId}`)
  return Array.isArray(cached) ? cached : []
}

async function scrollToBottom(smooth = true) {
  await nextTick()

  const target = messageListRef.value
  if (!target) return

  target.scrollTo({
    top: target.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

function rememberConversation() {
  if (!conversationId.value || !props.character) return

  setString(STORAGE_KEYS.lastConversationId, String(conversationId.value))

  const homeCache = getHomeCharacterCache()
  if (homeCache?.characterId === props.character.id) {
    setHomeCharacterCache({
      ...homeCache,
      conversationId: conversationId.value,
      character: {
        ...homeCache.character,
        ...props.character
      },
      timestamp: Date.now()
    })
  }

  emit('conversation-ready', {
    conversationId: conversationId.value,
    character: props.character
  })
}

function syncRelationshipState(response: RelationshipResponse) {
  const nextRelationshipState = response.relationshipState || null

  if (!nextRelationshipState || !props.character) return

  updateRelationshipState(nextRelationshipState)

  const homeCache = getHomeCharacterCache()
  if (homeCache?.characterId !== props.character.id) return

  setHomeCharacterCache({
    ...homeCache,
    relationshipState: nextRelationshipState,
    timestamp: Date.now()
  })
}

function updateRelationshipState(nextRelationshipState: RelationshipStateSnapshot | null) {
  relationshipState.value = nextRelationshipState
  emit('relationship-updated', nextRelationshipState)
}

function triggerMemoryUpdate() {
  if (!conversationId.value || !hasStartedChat.value) return

  conversationApi.updateMemorySummary(conversationId.value).catch(() => {
    // 静默失败即可，不打断用户操作。
  })
}
</script>

<style scoped lang="scss">
.chat-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.chat-panel__body {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--line-soft);
}

.chat-panel__identity {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.chat-panel__avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #efc8b6 0%, #d7e6fa 100%);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--brand-deep);
}

.chat-panel__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-panel__identity-copy {
  min-width: 0;
}

.chat-panel__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.chat-panel__subtitle {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.chat-panel__toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chat-panel__welcome {
  margin: 12px 6px 0;
  max-width: min(100%, 540px);
  border-radius: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
  line-height: 1.7;
  white-space: pre-wrap;
  flex-shrink: 0;
}

.chat-panel__messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.chat-panel__load-more {
  align-self: center;
  min-height: auto;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--text-secondary);
}

.chat-panel__placeholder {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  text-align: center;
}

.chat-panel__composer {
  padding: 18px;
  margin-top: auto;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.24);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.64));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(24px) saturate(130%);
}

.chat-panel__composer-field {
  position: relative;
  width: 100%;
}

.chat-panel__textarea {
  width: 100%;
  min-height: 54px;
  max-height: 160px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 14px;
  padding: 14px 102px 14px 16px;
  resize: none;
  outline: none;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
}

.chat-panel__textarea::placeholder {
  color: rgba(255, 255, 255, 0.68);
}

.chat-panel__composer-actions {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.chat-panel__quick-action {
  width: 20px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 16px;
  line-height: 1;
}

.chat-panel__quick-action:focus,
.chat-panel__quick-action:active,
.chat-panel__quick-action:focus-visible {
  background: transparent;
  outline: none;
  box-shadow: none;
}

.chat-panel__quick-action--left {
  justify-content: flex-start;
}

.chat-panel__quick-action--right {
  justify-content: flex-end;
}

.chat-panel__send {
  width: 32px;
  height: 32px;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.chat-panel__send img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.chat-panel__send:disabled {
  opacity: 1;
}

@media (max-width: 720px) {
  .chat-panel {
    min-height: 0;
  }

  .chat-panel__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-panel__composer {
    padding: 18px;
  }

  .chat-panel__send {
    width: 32px;
    height: 32px;
  }
}
</style>
