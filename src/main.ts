import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@/styles/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

async function bootstrap() {
  const authStore = useAuthStore(pinia)
  await authStore.bootstrap()
  app.mount('#app')
}

bootstrap()
