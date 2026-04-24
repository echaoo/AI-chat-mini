import { defineStore } from 'pinia'

type NoticeType = 'info' | 'success' | 'error'
type ConfirmVariant = 'default' | 'danger'

export interface Notice {
  id: number
  message: string
  type: NoticeType
}

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmDialogState {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: ConfirmVariant
}

function createConfirmDialogState(): ConfirmDialogState {
  return {
    open: false,
    title: '请确认',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    variant: 'default'
  }
}

let confirmResolver: ((value: boolean) => void) | null = null

export const useUiStore = defineStore('ui', {
  state: () => ({
    notices: [] as Notice[],
    noticeSeed: 1,
    confirmDialog: createConfirmDialogState()
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
    },
    confirm(options: ConfirmOptions) {
      if (confirmResolver) {
        confirmResolver(false)
        confirmResolver = null
      }

      this.confirmDialog = {
        open: true,
        title: options.title || '请确认',
        message: options.message,
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        variant: options.variant || 'default'
      }

      return new Promise<boolean>((resolve) => {
        confirmResolver = resolve
      })
    },
    confirmCurrentDialog() {
      this.finishConfirm(true)
    },
    cancelCurrentDialog() {
      this.finishConfirm(false)
    },
    finishConfirm(result: boolean) {
      this.confirmDialog = createConfirmDialogState()
      confirmResolver?.(result)
      confirmResolver = null
    }
  }
})
