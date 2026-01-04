<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { characterApi } from '../api'

const router = useRouter()

const name = ref('')
const description = ref('')
const systemPrompt = ref('')
const greetingMessage = ref('')
const submitting = ref(false)

async function handleSubmit() {
  if (!name.value.trim()) {
    alert('请输入角色名称')
    return
  }
  if (!systemPrompt.value.trim()) {
    alert('请输入角色设定')
    return
  }

  submitting.value = true

  try {
    await characterApi.createCharacter({
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      systemPrompt: systemPrompt.value.trim(),
      greetingMessage: greetingMessage.value.trim() || undefined
    })

    alert('创建成功')
    router.back()
  } catch (err: any) {
    alert(err.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- 顶部导航 -->
    <div class="flex items-center px-4 py-3 bg-white border-b border-gray-200 safe-area-top">
      <button class="text-gray-600 mr-3" @click="goBack">←</button>
      <span class="text-lg font-medium">创建角色</span>
    </div>

    <div class="p-4">
      <div class="bg-white rounded-xl p-4 space-y-4">
        <!-- 名称 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            角色名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="给角色起个名字"
            class="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
          />
        </div>

        <!-- 描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            角色描述
          </label>
          <textarea
            v-model="description"
            placeholder="简单描述一下这个角色..."
            rows="2"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- 系统提示词 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            角色设定 <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="systemPrompt"
            placeholder="详细描述角色的性格、背景、说话风格等..."
            rows="4"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary resize-none"
          ></textarea>
          <p class="text-xs text-gray-400 mt-1">
            这是角色的核心设定，会影响 AI 的回复风格
          </p>
        </div>

        <!-- 问候语 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            开场白
          </label>
          <textarea
            v-model="greetingMessage"
            placeholder="角色见到用户时的第一句话..."
            rows="2"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary resize-none"
          ></textarea>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button
        class="w-full mt-6 h-12 bg-primary text-white rounded-full font-semibold disabled:opacity-50"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '创建中...' : '创建角色' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}
</style>
