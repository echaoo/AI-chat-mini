import { STORAGE_KEYS } from '@/constants/storage'
import { resolveChatMode, resolveChatModelId } from '@/constants/chat'
import type { Character, ChatMode, ChatModelId } from '@/types'
import { getJson, removeStorage, setJson } from '@/utils/storage'

export interface HomeCharacterCache {
  characterId: number | null
  conversationId: number | null
  character: Character
  timestamp: number
}

export interface GreetingCache {
  text: string
  timestamp: number
  used: boolean
}

export interface ChatSettingsCache {
  chatMode: ChatMode
  modelId: ChatModelId
  updatedAt: number
}

const DEFAULT_CHAT_SETTINGS: ChatSettingsCache = {
  chatMode: 'normal',
  modelId: 'default',
  updatedAt: 0
}

export function getHomeCharacterCache() {
  return getJson<HomeCharacterCache>(STORAGE_KEYS.homeCharacter)
}

export function setHomeCharacterCache(value: HomeCharacterCache) {
  setJson(STORAGE_KEYS.homeCharacter, value)
}

export function clearHomeCharacterCache() {
  removeStorage(STORAGE_KEYS.homeCharacter)
}

export function getChatEntryCharacterCache() {
  return getJson<Character>(STORAGE_KEYS.chatEntryCharacter)
}

export function setChatEntryCharacterCache(value: Character) {
  setJson(STORAGE_KEYS.chatEntryCharacter, value)
}

export function getChatSettingsCache() {
  const cached = getJson<Partial<ChatSettingsCache>>(STORAGE_KEYS.chatSettings)

  if (!cached) {
    return { ...DEFAULT_CHAT_SETTINGS }
  }

  return {
    chatMode: resolveChatMode(cached.chatMode, DEFAULT_CHAT_SETTINGS.chatMode),
    modelId: resolveChatModelId(cached.modelId, DEFAULT_CHAT_SETTINGS.modelId),
    updatedAt: typeof cached.updatedAt === 'number' ? cached.updatedAt : 0
  }
}

export function setChatSettingsCache(value: Pick<ChatSettingsCache, 'chatMode' | 'modelId'>) {
  setJson(STORAGE_KEYS.chatSettings, {
    ...value,
    updatedAt: Date.now()
  } satisfies ChatSettingsCache)
}

export function getGreetingCache() {
  return getJson<GreetingCache>(STORAGE_KEYS.greetingCache)
}

export function setGreetingCache(value: GreetingCache) {
  setJson(STORAGE_KEYS.greetingCache, value)
}
