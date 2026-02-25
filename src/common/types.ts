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
  chatBackgroundUrl: string | null
  sleepBackgroundUrl: string | null
  companionBackgroundUrl: string | null
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
  chatBackgroundUrl?: string
  sleepBackgroundUrl?: string
  companionBackgroundUrl?: string
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
  role: 'user' | 'assistant'
  content: string
  tokens: number | null
  createdAt: string
  isLoading?: boolean
  messageType?: 'normal' | 'introduction' | 'greeting' // 消息类型：普通消息、角色介绍、问候语
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

// 角色设定结构化数据（推荐方案）
export interface CharacterProfile {
  core_summary: string // 核心摘要，不超过200字
  personality_traits: string[] // 性格特质数组
  background_story?: string // 背景故事（可选）
  dialogue_examples: string[] // 对话示例数组，2-3个
  other_info?: string // 其他信息（可选）
}

// API 响应
export interface ApiResponse<T = any> {
  code?: number
  message?: string
  data?: T
}
