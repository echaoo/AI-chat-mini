import type { ChatMode, ChatModelId } from '@/types'

export const CHAT_MODE_OPTIONS: Array<{
  value: ChatMode
  label: string
}> = [
  {
    value: 'normal',
    label: '默认模式'
  },
  {
    value: 'romantic',
    label: '心动模式'
  }
]

export const CHAT_MODEL_OPTIONS: Array<{
  value: ChatModelId
  label: string
}> = [
  {
    value: 'roleplay',
    label: '角色扮演模型'
  },
  {
    value: 'gpt',
    label: 'GPT'
  },
  {
    value: 'deepseek',
    label: 'DeepSeek'
  }
]

const VALID_CHAT_MODES = new Set<ChatMode>(CHAT_MODE_OPTIONS.map((item) => item.value))
const VALID_CHAT_MODELS = new Set<ChatModelId>(CHAT_MODEL_OPTIONS.map((item) => item.value))

export function resolveChatMode(value: unknown, fallback: ChatMode = 'normal') {
  const raw = Array.isArray(value) ? value[0] : value
  return VALID_CHAT_MODES.has(raw as ChatMode) ? (raw as ChatMode) : fallback
}

export function resolveChatModelId(value: unknown, fallback: ChatModelId = 'roleplay') {
  const raw = Array.isArray(value) ? value[0] : value
  return VALID_CHAT_MODELS.has(raw as ChatModelId) ? (raw as ChatModelId) : fallback
}

export function getChatModeLabel(mode: ChatMode) {
  return CHAT_MODE_OPTIONS.find((item) => item.value === mode)?.label || '默认模式'
}

export function getChatModelLabel(modelId: ChatModelId) {
  return CHAT_MODEL_OPTIONS.find((item) => item.value === modelId)?.label || '角色扮演模型'
}
