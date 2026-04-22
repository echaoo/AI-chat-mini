<template>
  <div class="chat-settings" :style="backgroundStyle">
    <div class="chat-settings__overlay" />

    <div class="chat-settings__inner">
      <header class="chat-settings__nav">
        <button class="chat-settings__back-button" type="button" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>

        <div class="chat-settings__nav-copy">
          <p class="chat-settings__eyebrow">聊天设置</p>
          <h1>对话偏好</h1>
        </div>

        <button class="chat-settings__done-button" type="button" @click="goBack">完成</button>
      </header>

      <main class="chat-settings__content">
        <section class="chat-settings__panel glass-panel">
          <p class="chat-settings__panel-eyebrow">当前会话</p>
          <h2>{{ currentCharacter?.name || '聊天设置' }}</h2>
          <p class="chat-settings__panel-copy">
            先把最关键的模型和模式放在这里，后面再继续加你的设定和聊天外观。
          </p>

          <div class="chat-settings__summary">
            <span>{{ currentModeLabel }}</span>
            <span>{{ currentModelLabel }}</span>
          </div>
        </section>

        <section class="chat-settings__panel glass-panel">
          <div class="chat-settings__section-head">
            <div>
              <p class="chat-settings__panel-eyebrow">优先项</p>
              <h3>对话模型</h3>
            </div>
            <p class="chat-settings__section-copy">当前先保存前端偏好，等模型接口接入后直接按这里生效。</p>
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
              <span class="chat-settings__option-copy">
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
            </button>
          </div>
        </section>

        <section class="chat-settings__panel glass-panel">
          <div class="chat-settings__section-head">
            <div>
              <p class="chat-settings__panel-eyebrow">已接入</p>
              <h3>聊天模式</h3>
            </div>
            <p class="chat-settings__section-copy">这里会直接影响后续发消息时传给后端的聊天模式参数。</p>
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
              <span class="chat-settings__option-copy">
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
            </button>
          </div>
        </section>

        <section class="chat-settings__panel glass-panel">
          <div class="chat-settings__section-head">
            <div>
              <p class="chat-settings__panel-eyebrow">下一步</p>
              <h3>更多个性化设置</h3>
            </div>
            <p class="chat-settings__section-copy">先把入口留好，后面继续往里补功能。</p>
          </div>

          <div class="chat-settings__coming-list">
            <article class="chat-settings__coming-item">
              <h4>完善自己的设定</h4>
              <p>补充你的身份、关系偏好和互动边界，让角色更懂你。</p>
            </article>
            <article class="chat-settings__coming-item">
              <h4>换聊天气泡</h4>
              <p>切换更符合角色氛围的气泡皮肤和聊天主题。</p>
            </article>
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
import {
  CHAT_MODE_OPTIONS,
  CHAT_MODEL_OPTIONS,
  getChatModeLabel,
  getChatModelLabel
} from '@/constants/chat'
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

const currentModeLabel = computed(() => getChatModeLabel(settings.value.chatMode))
const currentModelLabel = computed(() => getChatModelLabel(settings.value.modelId))

const backgroundStyle = computed(() => {
  const cover = getCharacterCover(currentCharacter.value)

  if (!cover) {
    return {
      background:
        'radial-gradient(circle at top, rgba(255, 226, 214, 0.42), transparent 34%), linear-gradient(180deg, #2b2028 0%, #5f3f4b 52%, #e0c8bb 100%)'
    }
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(22, 14, 22, 0.4), rgba(22, 14, 22, 0.72)), url(${cover})`
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
  min-height: 100vh;
  min-height: 100dvh;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  overflow: hidden;
}

.chat-settings__overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(255, 236, 227, 0.16), transparent 28%),
    linear-gradient(180deg, rgba(18, 12, 20, 0.16), rgba(18, 12, 20, 0.5));
  pointer-events: none;
}

.chat-settings__inner {
  position: relative;
  z-index: 1;
  width: min(100%, 780px);
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 12px) 16px calc(28px + env(safe-area-inset-bottom));
}

.chat-settings__nav {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.chat-settings__back-button,
.chat-settings__done-button {
  min-height: 52px;
  border-radius: 999px;
  background: rgba(255, 248, 244, 0.14);
  border: 1px solid rgba(255, 244, 238, 0.18);
  color: rgba(255, 248, 244, 0.96);
  backdrop-filter: blur(16px);
}

.chat-settings__back-button {
  width: 52px;
  padding: 0;
  display: grid;
  place-items: center;
}

.chat-settings__back-button img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  opacity: 0.92;
}

.chat-settings__done-button {
  padding: 0 18px;
}

.chat-settings__nav-copy {
  min-width: 0;
  color: rgba(255, 249, 246, 0.96);
  text-shadow: 0 4px 18px rgba(12, 8, 14, 0.3);
}

.chat-settings__eyebrow,
.chat-settings__panel-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: rgba(255, 247, 242, 0.72);
}

.chat-settings__nav-copy h1,
.chat-settings__panel h2,
.chat-settings__section-head h3,
.chat-settings__coming-item h4 {
  font-family: 'Songti SC', 'STSong', serif;
}

.chat-settings__nav-copy h1 {
  margin: 6px 0 0;
  font-size: clamp(28px, 5vw, 36px);
  line-height: 1.1;
}

.chat-settings__content {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.chat-settings__panel {
  padding: 22px 20px;
  background: rgba(255, 248, 244, 0.12);
  border-color: rgba(255, 244, 238, 0.18);
  color: rgba(255, 249, 246, 0.96);
  box-shadow: 0 18px 40px rgba(14, 10, 16, 0.16);
}

.chat-settings__panel h2 {
  margin: 10px 0 0;
  font-size: clamp(28px, 5vw, 34px);
}

.chat-settings__panel-copy,
.chat-settings__section-copy,
.chat-settings__coming-item p {
  margin: 10px 0 0;
  line-height: 1.8;
  color: rgba(255, 247, 243, 0.78);
}

.chat-settings__summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.chat-settings__summary span {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 247, 243, 0.12);
  border: 1px solid rgba(255, 244, 238, 0.16);
}

.chat-settings__section-head {
  display: grid;
  gap: 10px;
}

.chat-settings__section-head h3 {
  margin: 6px 0 0;
  font-size: 24px;
}

.chat-settings__options,
.chat-settings__coming-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.chat-settings__option,
.chat-settings__coming-item {
  width: 100%;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 248, 244, 0.08);
  border: 1px solid rgba(255, 244, 238, 0.12);
}

.chat-settings__option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  text-align: left;
  color: inherit;
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

.chat-settings__option-copy {
  display: grid;
  gap: 4px;
}

.chat-settings__option-copy strong {
  font-size: 17px;
  font-weight: 600;
}

.chat-settings__option-copy small {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 247, 243, 0.74);
}

.chat-settings__coming-item h4 {
  margin: 0;
  font-size: 20px;
}

@media (max-width: 720px) {
  .chat-settings__inner {
    padding-inline: 14px;
  }

  .chat-settings__nav {
    grid-template-columns: 48px minmax(0, 1fr) auto;
  }

  .chat-settings__back-button {
    width: 48px;
    min-height: 48px;
  }

  .chat-settings__done-button {
    min-height: 48px;
    padding-inline: 16px;
  }

  .chat-settings__panel {
    padding: 20px 16px;
  }

  .chat-settings__section-head h3 {
    font-size: 22px;
  }
}
</style>
