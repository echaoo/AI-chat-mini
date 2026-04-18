export interface CharacterAbilityDetail {
  type: string
  description: string
  cooldown?: string
  cost?: string
}

export interface CharacterRules {
  abilities?: string[]
  limitations?: string[]
  personality_constraints?: string[]
  personal_taboos?: string[]
  ability_details?: CharacterAbilityDetail[]
}

export interface CharacterProfile {
  core_summary: string
  personality_traits?: string[]
  background_story?: string
  dialogue_examples: string[]
  other_info?: string
}

export interface Character {
  id: number
  name: string
  avatarUrl: string | null
  description: string | null
  systemPrompt?: string
  greetingMessage: string | null
  isOfficial?: boolean | number
  isActive?: boolean | number
  sortOrder?: number
  chatBackgroundUrl: string | null
  sleepBackgroundUrl: string | null
  companionBackgroundUrl: string | null
  createdAt?: string
  updatedAt?: string
  abilityLevel?: number
  speciesType?: string
  organization?: string | null
  characterRules?: CharacterRules | null
  profileJson?: CharacterProfile | null
  hasChatHistory?: boolean
  messageCount?: number
  likeCount?: number
  isFavorite?: boolean | number
  isPinnedToHome?: boolean | number
}

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

export interface Message {
  id: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  tokens: number | null
  createdAt: string
  isLoading?: boolean
  messageType?: 'normal' | 'introduction' | 'greeting'
}

export interface CreateConversationResponse {
  id: number
  characterId: number
  userId: number
  title: string | null
  createdAt: string
  isFirstTimeChat: boolean
  messages: Array<{
    id: number
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}

export interface ConversationMessagesResponse {
  conversationId: number
  character: {
    id: number
    name: string
    avatarUrl: string
  }
  messages: Message[]
}

export interface SendMessageResponse {
  userMessage: Message | null
  assistantMessage: Message
  pointsConsumed: number
  pointsBalance: number
  isGreeting?: boolean
}

export interface CreateCharacterRequest {
  name: string
  description?: string
  systemPrompt?: string
  profileJson?: CharacterProfile
  greetingMessage?: string
  avatarUrl?: string
  chatBackgroundUrl?: string
  sleepBackgroundUrl?: string
  companionBackgroundUrl?: string
  abilityLevel?: number
  speciesType?: string
  organization?: string
  characterRules?: CharacterRules
}

export interface UserInfo {
  id: number
  openId?: string
  name: string | null
  avatarUrl: string | null
  phone?: string | null
  provider?: string
  points: number
  status?: string
  createdAt?: string
}

export interface ApiResponse<T = unknown> {
  code?: number
  message?: string
  data?: T
}

export interface PinnedCharacterSummary {
  characterId: number
  name: string
  avatarUrl: string
  description: string
  greetingMessage: string
  conversationId: number | null
  chatBackgroundUrl?: string | null
  companionBackgroundUrl?: string | null
  sleepBackgroundUrl?: string | null
}

export interface CachedConversationCharacter {
  conversationId: number | null
  character: Character
  timestamp: number
}

export type ChatMode = 'normal' | 'romantic'
export type BackgroundType = 'chat' | 'sleep' | 'companion'
