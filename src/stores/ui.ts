import { defineStore } from 'pinia'

type NoticeType = 'info' | 'success' | 'error'

export interface Notice {
  id: number
  message: string
  type: NoticeType
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    notices: [] as Notice[],
    noticeSeed: 1
  }),
  actions: {
    notify(message: string, type: NoticeType = 'info', duration = 2200) {
      const id = this.noticeSeed++

      this.notices.push({ id, message, type })

      window.setTimeout(() => {
        this.removeNotice(id)
      }, duration)
    },
    removeNotice(id: number) {
      this.notices = this.notices.filter((item) => item.id !== id)
    }
  }
})
