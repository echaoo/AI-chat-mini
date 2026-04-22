import { STORAGE_KEYS } from '@/constants/storage'
import type { Character } from '@/types'
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

export function getHomeCharacterCache() {
  return getJson<HomeCharacterCache>(STORAGE_KEYS.homeCharacter)
}

export function setHomeCharacterCache(value: HomeCharacterCache) {
  setJson(STORAGE_KEYS.homeCharacter, value)
}

export function clearHomeCharacterCache() {
  removeStorage(STORAGE_KEYS.homeCharacter)
}

export function getGreetingCache() {
  return getJson<GreetingCache>(STORAGE_KEYS.greetingCache)
}

export function setGreetingCache(value: GreetingCache) {
  setJson(STORAGE_KEYS.greetingCache, value)
}
