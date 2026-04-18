<template>
  <div class="page-shell me-view">
    <div class="page-inner me-view__layout">
      <section class="me-card glass-panel">
        <p class="me-card__eyebrow">Player Profile</p>
        <h1>{{ displayName }}</h1>
        <p class="me-card__copy">先给“我的”留一个干净入口，后面可以继续接历史、收藏、装扮、邀请码等个人中心功能。</p>
        <div class="me-card__meta">
          <span>积分 {{ authStore.userInfo?.points ?? 0 }}</span>
          <span>状态 {{ authStore.isLoggedIn ? '已连线' : '未登录' }}</span>
        </div>
      </section>

      <section class="me-actions">
        <button class="brand-button" type="button" @click="router.push({ name: 'home' })">回到首页</button>
        <button class="ghost-button" type="button" @click="router.push({ name: 'conversations' })">查看历史</button>
        <button class="ghost-button" type="button" @click="router.push({ name: 'create-character' })">创建角色</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(() => authStore.userInfo?.name || '体验玩家')
</script>

<style scoped lang="scss">
.me-view {
  display: grid;
  align-items: center;
}

.me-view__layout {
  display: grid;
  gap: 18px;
  width: min(100%, 720px);
}

.me-card {
  padding: 28px;
}

.me-card__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brand-deep);
}

.me-card h1 {
  margin: 10px 0 12px;
  font-family: 'Songti SC', 'STSong', serif;
  font-size: clamp(32px, 6vw, 44px);
}

.me-card__copy {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.me-card__meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.me-card__meta span {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
}

.me-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .me-actions {
    display: grid;
  }
}
</style>
