/**
 * API 接口封装
 */
import { get, post, del } from './request'
import type { Character, Conversation, Message, CreateCharacterRequest } from './types'

/**
 * 角色相关 API
 */
export const characterApi = {
  /**
   * 获取官方角色列表
   */
  getOfficialCharacters(): Promise<Character[]> {
    return get<Character[]>('/companion/characters/official', false)
  },

  /**
   * 获取我的自定义角色列表
   */
  getMyCharacters(): Promise<Character[]> {
    return get<Character[]>('/companion/characters/my')
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
   */
  createConversation(characterId: number): Promise<Conversation> {
    return post<Conversation>('/companion/conversations', { characterId })
  },

  /**
   * 获取对话消息历史
   */
  getConversationMessages(conversationId: number): Promise<Message[]> {
    return get<Message[]>(`/companion/conversations/${conversationId}/messages`)
  },

  /**
   * 发送消息
   */
  sendMessage(conversationId: number, content: string): Promise<Message> {
    return post<Message>(`/companion/conversations/${conversationId}/messages`, { content })
  },

  /**
   * 删除对话
   */
  deleteConversation(conversationId: number): Promise<void> {
    return del<void>(`/companion/conversations/${conversationId}`)
  }
}
