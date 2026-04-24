<template>
  <div class="page-shell">
    <div class="page-inner me-view">
      <ViewHeader
        eyebrow="账户中心"
        title="我的"
        description="这里查看账号信息，也保留聊天相关设定入口。"
      >
        <template #actions>
          <RouterLink class="ghost-button" to="/">首页</RouterLink>
        </template>
      </ViewHeader>

      <section class="me-profile glass-panel">
        <p class="me-profile__eyebrow">个人信息</p>
        <h2 class="me-profile__name">{{ displayName }}</h2>

        <div class="me-profile__stats">
          <article class="me-stat">
            <span class="me-stat__label">积分余额</span>
            <strong class="me-stat__value">{{ pointsBalance }}</strong>
          </article>
          <article class="me-stat">
            <span class="me-stat__label">当前模型</span>
            <strong class="me-stat__value">{{ currentModelLabel }}</strong>
          </article>
        </div>
      </section>

      <section class="me-menu glass-panel" aria-label="功能入口">
        <button class="me-menu__item" type="button" @click="openMyPreferences">
          <div class="me-menu__copy">
            <p class="me-menu__title">我的设定</p>
            <p class="me-menu__description">入口先保留，功能暂未开放。</p>
          </div>
          <span class="me-menu__value me-menu__value--muted">未开放</span>
        </button>

        <button class="me-menu__item" type="button" @click="openModelSelection">
          <div class="me-menu__copy">
            <p class="me-menu__title">模型选择</p>
            <p class="me-menu__description">沿用聊天页的模型选择设置。</p>
          </div>
          <span class="me-menu__value">{{ currentModelLabel }}</span>
        </button>
      </section>

      <section class="me-shortcuts">
        <button class="ghost-button" type="button" @click="router.push({ name: 'chat-characters' })">聊过角色</button>
        <button class="ghost-button" type="button" @click="router.push({ name: 'conversations' })">对话历史</button>
        <button class="ghost-button" type="button" @click="router.push({ name: 'create-character' })">创建角色</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ViewHeader from '@/components/common/ViewHeader.vue'
import { getChatModelLabel } from '@/constants/chat'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { getChatSettingsCache } from '@/utils/cache'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const displayName = computed(() => authStore.userInfo?.name || '体验用户')
const pointsBalance = computed(() => String(authStore.userInfo?.points ?? 0))
const currentModelLabel = computed(() => getChatModelLabel(getChatSettingsCache().modelId))

function openMyPreferences() {
  uiStore.notify('我的设定暂未开放', 'info')
}

function openModelSelection() {
  router.push({ name: 'chat-settings' })
}
</script>

<style scoped lang="scss">
.me-view {
  display: grid;
  gap: 24px;
}

.me-profile,
.me-menu {
  padding: 24px;
}

.me-profile__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand-deep);
}

.me-profile__name {
  margin: 16px 0 0;
  font-size: clamp(32px, 5vw, 40px);
  line-height: 1.1;
}

.me-profile__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.me-stat {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.me-stat__label {
  display: block;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.me-stat__value {
  display: block;
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.2;
}

.me-menu {
  display: grid;
  padding-block: 8px;
}

.me-menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 20px;
  background: transparent;
  color: inherit;
  text-align: left;
  box-shadow: none;
}

.me-menu__item + .me-menu__item {
  border-top: 1px solid var(--line-soft);
}

.me-menu__copy {
  min-width: 0;
}

.me-menu__title,
.me-menu__description {
  margin: 0;
}

.me-menu__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.me-menu__description {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.me-menu__value {
  flex-shrink: 0;
  padding: 0 14px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1;
}

.me-menu__value--muted {
  color: var(--text-secondary);
}

.me-shortcuts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .me-profile__stats {
    grid-template-columns: 1fr;
  }

  .me-menu__item {
    align-items: flex-start;
    flex-direction: column;
  }

  .me-shortcuts {
    display: grid;
  }
}
</style>
