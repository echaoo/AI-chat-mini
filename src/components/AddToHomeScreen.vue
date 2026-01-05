<template>
  <Transition name="slide-up">
    <div
      v-if="showPrompt"
      class="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t border-gray-200"
      :style="{ paddingBottom: safeAreaBottom + 'px' }"
    >
      <div class="p-4">
        <div class="flex items-start gap-3">
          <!-- 应用图标 -->
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            AI
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 mb-1">添加到主屏幕</h3>
            <p class="text-sm text-gray-600 leading-relaxed" v-if="isIOS">
              点击 <span class="inline-flex items-center mx-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                </svg>
              </span> 然后选择"添加到主屏幕"
            </p>
            <p class="text-sm text-gray-600 leading-relaxed" v-else-if="canInstall">
              点击下方按钮即可安装应用
            </p>
            <p class="text-sm text-gray-600 leading-relaxed" v-else>
              点击浏览器菜单 <span class="inline-flex items-center mx-1 font-semibold">⋮</span> 选择"添加到桌面"
            </p>
          </div>

          <!-- 关闭按钮 -->
          <button
            @click="dismiss"
            class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Android Chrome 安装按钮 -->
        <button
          v-if="canInstall && !isIOS"
          @click="install"
          class="mt-3 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all active:scale-95"
        >
          立即安装
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const showPrompt = ref(false)
const deferredPrompt = ref<any>(null)
const safeAreaBottom = ref(0)

// 检测是否为 iOS
const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
})

// 检测是否为 Android
const isAndroid = computed(() => {
  return /Android/i.test(navigator.userAgent)
})

// 是否可以使用 PWA 安装提示
const canInstall = computed(() => {
  return deferredPrompt.value !== null
})

// 检查是否已经安装
const isInstalled = () => {
  // 检查是否在独立模式下运行（已安装）
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  // iOS Safari 检查
  if ((navigator as any).standalone) {
    return true
  }
  return false
}

// 检查是否应该显示提示
const shouldShowPrompt = () => {
  // 如果已安装，不显示
  if (isInstalled()) {
    return false
  }

  // 检查用户是否已经关闭过提示
  const dismissed = localStorage.getItem('a2hs-dismissed')
  if (dismissed) {
    const dismissedTime = parseInt(dismissed)
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
    // 如果关闭后不到 7 天，不显示
    if (daysSinceDismissed < 7) {
      return false
    }
  }

  return true
}

// 安装应用
const install = async () => {
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  if (outcome === 'accepted') {
    console.log('用户接受了安装提示')
  }

  deferredPrompt.value = null
  showPrompt.value = false
}

// 关闭提示
const dismiss = () => {
  showPrompt.value = false
  localStorage.setItem('a2hs-dismissed', Date.now().toString())
}

// 获取底部安全区域
const updateSafeArea = () => {
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  safeAreaBottom.value = parseInt(
    computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'
  )
}

onMounted(() => {
  // 更新安全区域
  updateSafeArea()
  window.addEventListener('resize', updateSafeArea)

  // 监听 beforeinstallprompt 事件（Android Chrome）
  let hasBeforeInstallPrompt = false
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    hasBeforeInstallPrompt = true

    // 延迟显示提示，给用户一些使用应用的时间
    if (shouldShowPrompt()) {
      setTimeout(() => {
        showPrompt.value = true
      }, 3000) // 3秒后显示
    }
  })

  // iOS 设备上，延迟显示提示
  if (isIOS.value && shouldShowPrompt()) {
    setTimeout(() => {
      showPrompt.value = true
    }, 5000) // 5秒后显示
  }

  // Android 设备（不支持 PWA 的浏览器）也显示手动引导
  if (isAndroid.value && shouldShowPrompt()) {
    setTimeout(() => {
      // 如果 3 秒后还没有触发 beforeinstallprompt，说明浏览器不支持 PWA
      if (!hasBeforeInstallPrompt) {
        showPrompt.value = true
      }
    }, 3000)
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
