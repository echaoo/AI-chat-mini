import { createStore } from '@mpxjs/store'
import mpx from '@mpxjs/core'
import { authApi } from './api'

let loginPromise: Promise<any> | null = null

interface UserInfo {
  id: number
  name: string
  avatarUrl: string
  provider: string
  points: number
  phone?: string
  status: string
  createdAt: string
}

interface StoreState {
  token: string
  userInfo: UserInfo | null
  isLoggedIn: boolean
}

const store = createStore({
  state: {
    token: '',
    userInfo: null as UserInfo | null,
    isLoggedIn: false
  } as StoreState,
  mutations: {
    setState(state: StoreState, payload: Partial<StoreState>) {
      Object.assign(state, payload)
    }
  },
  actions: {
    async login(context: any, payload: { forceLogin?: boolean; invitationCode?: string; nickName?: string; avatarUrl?: string } = {}) {
      // 如果已有 token 且不是强制登录，直接返回
      if (context.state.token && !payload.forceLogin) {
        return { token: context.state.token }
      }

      // 如果已有登录请求在进行中，直接返回该 promise
      if (loginPromise && !payload.forceLogin) {
        return loginPromise
      }

      loginPromise = new Promise((resolve, reject) => {
        mpx.login().then(({ code }: { code: string }) => {
          if (!code) {
            reject(new Error('获取登录凭证失败'))
            loginPromise = null
            return
          }

          // 调用后端登录接口（静默登录，不传用户信息）
          authApi.wechatLogin({
            code,
            nickName: payload.nickName,
            avatarUrl: payload.avatarUrl
          }).then(result => {
            if (result && result.token) {
              // 检查是否是新用户或不同用户
              const oldUserId = mpx.getStorageSync('userId')
              const newUserId = result.user.id

              // 保存 token 和用户信息到 store
              context.commit('setState', {
                token: result.token,
                userInfo: result.user,
                isLoggedIn: true
              })

              // 同时保存到本地存储
              mpx.setStorageSync('token', result.token)
              mpx.setStorageSync('userInfo', result.user)
              mpx.setStorageSync('userId', newUserId)

              // 如果是不同用户，清除旧的对话缓存
              if (oldUserId && oldUserId !== newUserId) {
                try {
                  mpx.removeStorageSync('last_conversation_id')
                  mpx.removeStorageSync('home_character')
                  mpx.removeStorageSync('last_conversation_character')
                  mpx.removeStorageSync('greeting_cache')
                  console.log('检测到用户切换，已清除旧的对话缓存')
                } catch (e) {
                  console.warn('清除缓存失败:', e)
                }
              }

              resolve(result)
            } else {
              reject(new Error('登录失败'))
            }

            loginPromise = null
          }).catch(error => {
            console.error('登录失败:', error)
            loginPromise = null
            reject(error)
          })
        }).catch((error: any) => {
          console.error('获取登录凭证失败:', error)
          loginPromise = null
          reject(error)
        })
      })

      return loginPromise
    },

    // 统一的API错误处理，检查token过期并重新登录
    async handleApiError(context: any, error: any) {
      const { data } = error

      // 检查是否为token过期错误 (code: 101 或 status: 401)
      if (data && (data.code === 101 || data.status === 401)) {
        console.log('Token已过期，尝试重新登录...', {
          code: data.code,
          status: data.status,
          message: data.message
        })

        try {
          // 强制重新登录
          await context.dispatch('login', { forceLogin: true })
          console.log('重新登录成功')

          // 提示用户
          mpx.showToast({
            title: '登录已刷新',
            icon: 'success',
            duration: 1500
          })

          return { relogin: true }
        } catch (loginError) {
          console.log('重新登录失败:', loginError)

          mpx.showModal({
            title: '登录失败',
            content: '请重新进入小程序',
            showCancel: false
          })

          return { relogin: false, error: loginError }
        }
      }

      return { relogin: false, error: data }
    },

    // 获取用户信息
    async getUserInfo(context: any) {
      try {
        const userInfo = await authApi.getMe()
        context.commit('setState', {
          userInfo
        })
        mpx.setStorageSync('userInfo', userInfo)
        return userInfo
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    }
  }
})

export default store
