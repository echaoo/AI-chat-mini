<template>
  <div class="page-shell login-view-page">
    <div class="page-inner login-view">
      <OverlayHeader title="邮箱登录" :show-back="showBack" @back="goBack" />

      <form class="login-form glass-panel" aria-label="邮箱登录" @submit.prevent="submit">
        <label class="login-form__field">
          <span class="field-label">邮箱</span>
          <input
            v-model.trim="email"
            class="surface-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="name@example.com"
            :disabled="submitting"
          />
        </label>

        <p v-if="errorMessage" class="field-help field-help--error">{{ errorMessage }}</p>

        <button class="brand-button login-form__submit" type="submit" :disabled="submitting">
          {{ submitting ? '登录中' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OverlayHeader from '@/components/common/OverlayHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const email = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const showBack = computed(() => Boolean(window.history.state?.back))
const redirectPath = computed(() => (typeof route.query.redirect === 'string' ? route.query.redirect : '/'))

async function submit() {
  errorMessage.value = ''

  if (!EMAIL_PATTERN.test(email.value)) {
    errorMessage.value = '请输入有效邮箱'
    return
  }

  submitting.value = true

  try {
    await authStore.emailLogin(email.value)
    uiStore.notify('登录成功', 'success')
    router.replace(redirectPath.value === '/login' ? '/' : redirectPath.value)
  } catch (error) {
    errorMessage.value = (error as Error).message || '登录失败'
  } finally {
    submitting.value = false
  }
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
.login-view-page {
  background: rgba(26, 18, 26, 0.46);
}

.login-view {
  display: grid;
  gap: 24px;
  width: 100%;
}

.login-form {
  width: min(calc(100% - 32px), 480px);
  justify-self: center;
  display: grid;
  gap: 16px;
  padding: 24px;
}

.login-form__field {
  display: grid;
  gap: 8px;
}

.login-form__submit {
  width: 100%;
}

.login-form__submit:disabled,
.surface-input:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

@media (max-width: 720px) {
  .login-form {
    padding: 16px;
  }
}
</style>
