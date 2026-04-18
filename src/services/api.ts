import { API_BASE_URL } from '@/constants/env'
import { del, get, post, request } from '@/services/http'
import type {
  BackgroundType,
  Character,
  ChatMode,
  Conversation,
  ConversationMessagesResponse,
  CreateCharacterRequest,
  CreateConversationResponse,
  Message,
  PinnedCharacterSummary,
  SendMessageResponse,
  UserInfo
} from '@/types'

function normalizeCharacter(character: Character | null | undefined) {
  if (!character) return null

  return {
    ...character,
    isOfficial: Boolean(character.isOfficial),
    isActive: Boolean(character.isActive),
    isFavorite: Boolean(character.isFavorite),
    isPinnedToHome: Boolean(character.isPinnedToHome)
  } as Character
}

function normalizeConversation(conversation: Conversation) {
  return {
    ...conversation,
    character: normalizeCharacter(conversation.character) || undefined
  }
}

function normalizeMessages(messages: Message[] | undefined) {
  return Array.isArray(messages) ? messages : []
}

export const authApi = {
  getMe() {
    return get<UserInfo>('/companion/auth/me')
  }
}

export const characterApi = {
  async getOfficialCharacters() {
    const result = await get<{ list: Character[] }>('/companion/characters/official')
    return (result?.list || []).map((item) => normalizeCharacter(item) as Character)
  },
  async getCharacterDetail(id: number) {
    const result = await get<Character>(`/companion/characters/${id}`, { params: { _: Date.now() } })
    return normalizeCharacter(result) as Character
  },
  createCharacter(data: CreateCharacterRequest) {
    return post<Character>('/companion/characters', data).then((character) => normalizeCharacter(character) as Character)
  },
  getPinnedCharacter() {
    return get<PinnedCharacterSummary | null>('/companion/characters/pinned/home')
  },
  async getFavoriteCharacters() {
    const result = await get<{ list: Character[] }>('/companion/characters/favorites/list')
    return (result?.list || []).map((item) => normalizeCharacter(item) as Character)
  },
  toggleFavorite(characterId: number) {
    return post<{ characterId: number; isFavorite: boolean }>(`/companion/characters/${characterId}/favorite`, {})
  },
  togglePinToHome(characterId: number) {
    return post<{ characterId: number; isPinnedToHome: boolean }>(`/companion/characters/${characterId}/pin-to-home`, {})
  },
  uploadBackground(file: File, type: BackgroundType) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return request<{ url: string; type: BackgroundType }>({
      url: `${API_BASE_URL}/companion/characters/upload-background`,
      method: 'POST',
      data: formData
    })
  }
}

export const conversationApi = {
  async getConversations() {
    const result = await get<Conversation[]>('/companion/conversations')
    return (result || []).map(normalizeConversation)
  },
  createConversation(characterId: number) {
    return post<CreateConversationResponse>('/companion/conversations', { characterId })
  },
  async getConversationMessages(conversationId: number, page = 1, pageSize = 50) {
    const result = await get<ConversationMessagesResponse>(
      `/companion/conversations/${conversationId}/messages`,
      {
        params: { page, pageSize }
      }
    )

    return {
      ...result,
      messages: normalizeMessages(result?.messages)
    }
  },
  sendMessage(conversationId: number, content: string, chatMode?: ChatMode) {
    const payload: { content: string; chatMode?: ChatMode } = { content }

    if (chatMode) {
      payload.chatMode = chatMode
    }

    return post<SendMessageResponse>(`/companion/conversations/${conversationId}/messages`, payload)
  },
  deleteConversation(conversationId: number) {
    return del<void>(`/companion/conversations/${conversationId}`)
  },
  updateMemorySummary(conversationId: number) {
    return post<{
      success: boolean
      updated: boolean
      message?: string
      messagesProcessed?: number
      memorySummary?: string
    }>(`/companion/conversations/${conversationId}/memory`, {})
  },
  rollbackConversation(conversationId: number, messageId: number) {
    return post<void>(`/companion/conversations/${conversationId}/rollback`, { messageId })
  }
}
