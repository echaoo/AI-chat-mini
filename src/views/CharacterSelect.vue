<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { characterApi } from '../api'
import type { Character } from '../types'

const router = useRouter()
const route = useRoute()

const characters = ref<Character[]>([])
const currentIndex = ref(0)
const loading = ref(true)

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

function prevCharacter() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function nextCharacter() {
  if (currentIndex.value < characters.value.length - 1) {
    currentIndex.value++
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
      <!-- 角色卡片轮播 -->
      <div class="flex-1 relative">
        <div
          v-for="(char, index) in characters"
          :key="char.id"
          class="absolute inset-0 transition-opacity duration-300"
          :class="index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'"
        >
          <!-- 背景图 -->
          <div
            class="absolute inset-0 bg-cover bg-center"
            :style="{ backgroundImage: `url(${char.avatarUrl || '/qiyu.jpg'})` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>

          <!-- 角色信息 -->
          <div class="absolute bottom-0 left-0 right-0 p-6 z-10">
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

        <!-- 左右切换按钮 -->
        <button
          v-if="currentIndex > 0"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 rounded-full text-white"
          @click="prevCharacter"
        >
          ‹
        </button>
        <button
          v-if="currentIndex < characters.length - 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 rounded-full text-white"
          @click="nextCharacter"
        >
          ›
        </button>

        <!-- 指示器 -->
        <div class="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          <span
            v-for="(_, index) in characters"
            :key="index"
            class="w-2 h-2 rounded-full transition-colors"
            :class="index === currentIndex ? 'bg-white' : 'bg-white/40'"
          ></span>
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
</style>
