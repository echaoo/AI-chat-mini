<template>
  <nav class="bottom-menu glass-panel" aria-label="底部导航">
    <button
      v-for="item in items"
      :key="item.name"
      class="bottom-menu__item"
      :class="{ 'bottom-menu__item--active': activeName === item.name }"
      type="button"
      @click="goTo(item.name)"
    >
      <span class="bottom-menu__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordName } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = [
  { label: '发现', name: 'characters' },
  { label: '聊天', name: 'chat-characters' },
  { label: '首页', name: 'home' },
  { label: '我的', name: 'me' }
] as const

const activeName = computed(() => route.name)

function goTo(name: RouteRecordName) {
  if (activeName.value === name) return
  router.push({ name })
}
</script>

<style scoped lang="scss">
.bottom-menu {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom));
  z-index: 60;
  display: grid;
  grid-template-columns: repeat(4, minmax(72px, 1fr));
  gap: 10px;
  background: rgba(26, 18, 26, 0.46);
  border-color: rgba(255, 242, 236, 0.16);
  border-radius: 14px 14px 0 0;
}

.bottom-menu__item {
  display: grid;
  place-items: center;
  min-height: 64px;
  border-radius: 14px;
  background: transparent;
  color: rgba(255, 245, 238, 0.78);
  box-shadow: none;
}

.bottom-menu__item--active {
  background: rgba(255, 246, 241, 0.14);
  color: #fff8f3;
}

.bottom-menu__label {
  font-size: 14px;
  line-height: 1.4;
}
</style>
