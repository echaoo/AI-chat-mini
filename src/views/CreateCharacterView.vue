<template>
  <div class="page-shell">
    <div class="page-inner">
      <ViewHeader
        eyebrow="角色编辑"
        title="创建自定义角色"
        description="创建角色核心档案，后续场景身份可以独立叠加。"
      >
        <template #actions>
          <RouterLink class="ghost-button" to="/">首页</RouterLink>
          <RouterLink class="ghost-button" to="/characters">角色列表</RouterLink>
        </template>
      </ViewHeader>

      <section class="create-view glass-panel">
        <div class="create-view__grid">
          <label class="create-view__field">
            <span class="field-label">角色名称 *</span>
            <input v-model="form.name" class="surface-input" placeholder="请输入角色名称" />
          </label>

          <label class="create-view__field">
            <span class="field-label">角色描述</span>
            <textarea
              v-model="form.description"
              class="surface-textarea"
              placeholder="请输入角色描述"
            />
          </label>

          <label class="create-view__field create-view__field--wide">
            <span class="field-label">角色核心概括 *</span>
            <textarea
              v-model="form.coreSummary"
              class="surface-textarea"
              placeholder="写清楚这个角色稳定不变的人格底色、表达方式和关系定位。"
            />
            <span class="field-help" :class="{ 'field-help--error': Boolean(profileError) }">
              {{ profileError || '这部分会作为所有主对话和后续场景的角色核心。' }}
            </span>
          </label>

          <label class="create-view__field">
            <span class="field-label">性格关键词</span>
            <textarea
              v-model="form.personalityTraits"
              class="surface-textarea"
              placeholder="每行一个，例如：克制、敏锐、慢热"
            />
          </label>

          <label class="create-view__field">
            <span class="field-label">对话风格示例 *</span>
            <textarea
              v-model="form.dialogueExamples"
              class="surface-textarea"
              placeholder="每行一句角色会说的话"
            />
          </label>

          <label class="create-view__field create-view__field--wide">
            <span class="field-label">角色原设经历</span>
            <textarea
              v-model="form.backgroundStory"
              class="surface-textarea"
              placeholder="只写角色本体经历，不写某个临时场景里的身份。"
            />
          </label>

          <label class="create-view__field create-view__field--wide">
            <span class="field-label">补充设定</span>
            <textarea
              v-model="form.otherInfo"
              class="surface-textarea"
              placeholder="口头禅、偏好、边界、特殊习惯等。"
            />
          </label>

          <label class="create-view__field">
            <span class="field-label">欢迎消息</span>
            <textarea
              v-model="form.greetingMessage"
              class="surface-textarea"
              placeholder="请输入角色欢迎语"
            />
          </label>

          <label class="create-view__field">
            <span class="field-label">头像 URL</span>
            <input v-model="form.avatarUrl" class="surface-input" placeholder="https://..." />
          </label>

          <label class="create-view__field">
            <span class="field-label">能力等级</span>
            <input
              v-model="form.abilityLevel"
              class="surface-input"
              inputmode="numeric"
              placeholder="0 ~ 3"
            />
            <span class="field-help">0=普通人，1=感知者，2=从业者，3=能力者</span>
          </label>

          <label class="create-view__field">
            <span class="field-label">物种类型</span>
            <input v-model="form.speciesType" class="surface-input" placeholder="human / spirit / custom" />
          </label>

          <label class="create-view__field">
            <span class="field-label">所属组织</span>
            <input
              v-model="form.organization"
              class="surface-input"
              placeholder="exorcist_guild / yokai_alliance"
            />
          </label>

          <label class="create-view__field create-view__field--wide">
            <span class="field-label">角色规则（JSON）</span>
            <textarea
              v-model="form.characterRules"
              class="surface-textarea"
              placeholder='{
  "abilities": ["通过塔罗牌感知未来片段"],
  "limitations": ["每天最多占卜3次"]
}'
            />
            <span class="field-help" :class="{ 'field-help--error': Boolean(characterRulesError) }">
              {{ characterRulesError || '可选字段：abilities / limitations / personality_constraints / personal_taboos / ability_details' }}
            </span>
          </label>

          <div class="create-view__field create-view__field--wide">
            <span class="field-label">背景图</span>
            <div class="create-view__uploads">
              <button class="ghost-button" type="button" @click="openPicker('chat')">
                {{ uploadState.chat ? '聊天背景上传中...' : '上传聊天背景' }}
              </button>
              <button class="ghost-button" type="button" @click="openPicker('sleep')">
                {{ uploadState.sleep ? '哄睡背景上传中...' : '上传哄睡背景' }}
              </button>
              <button class="ghost-button" type="button" @click="openPicker('companion')">
                {{ uploadState.companion ? '陪伴背景上传中...' : '上传陪伴背景' }}
              </button>
            </div>

            <div class="create-view__previews">
              <div v-for="item in backgroundItems" :key="item.type" class="create-view__preview">
                <div class="create-view__preview-media">
                  <img v-if="item.url" :src="item.url" :alt="item.label" />
                  <span v-else>{{ item.label }}</span>
                </div>
                <button
                  v-if="item.url"
                  class="danger-button"
                  type="button"
                  @click="clearBackground(item.type)"
                >
                  删除
                </button>
              </div>
            </div>

            <input
              ref="chatInputRef"
              class="create-view__hidden-input"
              type="file"
              accept="image/*"
              @change="handleFileChange($event, 'chat')"
            />
            <input
              ref="sleepInputRef"
              class="create-view__hidden-input"
              type="file"
              accept="image/*"
              @change="handleFileChange($event, 'sleep')"
            />
            <input
              ref="companionInputRef"
              class="create-view__hidden-input"
              type="file"
              accept="image/*"
              @change="handleFileChange($event, 'companion')"
            />
          </div>
        </div>

        <div class="create-view__footer">
          <button class="brand-button" type="button" :disabled="submitting || !canSubmit" @click="handleCreate">
            {{ submitting ? '创建中...' : '创建角色' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ViewHeader from '@/components/common/ViewHeader.vue'
import { characterApi } from '@/services/api'
import { useUiStore } from '@/stores/ui'
import type { BackgroundType, CharacterProfile, CharacterRules, CreateCharacterRequest } from '@/types'
import { getChatSettingsCache, setChatEntryCharacterCache } from '@/utils/cache'

const router = useRouter()
const uiStore = useUiStore()

const form = reactive({
  name: '',
  description: '',
  coreSummary: '',
  personalityTraits: '',
  backgroundStory: '',
  dialogueExamples: '',
  otherInfo: '',
  greetingMessage: '',
  avatarUrl: '',
  abilityLevel: '',
  speciesType: 'human',
  organization: '',
  characterRules: '',
  chatBackgroundUrl: '',
  sleepBackgroundUrl: '',
  companionBackgroundUrl: ''
})

const uploadState = reactive<Record<BackgroundType, boolean>>({
  chat: false,
  sleep: false,
  companion: false
})

const chatInputRef = ref<HTMLInputElement | null>(null)
const sleepInputRef = ref<HTMLInputElement | null>(null)
const companionInputRef = ref<HTMLInputElement | null>(null)
const submitting = ref(false)

const hasRequiredProfile = computed(() => {
  return Boolean(form.coreSummary.trim()) && parseLines(form.dialogueExamples).length > 0
})
const profileError = computed(() => validateProfileForm())
const characterRulesError = computed(() => validateCharacterRules(form.characterRules))
const canSubmit = computed(() => {
  return Boolean(form.name.trim()) && hasRequiredProfile.value && !profileError.value && !characterRulesError.value
})

const backgroundItems = computed(() => [
  { type: 'chat' as const, label: '聊天背景', url: form.chatBackgroundUrl },
  { type: 'sleep' as const, label: '哄睡背景', url: form.sleepBackgroundUrl },
  { type: 'companion' as const, label: '陪伴背景', url: form.companionBackgroundUrl }
])

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateProfileForm() {
  if (!form.coreSummary.trim() && !form.dialogueExamples.trim()) return ''
  if (!form.coreSummary.trim()) return '请填写角色核心概括'
  if (parseLines(form.dialogueExamples).length === 0) return '请至少填写一条对话风格示例'
  return ''
}

function buildProfileJson(): CharacterProfile {
  const profile: CharacterProfile = {
    core_summary: form.coreSummary.trim(),
    dialogue_examples: parseLines(form.dialogueExamples)
  }

  const personalityTraits = parseLines(form.personalityTraits)
  if (personalityTraits.length > 0) {
    Object.assign(profile, { personality_traits: personalityTraits })
  }

  if (form.backgroundStory.trim()) {
    Object.assign(profile, { background_story: form.backgroundStory.trim() })
  }

  if (form.otherInfo.trim()) {
    Object.assign(profile, { other_info: form.otherInfo.trim() })
  }

  return profile
}

function validateCharacterRules(jsonStr: string) {
  if (!jsonStr.trim()) return ''

  try {
    const parsed = JSON.parse(jsonStr)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return '角色规则必须是 JSON 对象'
    }

    const arrayFields = ['abilities', 'limitations', 'personality_constraints', 'personal_taboos', 'ability_details']

    for (const key of arrayFields) {
      if (parsed[key] !== undefined && !Array.isArray(parsed[key])) {
        return `characterRules.${key} 必须是数组`
      }
    }

    if (Array.isArray(parsed.ability_details)) {
      const valid = parsed.ability_details.every((item: any) => {
        return item && typeof item === 'object' && typeof item.type === 'string' && typeof item.description === 'string'
      })

      if (!valid) {
        return 'ability_details 的每一项都需要包含 type 和 description'
      }
    }

    return ''
  } catch (error) {
    return '角色规则 JSON 格式错误'
  }
}

function openPicker(type: BackgroundType) {
  const mapping: Record<BackgroundType, HTMLInputElement | null> = {
    chat: chatInputRef.value,
    sleep: sleepInputRef.value,
    companion: companionInputRef.value
  }

  mapping[type]?.click()
}

async function handleFileChange(event: Event, type: BackgroundType) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  uploadState[type] = true

  try {
    const result = await characterApi.uploadBackground(file, type)

    if (type === 'chat') form.chatBackgroundUrl = result.url
    if (type === 'sleep') form.sleepBackgroundUrl = result.url
    if (type === 'companion') form.companionBackgroundUrl = result.url

    uiStore.notify('上传成功', 'success')
  } catch (error) {
    uiStore.notify((error as Error).message || '上传失败', 'error')
  } finally {
    uploadState[type] = false
    input.value = ''
  }
}

