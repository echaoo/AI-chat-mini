/**
 * API 接口封装
 */
import { get, post, del } from './request'
import type {
  Character,
  Conversation,
  CreateConversationResponse,
  CreateCharacterRequest,
  SendMessageResponse,
  ConversationMessagesResponse,
  ChatMode
} from '../types'

/**
 * 角色相关 API
 */
export const characterApi = {
  /**
   * 获取官方角色列表
   */
  async getOfficialCharacters(): Promise<Character[]> {
    const result = await get<{ list: Character[] }>('/companion/characters/official', false)
    return result?.list || []
  },

  /**
   * 获取我的自定义角色列表
   */
  async getMyCharacters(): Promise<Character[]> {
    const result = await get<{ list: Character[] }>('/companion/characters/my')
    return result?.list || []
  },

  /**
   * 获取角色详情
   */
  getCharacterDetail(id: number): Promise<Character> {
    return get<Character>(`/companion/characters/${id}`, false)
  },

  /**
   * 创建自定义角色
   */
  createCharacter(data: CreateCharacterRequest): Promise<Character> {
    return post<Character>('/companion/characters', data)
  },

  /**
   * 获取固定到首页的角色
   */
  async getPinnedCharacter(): Promise<{
    characterId: number
    name: string
    avatarUrl: string
    description: string
    greetingMessage: string
    conversationId: number | null
  } | null> {
    return get('/companion/characters/pinned/home')
  },

  /**
   * 获取收藏角色列表
   */
  async getFavoriteCharacters(): Promise<Character[]> {
    const result = await get<{ list: Character[] }>('/companion/characters/favorites/list')
    return result?.list || []
  },

  /**
   * 收藏/取消收藏角色
   */
  toggleFavorite(characterId: number): Promise<{ characterId: number; isFavorite: boolean }> {
    return post(`/companion/characters/${characterId}/favorite`, {})
  },

  /**
   * 固定/取消固定角色到首页
   */
  togglePinToHome(characterId: number): Promise<{ characterId: number; isPinnedToHome: boolean }> {
    return post(`/companion/characters/${characterId}/pin-to-home`, {})
  }
}

/**
 * 对话相关 API
 */
export const conversationApi = {
  /**
   * 获取对话列表
   */
  getConversations(): Promise<Conversation[]> {
    return get<Conversation[]>('/companion/conversations')
  },

  /**
   * 创建新对话
   * 返回对话信息和初始消息列表（首次用 greeting，有历史则返回最近 20 条）
   */
  createConversation(characterId: number): Promise<CreateConversationResponse> {
    return post<CreateConversationResponse>('/companion/conversations', { characterId })
  },

  /**
   * 获取对话消息历史
   */
  getConversationMessages(conversationId: number): Promise<ConversationMessagesResponse> {
    return get<ConversationMessagesResponse>(`/companion/conversations/${conversationId}/messages`)
  },

  /**
   * 发送消息
   * @param chatMode 对话模式: 'normal' | 'romantic'
   */
  sendMessage(conversationId: number, content: string, chatMode?: ChatMode): Promise<SendMessageResponse> {
    return post<SendMessageResponse>(`/companion/conversations/${conversationId}/messages`, { content, chatMode })
  },

  /**
   * 删除对话
   */
  deleteConversation(conversationId: number): Promise<void> {
    return del<void>(`/companion/conversations/${conversationId}`)
  },

  /**
   * 更新对话记忆摘要
   * 建议在用户离开聊天页面时调用
   */
  updateMemorySummary(conversationId: number): Promise<{
    success: boolean
    updated: boolean
    message?: string
    messagesProcessed?: number
    memorySummary?: string
  }> {
    return post(`/companion/conversations/${conversationId}/memory`, {})
  }
}
