/**
 * 本地存储工具 - 替代 wx.getStorageSync / wx.setStorageSync
 */

export const storage = {
  get<T = any>(key: string): T | null {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  },

  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 忽略错误
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // 忽略错误
    }
  }
}

// 缓存 Key 常量
export const STORAGE_KEYS = {
  GREETING_CACHE: 'greeting_cache',
  HOME_CHARACTER: 'home_character'
}