function clearBackground(type: BackgroundType) {
  if (type === 'chat') form.chatBackgroundUrl = ''
  if (type === 'sleep') form.sleepBackgroundUrl = ''
  if (type === 'companion') form.companionBackgroundUrl = ''
}

async function handleCreate() {
  if (!canSubmit.value || submitting.value) return

  const abilityLevelValue = form.abilityLevel.trim()
  if (abilityLevelValue) {
    const parsed = Number(abilityLevelValue)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3) {
      uiStore.notify('能力等级必须是 0 到 3 的整数', 'error')
      return
    }
  }

  submitting.value = true

  try {
    const payload: CreateCharacterRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      profileJson: buildProfileJson(),
      greetingMessage: form.greetingMessage.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
      abilityLevel: abilityLevelValue ? Number(abilityLevelValue) : undefined,
      speciesType: form.speciesType.trim() || undefined,
      organization: form.organization.trim() || undefined,
      characterRules: form.characterRules.trim() ? JSON.parse(form.characterRules) as CharacterRules : undefined,
      chatBackgroundUrl: form.chatBackgroundUrl || undefined,
      sleepBackgroundUrl: form.sleepBackgroundUrl || undefined,
      companionBackgroundUrl: form.companionBackgroundUrl || undefined
    }

    const createdCharacter = await characterApi.createCharacter(payload)
    uiStore.notify('角色创建成功', 'success')
    setChatEntryCharacterCache(createdCharacter)

    router.push({
      name: 'chat',
      query: {
        characterId: String(createdCharacter.id),
        mode: getChatSettingsCache().chatMode
      }
    })
  } catch (error) {
    uiStore.notify((error as Error).message || '创建失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.create-view {
  padding: 24px;
}

.create-view__grid {
  display: grid;
  gap: 18px;
}

.create-view__field {
  display: block;
}

.create-view__field--wide {
  grid-column: 1 / -1;
}

.create-view__uploads {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.create-view__previews {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.create-view__preview {
  display: grid;
  gap: 10px;
}

.create-view__preview-media {
  aspect-ratio: 4 / 3;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line-soft);
  display: grid;
  place-items: center;
  color: var(--text-secondary);
}

.create-view__preview-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.create-view__hidden-input {
  display: none;
}

.create-view__footer {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 900px) {
  .create-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .create-view {
    padding: 18px;
  }

  .create-view__uploads,
  .create-view__footer {
    display: grid;
  }

  .create-view__footer .brand-button {
    width: 100%;
  }
}
</style>
