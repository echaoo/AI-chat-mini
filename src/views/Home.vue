<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { characterApi, conversationApi } from '../api'
import { getGreeting } from '../utils/greetings'
import { storage, STORAGE_KEYS } from '../utils/storage'

const router = useRouter()

const greetingText = ref('你好')
const characterName = ref('祁煜')
const characterId = ref(4)
const conversationId = ref<number | null>(null)

const GREETING_CACHE_DURATION_MS = 3 * 60 * 60 * 1000 // 3 hours
const GREETING_COMMAND = '[GET_GREETING]'

onMounted(() => {
  loadHomeCharacter()
  updateAndDisplayGreeting()
})

async function loadHomeCharacter() {
  // 先从缓存读取
  const cached = storage.get<any>(STORAGE_KEYS.HOME_CHARACTER)
  if (cached?.character) {
    characterName.value = cached.character.name || '祁煜'
    characterId.value = cached.characterId || 4
    conversationId.value = cached.conversationId || null
  }

  // 后台同步服务器数据
  try {
    const serverData = await characterApi.getPinnedCharacter()
    if (serverData) {
      if (serverData.characterId !== characterId.value) {
        characterName.value = serverData.name
        characterId.value = serverData.characterId
        conversationId.value = serverData.conversationId
      } else if (serverData.conversationId !== conversationId.value) {
        conversationId.value = serverData.conversationId
      }

      storage.set(STORAGE_KEYS.HOME_CHARACTER, {
        characterId: serverData.characterId,
        conversationId: serverData.conversationId,
        character: {
          id: serverData.characterId,
          name: serverData.name,
          avatarUrl: serverData.avatarUrl,
          description: serverData.description
        },
        timestamp: Date.now()
      })
    } else {
      storage.remove(STORAGE_KEYS.HOME_CHARACTER)
      characterName.value = '祁煜'
      characterId.value = 4
      conversationId.value = null
    }
  } catch (e) {
    console.warn('[Home] 同步首页角色失败:', e)
  }
}

function updateAndDisplayGreeting() {
  const cached = storage.get<any>(STORAGE_KEYS.GREETING_CACHE)
  const now = Date.now()

  if (cached && !cached.used && now - cached.timestamp < GREETING_CACHE_DURATION_MS) {
    greetingText.value = cached.text
    cached.used = true
    storage.set(STORAGE_KEYS.GREETING_CACHE, cached)
  } else {
    greetingText.value = getGreeting('qiyu')
  }

  fetchAndCacheNewGreeting()
}

async function fetchAndCacheNewGreeting() {
  setTimeout(async () => {
    const convId = conversationId.value

    if (!convId) {
      const newGreeting = getGreeting('qiyu')
      saveGreetingToCache(newGreeting)
      return
    }

    try {
      const response = await conversationApi.sendMessage(convId, GREETING_COMMAND)
      const newGreeting = response.assistantMessage.content
      if (newGreeting) {
        saveGreetingToCache(newGreeting)
      }
    } catch {
      const fallbackGreeting = getGreeting('qiyu')
      saveGreetingToCache(fallbackGreeting)
    }
  }, 1000)
}

function saveGreetingToCache(text: string) {
  storage.set(STORAGE_KEYS.GREETING_CACHE, {
    text,
    timestamp: Date.now(),
    used: false
  })
}

function navigateToChat() {
  const convId = conversationId.value

  const query: Record<string, string> = {}
  if (characterId.value) {
    query.characterId = String(characterId.value)
  }
  if (convId) {
    query.conversationId = String(convId)
  }

  router.push({ path: '/characters/select', query })
}

function navigateToCharacterSelect() {
  router.push('/characters/select')
}

function navigateToConversations() {
  router.push('/conversations')
}

function navigateToCreateCharacter() {
  router.push('/characters/create')
}
</script>

<template>
  <div class="relative w-full h-screen bg-cover bg-center flex flex-col justify-end items-center pb-10"
       style="background-image: url('/qiyu.jpg')">
    <!-- 遮罩层 -->
    <div class="absolute inset-0 bg-black/40 z-0"></div>

    <!-- 主要内容 -->
    <div class="relative z-10 w-full flex flex-col items-start px-5">
      <!-- 文本卡片 -->
      <div class="relative bg-white/10 border border-white/10 border-t-0 rounded-br-2xl rounded-bl-2xl rounded-tr-2xl p-5 mb-8 backdrop-blur-md">
        <div class="absolute -top-8 left-0 text-white text-lg font-bold">
          {{ characterName }}
        </div>
        <span class="text-white text-base leading-relaxed">
          {{ greetingText }}
        </span>
      </div>

      <!-- 按钮组 -->
      <div class="flex items-center justify-center w-full gap-5">
        <button class="w-16 h-16 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold shadow-lg">
          哄睡
        </button>
        <button
          class="w-24 h-24 rounded-full bg-gradient-btn text-white text-xl font-bold shadow-lg"
          @click="navigateToChat"
        >
          聊天
        </button>
        <button class="w-16 h-16 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold shadow-lg">
          陪我一起
        </button>
      </div>
    </div>

    <!-- 侧边导航 -->
    <div class="absolute top-24 right-4 flex flex-col items-end z-10 space-y-3">
      <button
        class="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium"
        @click="navigateToCharacterSelect"
      >
        换角色
      </button>
      <button
        class="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium"
        @click="navigateToConversations"
      >
        消息
      </button>
      <button
        class="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium"
        @click="navigateToCreateCharacter"
      >
        创建角色
      </button>
    </div>
  </div>
</template>
