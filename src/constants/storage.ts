export const STORAGE_KEYS = {
  token: 'token',
  userInfo: 'userInfo',
  userId: 'userId',
  lastConversationId: 'last_conversation_id',
  homeCharacter: 'home_character',
  greetingCache: 'greeting_cache',
  favoriteCharacters: 'favorite_characters'
} as const

export const MESSAGE_CACHE_PREFIX = 'conversation_messages_'
