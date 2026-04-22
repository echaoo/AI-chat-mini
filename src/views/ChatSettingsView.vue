<template>
  <div class="chat-settings" :style="backgroundStyle">
    <div class="chat-settings__veil" />
    <div class="chat-settings__inner">
      <header class="chat-settings__nav">
        <button class="chat-settings__back-button" type="button" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>
        <div class="chat-settings__summary">
          <h1 class="chat-settings__title">设置</h1>
        </div>
        <div class="chat-settings__spacer" aria-hidden="true" />
      </header>

      <main class="chat-settings__content">
        <section class="chat-settings__panel glass-panel">
          <div class="chat-settings__group">
            <div class="chat-settings__field-head">
              <label class="chat-settings__label">关系设定</label>
              <span class="chat-settings__field-value">暂未开放</span>
            </div>
          </div>

          <div class="chat-settings__group">
            <div class="chat-settings__field-head">
              <label class="chat-settings__label">聊天模式</label>
            </div>

            <div class="chat-settings__options">
              <button
                v-for="option in CHAT_MODE_OPTIONS"
                :key="option.value"
                class="chat-settings__option"
                :class="{ 'chat-settings__option--active': settings.chatMode === option.value }"
                type="button"
                @click="selectChatMode(option.value)"
              >
                <span class="chat-settings__option-mark" aria-hidden="true" />
                <span class="chat-settings__option-label">{{ option.label }}</span>
              </button>
            </div>
          </div>

          <div class="chat-settings__group">
            <div class="chat-settings__field-head">
              <label class="chat-settings__label">选择模型</label>
            </div>

            <div class="chat-settings__options">
              <button
                v-for="option in CHAT_MODEL_OPTIONS"
                :key="option.value"
                class="chat-settings__option"
                :class="{ 'chat-settings__option--active': settings.modelId === option.value }"
                type="button"
                @click="selectModel(option.value)"
              >
                <span class="chat-settings__option-mark" aria-hidden="true" />
                <span class="chat-settings__option-label">{{ option.label }}</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import backIcon from '@/assets/chat/back.png'
import { CHAT_MODE_OPTIONS, CHAT_MODEL_OPTIONS } from '@/constants/chat'
import type { ChatMode, ChatModelId } from '@/types'
import { getChatEntryCharacterCache, getChatSettingsCache, setChatSettingsCache } from '@/utils/cache'
import { getCharacterCover } from '@/utils/character'

const route = useRoute()
const router = useRouter()

const settings = ref(getChatSettingsCache())
const cachedCharacter = getChatEntryCharacterCache()

const routeCharacterId = computed(() => parsePositiveQuery(route.query.characterId))
const routeConversationId = computed(() => parsePositiveQuery(route.query.conversationId))

const currentCharacter = computed(() => {
  if (cachedCharacter && routeCharacterId.value && cachedCharacter.id !== routeCharacterId.value) {
    return null
  }

  return cachedCharacter || null
})

const backgroundStyle = computed(() => {
  const cover = getCharacterCover(currentCharacter.value)

  if (!cover) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(10, 10, 10, 0.22), rgba(10, 10, 10, 0.28)), url(${cover})`
  }
})

function parsePositiveQuery(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function persistSettings() {
  setChatSettingsCache({
    chatMode: settings.value.chatMode,
    modelId: settings.value.modelId
  })
}

function selectModel(modelId: ChatModelId) {
  if (settings.value.modelId === modelId) return

  settings.value = {
    ...settings.value,
    modelId
  }
  persistSettings()
}

function selectChatMode(chatMode: ChatMode) {
  if (settings.value.chatMode === chatMode) return

  settings.value = {
    ...settings.value,
    chatMode
  }
  persistSettings()
}

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  if (routeCharacterId.value) {
    router.push({
      name: 'chat',
      query: {
        characterId: String(routeCharacterId.value),
        conversationId: routeConversationId.value ? String(routeConversationId.value) : undefined
      }
    })
    return
  }

  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
.chat-settings {
  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.chat-settings__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 248, 244, 0.14), rgba(255, 244, 239, 0.08)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 42%);
  backdrop-filter: blur(28px) saturate(125%);
  pointer-events: none;
}

.chat-settings__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.chat-settings__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: calc(env(safe-area-inset-top) + 10px) 0 10px;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.14));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(24px) saturate(130%);
  flex-shrink: 0;
}

.chat-settings__back-button,
.chat-settings__spacer {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.chat-settings__back-button {
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  box-shadow: none;
}

.chat-settings__back-button img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  opacity: 0.92;
}

.chat-settings__summary {
  flex: 1;
  min-width: 0;
}

.chat-settings__title {
  margin: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.24);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-settings__content {
  min-height: 0;
  overflow-y: auto;
  background: rgba(255, 248, 244, 0.08);
  padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
}

.chat-settings__panel {
  padding: 24px 16px;
  background: rgba(255, 248, 244, 0.18);
  border-color: rgba(255, 244, 238, 0.22);
  color: rgba(255, 249, 246, 0.96);
  box-shadow: 0 18px 40px rgba(14, 10, 16, 0.12);
}

.chat-settings__group + .chat-settings__group {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 244, 238, 0.12);
}

.chat-settings__field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.chat-settings__label {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 247, 243, 0.84);
}

.chat-settings__field-value {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 247, 243, 0.7);
}

.chat-settings__options {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.chat-settings__option {
  width: 100%;
  padding: 16px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  text-align: left;
  border-radius: 22px;
  background: rgba(255, 248, 244, 0.12);
  border: 1px solid rgba(255, 244, 238, 0.16);
  color: inherit;
  box-shadow: none;
}

.chat-settings__option--active {
  background: rgba(255, 247, 243, 0.16);
  border-color: rgba(255, 239, 232, 0.42);
  box-shadow: 0 14px 30px rgba(12, 8, 16, 0.12);
}

.chat-settings__option-mark {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255, 244, 238, 0.48);
  background: rgba(255, 247, 242, 0.08);
  box-shadow: inset 0 0 0 4px transparent;
}

.chat-settings__option--active .chat-settings__option-mark {
  background: #fff7f2;
  box-shadow: inset 0 0 0 4px rgba(240, 125, 126, 0.92);
}

.chat-settings__option-label {
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .chat-settings__nav {
    min-height: 60px;
    padding: calc(env(safe-area-inset-top) + 8px) 0 8px;
  }

  .chat-settings__title {
    font-size: 16px;
  }

  .chat-settings__content {
    padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
  }
}
</style>
