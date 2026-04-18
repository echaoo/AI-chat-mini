import { defineStore } from 'pinia'
import { TEST_TOKEN } from '@/constants/env'
import { STORAGE_KEYS } from '@/constants/storage'
import { authApi } from '@/services/api'
import type { UserInfo } from '@/types'
import { getJson, getString, setJson, setString } from '@/utils/storage'

const MOCK_USER: UserInfo = {
  id: 0,
  name: '体验用户',
  avatarUrl: '',
  points: 9999,
  provider: 'mock'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    userInfo: null as UserInfo | null,
    isLoggedIn: false,
    isReady: false
  }),
  actions: {
    async bootstrap() {
      if (this.isReady) return

      const cachedToken = getString(STORAGE_KEYS.token)
      this.token = cachedToken || TEST_TOKEN
      this.userInfo = getJson<UserInfo>(STORAGE_KEYS.userInfo) || MOCK_USER
      this.isLoggedIn = true

      setString(STORAGE_KEYS.token, this.token)
      setJson(STORAGE_KEYS.userInfo, this.userInfo)

      try {
        const remoteUser = await authApi.getMe()
        this.userInfo = remoteUser
        setJson(STORAGE_KEYS.userInfo, remoteUser)
      } catch (error) {
        // H5 首版先允许测试 token 直通，拉不到用户信息时保留本地 mock。
      } finally {
        this.isReady = true
      }
    },
    setToken(token: string) {
      this.token = token
      this.isLoggedIn = Boolean(token)
      setString(STORAGE_KEYS.token, token)
    }
  }
})
