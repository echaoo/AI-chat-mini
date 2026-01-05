<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { characterApi } from '../api'
import type { Character } from '../types'

const router = useRouter()
const route = useRoute()

const characters = ref<Character[]>([])
const currentIndex = ref(0)
const loading = ref(true)

// 触摸滑动相关
const touchStartY = ref(0)
const touchStartTime = ref(0)
const translateY = ref(0)
const isSwiping = ref(false)
const isAnimating = ref(false)
const containerHeight = ref(window.innerHeight)

onMounted(async () => {
  try {
    const [official, my] = await Promise.all([
      characterApi.getOfficialCharacters().catch(() => []),
      characterApi.getMyCharacters().catch(() => [])
    ])
    characters.value = [...my, ...official]

    // 如果传入了 characterId，定位到对应角色
    const characterId = route.query.characterId as string
    if (characterId) {
      const idx = characters.value.findIndex(c => c.id === parseInt(characterId))
      if (idx !== -1) {
        currentIndex.value = idx
      }
    }
  } catch (e) {
    console.error('加载角色失败', e)
  } finally {
    loading.value = false
  }

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    containerHeight.value = window.innerHeight
  })
})

function goBack() {
  router.back()
}

function goToFavorites() {
  router.push('/characters')
}

function startChat(character: Character) {
  router.push({ path: '/chat', query: { characterId: String(character.id) } })
}

// 触摸事件处理
function onTouchStart(e: TouchEvent) {
  if (isAnimating.value) return
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
  isSwiping.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value || isAnimating.value) return
  e.preventDefault()

  const currentY = e.touches[0].clientY
  let delta = currentY - touchStartY.value

  // 边界阻尼效果
  const isAtTop = currentIndex.value === 0 && delta > 0
  const isAtBottom = currentIndex.value === characters.value.length - 1 && delta < 0

  if (isAtTop || isAtBottom) {
    // 边界时添加阻尼，滑动距离减半
    delta = delta * 0.3
  }

  translateY.value = delta
}

function onTouchEnd() {
  if (!isSwiping.value || isAnimating.value) return
  isSwiping.value = false

  const touchEndTime = Date.now()
  const duration = touchEndTime - touchStartTime.value
  const velocity = Math.abs(translateY.value) / duration // 滑动速度

  const threshold = containerHeight.value * 0.15 // 滑动超过15%屏幕高度
  const velocityThreshold = 0.3 // 速度阈值

  // 根据滑动距离或速度判断是否切换
  const shouldSwitch = Math.abs(translateY.value) > threshold || velocity > velocityThreshold

  if (shouldSwitch) {
    if (translateY.value < 0 && currentIndex.value < characters.value.length - 1) {
      // 向上滑动，切换到下一个
      animateToIndex(currentIndex.value + 1)
    } else if (translateY.value > 0 && currentIndex.value > 0) {
      // 向下滑动，切换到上一个
      animateToIndex(currentIndex.value - 1)
    } else {
      // 边界回弹
      animateToIndex(currentIndex.value)
    }
  } else {
    // 回弹到当前位置
    animateToIndex(currentIndex.value)
  }
}

function animateToIndex(targetIndex: number) {
  isAnimating.value = true
  currentIndex.value = targetIndex
  translateY.value = 0

  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

// 计算每个卡片的样式
function getCardStyle(index: number) {
  const diff = index - currentIndex.value
  const baseOffset = diff * containerHeight.value

  // 滑动时的实时偏移
  const swipeOffset = isSwiping.value ? translateY.value : 0
  const finalOffset = baseOffset + swipeOffset

  // 只渲染当前卡片和相邻卡片
  if (Math.abs(diff) > 1) {
    return {
      transform: `translateY(${diff > 0 ? '100%' : '-100%'})`,
      opacity: 0,
      pointerEvents: 'none' as const
    }
  }

  return {
    transform: `translateY(${finalOffset}px)`,
    transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    zIndex: index === currentIndex.value ? 10 : 5
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-black relative overflow-hidden">
    <!-- 顶部导航 -->
    <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 safe-area-top">
      <button class="text-white text-lg" @click="goBack">←</button>
      <button class="text-white text-lg" @click="goToFavorites">♡</button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-white">
      加载中...
    </div>

    <template v-else-if="characters.length > 0">
      <!-- 角色卡片轮播容器 -->
      <div
        class="flex-1 relative touch-none"
        @touchstart="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- 所有卡片 -->
        <div
          v-for="(char, index) in characters"
          :key="char.id"
          class="absolute inset-0 will-change-transform"
          :style="getCardStyle(index)"
        >
          <!-- 背景图 -->
          <div
            class="absolute inset-0 bg-cover bg-center"
            :style="{ backgroundImage: `url(${char.avatarUrl || '/qiyu.jpg'})` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>

          <!-- 角色信息 -->
          <div class="absolute bottom-0 left-0 right-0 p-6 z-10 safe-area-bottom">
            <h2 class="text-white text-2xl font-bold mb-2">{{ char.name }}</h2>
            <p class="text-white/80 text-sm mb-4 line-clamp-3">
              {{ char.description || char.greetingMessage || '暂无描述' }}
            </p>

            <!-- 统计信息 -->
            <div class="flex items-center gap-4 mb-4 text-white/60 text-sm">
              <span>❤ {{ char.likeCount || 0 }}</span>
              <span>💬 {{ char.messageCount || 0 }}</span>
            </div>

            <!-- 开始聊天按钮 -->
            <button
              class="w-full py-3 bg-gradient-btn text-white rounded-full font-semibold text-lg"
              @click="startChat(char)"
            >
              开始聊天
            </button>
          </div>
        </div>

      </div>
    </template>

    <div v-else class="flex-1 flex items-center justify-center text-white">
      暂无角色
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}

.safe-area-bottom {
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}
</style>
