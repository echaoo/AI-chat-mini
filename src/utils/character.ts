import type { Character } from '@/types'

export function isFlagOn(value: boolean | number | null | undefined) {
  return Boolean(value)
}

export function getCharacterCover(character: Character | null | undefined) {
  if (!character) return ''
  return character.chatBackgroundUrl || character.avatarUrl || ''
}

export function getCharacterSummary(character: Character | null | undefined) {
  if (!character) return '暂无描述'
  return character.description || character.greetingMessage || '给你一个温柔的聊天入口。'
}
