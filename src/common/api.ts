/**
 * API 接口封装
 */
import { get, post, del } from './request'
import type { Character, Conversation, CreateConversationResponse, Message, CreateCharacterRequest, SendMessageResponse } from './types'

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
   * 返回对话信息和初始消息列表（首次用 greeting，有历史则返回最近 20 条）
   */
  createConversation(characterId: number): Promise<CreateConversationResponse> {
    return post<CreateConversationResponse>('/companion/conversations', { characterId })
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
  sendMessage(conversationId: number, content: string): Promise<SendMessageResponse> {
    return post<SendMessageResponse>(`/companion/conversations/${conversationId}/messages`, { content })
  },

  /**
   * 删除对话
   */
  deleteConversation(conversationId: number): Promise<void> {
    return del<void>(`/companion/conversations/${conversationId}`)
  }
}
