<template>
  <div class="page-shell me-view-page">
    <div class="page-inner me-view">
      <OverlayHeader title="我的" :show-back="false" @back="goBack" />

      <section class="me-list glass-panel" aria-label="账户信息">
        <div class="me-list__item">
          <span class="me-list__label">名字</span>
          <strong class="me-list__value">{{ displayName }}</strong>
        </div>
        <div class="me-list__item">
          <span class="me-list__label">积分余额</span>
          <strong class="me-list__value">{{ pointsBalance }}</strong>
        </div>
        <div class="me-list__item">
          <span class="me-list__label">当前模型</span>
          <strong class="me-list__value">{{ currentModelLabel }}</strong>
        </div>
      </section>

      <section class="me-list glass-panel" aria-label="功能入口">
        <button class="me-list__item me-list__item--action" type="button" @click="openMyPreferences">
          <span class="me-list__label">我的设定</span>
          <span class="me-list__value me-list__value--muted">未开放</span>
        </button>
        <button class="me-list__item me-list__item--action" type="button" @click="openModelSelection">
          <span class="me-list__label">模型选择</span>
          <span class="me-list__action-meta">
            <span class="me-list__value">{{ currentModelLabel }}</span>
            <img class="me-list__arrow" :src="arrowRightIcon" alt="" />
          </span>
        </button>
      </section>
    </div>
    <BottomMenu />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import arrowRightIcon from '@/assets/common/arrow-right.png'
import BottomMenu from '@/components/common/BottomMenu.vue'
import OverlayHeader from '@/components/common/OverlayHeader.vue'
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

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
.me-view-page {
  padding: 0 0 calc(104px + env(safe-area-inset-bottom));
}

.me-view {
  display: grid;
  gap: 16px;
  width: 100%;
}

.me-list {
  width: min(calc(100% - 32px), 720px);
  justify-self: center;
  overflow: hidden;
}

.me-list__item {
  width: 100%;
  min-height: 56px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: transparent;
  color: inherit;
  text-align: left;
  box-shadow: none;
}

.me-list__item + .me-list__item {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.me-list__item--action {
  cursor: pointer;
}

.me-list__label,
.me-list__value {
  font-size: 16px;
  line-height: 1.5;
}

.me-list__label {
  min-width: 0;
}

.me-list__value {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.me-list__action-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.me-list__arrow {
  width: 14px;
  height: 14px;
  object-fit: contain;
  opacity: 0.72;
}

.me-list__item strong {
  color: var(--text-primary);
}

@media (max-width: 720px) {
  .me-list__item {
    min-height: 52px;
  }
}
</style>
