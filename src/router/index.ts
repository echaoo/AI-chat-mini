import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { title: 'AI 陪伴' }
    },
    {
      path: '/characters',
      name: 'characters',
      component: () => import('../views/Characters.vue'),
      meta: { title: '选择角色' }
    },
    {
      path: '/characters/select',
      name: 'character-select',
      component: () => import('../views/CharacterSelect.vue'),
      meta: { title: '角色选择' }
    },
    {
      path: '/characters/create',
      name: 'create-character',
      component: () => import('../views/CreateCharacter.vue'),
      meta: { title: '创建角色' }
    },
    {
      path: '/chat/:id?',
      name: 'chat',
      component: () => import('../views/Chat.vue'),
      meta: { title: '聊天' }
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: () => import('../views/Conversations.vue'),
      meta: { title: '对话历史' }
    }
  ]
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || 'AI 陪伴'
  next()
})

export default router
