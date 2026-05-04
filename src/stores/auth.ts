import { defineStore } from 'pinia'
import { TEST_TOKEN } from '@/constants/env'
import { MESSAGE_CACHE_PREFIX, STORAGE_KEYS } from '@/constants/storage'
import { authApi } from '@/services/api'
import type { UserInfo } from '@/types'
import { getJson, getString, removeStorage, setJson, setString } from '@/utils/storage'

const MOCK_USER: UserInfo = {
  id: 0,
  name: '体验用户',
  avatarUrl: '',
  points: 9999,
  provider: 'mock'
}

const USER_SCOPED_STORAGE_KEYS = [
  STORAGE_KEYS.lastConversationId,
  STORAGE_KEYS.homeCharacter,
  STORAGE_KEYS.chatEntryCharacter,
  STORAGE_KEYS.greetingCache,
  STORAGE_KEYS.favoriteCharacters
]

function clearUserScopedStorage() {
  USER_SCOPED_STORAGE_KEYS.forEach(removeStorage)

  if (typeof window === 'undefined') return

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(MESSAGE_CACHE_PREFIX))
    .forEach(removeStorage)
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
      this.userInfo = getJson<UserInfo>(STORAGE_KEYS.userInfo)
      this.isLoggedIn = Boolean(this.token)

      if (!this.token) {
        this.userInfo = null
        removeStorage(STORAGE_KEYS.userInfo)
        removeStorage(STORAGE_KEYS.userId)
        clearUserScopedStorage()
        this.isReady = true
        return
      }

      setString(STORAGE_KEYS.token, this.token)

      try {
        const remoteUser = await authApi.getMe()
        this.setUserInfo(remoteUser)
      } catch (error) {
        if (this.token === TEST_TOKEN) {
          this.setUserInfo(this.userInfo || MOCK_USER)
        } else {
          this.logout()
        }
      } finally {
        this.isReady = true
      }
    },
    async emailLogin(email: string) {
      const result = await authApi.emailLogin({ email })

      clearUserScopedStorage()
      this.setToken(result.token)
      this.setUserInfo(result.user)
    },
    setToken(token: string) {
      this.token = token
      this.isLoggedIn = Boolean(token)
      setString(STORAGE_KEYS.token, token)
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      setJson(STORAGE_KEYS.userInfo, userInfo)
      setString(STORAGE_KEYS.userId, String(userInfo.id))
    },
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false

      removeStorage(STORAGE_KEYS.token)
      removeStorage(STORAGE_KEYS.userInfo)
      removeStorage(STORAGE_KEYS.userId)
      clearUserScopedStorage()
    },
    syncPoints(points: number) {
      if (!Number.isFinite(points)) return

      const nextUserInfo = this.userInfo
        ? {
            ...this.userInfo,
            points
          }
        : {
            ...MOCK_USER,
            points
          }

      this.setUserInfo(nextUserInfo)
    }
  }
})
