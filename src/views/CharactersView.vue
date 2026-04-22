<template>
  <div class="page-shell">
    <div class="page-inner">
      <ViewHeader
        eyebrow="角色大厅"
        title="选择角色"
        description="先从官方角色开始，后面你创建的角色也能直接跳进聊天页。"
      >
        <template #actions>
          <RouterLink class="ghost-button" to="/">首页</RouterLink>
          <RouterLink class="brand-button" to="/create-character">创建角色</RouterLink>
        </template>
      </ViewHeader>

      <div class="characters-view__grid">
        <section v-if="favoriteCharacters.length" class="characters-view__section">
          <h2>我的收藏</h2>
          <div class="characters-view__list">
            <CharacterCard
              v-for="character in favoriteCharacters"
              :key="`favorite-${character.id}`"
              :character="character"
              badge="收藏"
              @select="openCharacter"
            />
          </div>
        </section>

        <section class="characters-view__section">
          <h2>官方角色</h2>
          <p v-if="error" class="characters-view__error">{{ error }}</p>
          <div v-if="loading" class="empty-card glass-panel">角色列表加载中...</div>
          <div v-else-if="officialCharacters.length === 0" class="empty-card glass-panel">暂无可用角色</div>
          <div v-else class="characters-view__list">
            <CharacterCard
              v-for="character in officialCharacters"
              :key="character.id"
              :character="character"
              :badge="character.isPinnedToHome ? '已固定到首页' : ''"
              @select="openCharacter"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import CharacterCard from '@/components/common/CharacterCard.vue'
import ViewHeader from '@/components/common/ViewHeader.vue'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { Character } from '@/types'
import { setChatEntryCharacterCache } from '@/utils/cache'

const router = useRouter()
const uiStore = useUiStore()
const favoriteCharacters = ref<Character[]>([])
const officialCharacters = ref<Character[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await loadCharacters()
})

async function loadCharacters() {
  loading.value = true
  error.value = ''

  try {
    const [favorites, official] = await Promise.all([
      characterApi.getFavoriteCharacters().catch(() => []),
      characterApi.getOfficialCharacters()
    ])

    favoriteCharacters.value = favorites
    officialCharacters.value = official
  } catch (loadError) {
    error.value = (loadError as Error).message || '加载失败'
    uiStore.notify(error.value, 'error')
  } finally {
    loading.value = false
  }
}

function openCharacter(character: Character) {
  setChatEntryCharacterCache(character)

  router.push({
    name: 'chat',
    query: {
      characterId: String(character.id)
    }
  })
}
</script>

<style scoped lang="scss">
.characters-view__grid {
  display: grid;
  gap: 24px;
}

.characters-view__section h2 {
  margin: 0 0 14px;
  font-size: 22px;
}

.characters-view__list {
  display: grid;
  gap: 14px;
}

.characters-view__error {
  margin: 0 0 14px;
  color: var(--danger);
}
</style>
