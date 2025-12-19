/**
 * AI 陪伴小程序 - 类型定义
 */

// 角色
export interface Character {
  id: number
  name: string
  avatarUrl: string | null
  description: string | null
  systemPrompt: string
  greetingMessage: string | null
  isOfficial: number
  isActive: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 创建角色请求
export interface CreateCharacterRequest {
  name: string
  description?: string
  systemPrompt: string
  greetingMessage?: string
  avatarUrl?: string
}

// 对话
export interface Conversation {
  id: number
  userId: number
  characterId: number
  title: string | null
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  character?: Character
}

// 消息
export interface Message {
  id: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  tokens: number | null
  createdAt: string
}

// 用户信息
export interface UserInfo {
  id: number
  openId: string
  name: string | null
  avatarUrl: string | null
  phone: string | null
  points: number
  createdAt: string
}

// API 响应
export interface ApiResponse<T = any> {
  code?: number
  message?: string
  data?: T
}
