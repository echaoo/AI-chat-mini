/**
 * AI 陪伴 H5 - 类型定义
 */

// 对话模式
export type ChatMode = 'normal' | 'romantic'

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
  // 后端返回的聊天统计字段（需要认证）
  hasChatHistory?: boolean
  messageCount?: number
  likeCount?: number
  // 用户与角色的关系字段（需要认证）
  isFavorite?: boolean
  isPinnedToHome?: boolean
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

// 创建对话响应（包含初始消息）
export interface CreateConversationResponse {
  id: number
  characterId: number
  userId: number
  title: string | null
  createdAt: string
  isFirstTimeChat: boolean // 是否首次与该角色聊天
  messages: Array<{
    id: number
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}

// 消息
export interface Message {
  id: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens: number | null
  createdAt: string
}

// 获取对话消息响应
export interface ConversationMessagesResponse {
  conversationId: number
  character: {
    id: number
    name: string
    avatarUrl: string
  }
  messages: Message[]
}

// 发送消息响应
export interface SendMessageResponse {
  userMessage: Message | null
  assistantMessage: Message
  pointsConsumed: number
  pointsBalance: number
  isGreeting?: boolean // 是否为问候语响应
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
