import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores'

import './assets/tailwind.css'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter((registration) => registration.active?.scriptURL.includes('mockServiceWorker.js'))
          .map((registration) => registration.unregister()),
      )
    }

    return
  }

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}

await enableMocking()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const auth = useAuthStore(pinia)
await auth.restoreSession()

app.use(router)
await router.isReady()

app.mount('#app')
