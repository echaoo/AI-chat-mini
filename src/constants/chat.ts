import type { ChatMode, ChatModelId } from '@/types'

export const CHAT_MODE_OPTIONS: Array<{
  value: ChatMode
  label: string
  description: string
}> = [
  {
    value: 'normal',
    label: '默认模式',
    description: '更自然、稳定，适合日常陪伴和慢节奏聊天。'
  },
  {
    value: 'romantic',
    label: '心动模式',
    description: '更有暧昧感和情绪张力，适合亲密氛围。'
  }
]

export const CHAT_MODEL_OPTIONS: Array<{
  value: ChatModelId
  label: string
  description: string
}> = [
  {
    value: 'default',
    label: '标准模型',
    description: '平衡回复速度和表达稳定性，适合作为默认选择。'
  },
  {
    value: 'empathy',
    label: '共情模型',
    description: '偏重情绪理解和安抚感，适合更细腻的陪伴体验。'
  },
  {
    value: 'story',
    label: '剧情模型',
    description: '偏重展开感和代入感，适合更有戏剧性的互动。'
  }
]

const VALID_CHAT_MODES = new Set<ChatMode>(CHAT_MODE_OPTIONS.map((item) => item.value))
const VALID_CHAT_MODELS = new Set<ChatModelId>(CHAT_MODEL_OPTIONS.map((item) => item.value))

export function resolveChatMode(value: unknown, fallback: ChatMode = 'normal') {
  const raw = Array.isArray(value) ? value[0] : value
  return VALID_CHAT_MODES.has(raw as ChatMode) ? (raw as ChatMode) : fallback
}

export function resolveChatModelId(value: unknown, fallback: ChatModelId = 'default') {
  const raw = Array.isArray(value) ? value[0] : value
  return VALID_CHAT_MODELS.has(raw as ChatModelId) ? (raw as ChatModelId) : fallback
}

export function getChatModeLabel(mode: ChatMode) {
  return CHAT_MODE_OPTIONS.find((item) => item.value === mode)?.label || '默认模式'
}

export function getChatModelLabel(modelId: ChatModelId) {
  return CHAT_MODEL_OPTIONS.find((item) => item.value === modelId)?.label || '标准模型'
}
