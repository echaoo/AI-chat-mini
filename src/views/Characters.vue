<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCard from '../components/CharacterCard.vue'
import { characterApi } from '../api'
import type { Character } from '../types'

const router = useRouter()

const myCharacters = ref<Character[]>([])
const officialCharacters = ref<Character[]>([])
const loading = ref(true)
const error = ref('')

onMounted(() => {
  loadCharacters()
})

async function loadCharacters() {
  loading.value = true
  error.value = ''

  try {
    const [myChars, officialChars] = await Promise.all([
      characterApi.getMyCharacters().catch(() => [] as Character[]),
      characterApi.getOfficialCharacters().catch(() => [] as Character[])
    ])

    myCharacters.value = Array.isArray(myChars) ? myChars : []
    officialCharacters.value = Array.isArray(officialChars) ? officialChars : []
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleCharacterTap(character: Character) {
  router.push({ path: '/chat', query: { characterId: String(character.id) } })
}

function handleCreateCharacter() {
  router.push('/characters/create')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-primary p-4">
    <!-- 返回按钮 -->
    <button class="text-white mb-4" @click="goBack">← 返回</button>

    <div class="text-center py-6">
      <h1 class="text-3xl font-bold text-white mb-2">选择角色</h1>
      <p class="text-white/80 text-sm">开始你的专属陪伴之旅</p>
    </div>

    <button
      class="w-full h-11 bg-white/20 backdrop-blur text-white font-semibold rounded-full border border-white/30 mb-4"
      @click="handleCreateCharacter"
    >
      + 创建自定义角色
    </button>

    <div v-if="loading" class="text-center py-20 text-white">
      加载中...
    </div>

    <div v-else-if="error" class="text-center py-20 text-white">
      <p>{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-white/20 rounded-full"
        @click="loadCharacters"
      >
        重试
      </button>
    </div>

    <template v-else>
      <!-- 我的角色 -->
      <div v-if="myCharacters.length > 0" class="mb-6">
        <div class="flex items-center justify-between px-1 mb-3">
          <span class="text-white font-semibold">我的角色</span>
          <span class="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {{ myCharacters.length }}
          </span>
        </div>
        <CharacterCard
          v-for="char in myCharacters"
          :key="char.id"
          :character="char"
          @tap="handleCharacterTap"
        />
      </div>

      <!-- 官方角色 -->
      <div v-if="officialCharacters.length > 0" class="mb-6">
        <div class="flex items-center justify-between px-1 mb-3">
          <span class="text-white font-semibold">官方角色</span>
          <span class="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {{ officialCharacters.length }}
          </span>
        </div>
        <CharacterCard
          v-for="char in officialCharacters"
          :key="char.id"
          :character="char"
          @tap="handleCharacterTap"
        />
      </div>

      <!-- 无角色 -->
      <div
        v-if="myCharacters.length === 0 && officialCharacters.length === 0"
        class="text-center py-20 text-white"
      >
        暂无角色，点击上方按钮创建吧~
      </div>
    </template>
  </div>
</template>
