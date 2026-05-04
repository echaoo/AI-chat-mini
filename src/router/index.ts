import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '邮箱登录' }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'AI 陪伴' }
  },
  {
    path: '/characters',
    name: 'characters',
    component: () => import('@/views/CharactersView.vue'),
    meta: { title: '选择角色' }
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/views/ChatConversationView.vue'),
    meta: { title: '聊天' }
  },
  {
    path: '/chat/settings',
    name: 'chat-settings',
    component: () => import('@/views/ChatSettingsView.vue'),
    meta: { title: '聊天设置' }
  },
  {
    path: '/conversations',
    name: 'conversations',
    component: () => import('@/views/ConversationsView.vue'),
    meta: { title: '对话历史' }
  },
  {
    path: '/chat-characters',
    name: 'chat-characters',
    component: () => import('@/views/ChattedCharactersView.vue'),
    meta: { title: '聊过的角色' }
  },
  {
    path: '/invite',
    name: 'invite',
    component: () => import('@/views/InviteView.vue'),
    meta: { title: '邀请' }
  },
  {
    path: '/create-character',
    name: 'create-character',
    component: () => import('@/views/CreateCharacterView.vue'),
    meta: { title: '创建角色' }
  },
  {
    path: '/me',
    name: 'me',
    component: () => import('@/views/MeView.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  if (to.name === 'login') return true

  const authStore = useAuthStore()

  if (!authStore.isLoggedIn) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'AI 陪伴'
  document.title = title
})

export default router
