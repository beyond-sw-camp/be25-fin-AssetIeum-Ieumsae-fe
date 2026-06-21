import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores'
import { AUTH_EXPIRED_EVENT } from './utils/authSession'

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
  .catch(() => {
    // 개발용 mock 정리 실패가 실제 화면 렌더링을 막지 않도록 앱은 계속 시작한다.
  })

const app = createApp(App)
const pinia = createPinia()

function showFatalError(error: unknown) {
  const root = document.getElementById('app')
  const rawMessage = error instanceof Error
    ? error.message
    : '알 수 없는 화면 오류가 발생했습니다.'
  const message = rawMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  if (!root) return

  root.innerHTML = `
    <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #f8fafc; color: #111827;">
      <section style="width: 100%; max-width: 420px; border: 1px solid #fecaca; border-radius: 12px; background: #fff1f2; padding: 24px; text-align: center;">
        <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 700;">화면을 불러오지 못했습니다.</p>
        <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${message}</p>
      </section>
    </main>
  `
}

app.config.errorHandler = (error) => {
  showFatalError(error)
}

window.addEventListener('error', (event) => {
  showFatalError(event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  showFatalError(event.reason)
})

app.use(pinia)

const auth = useAuthStore(pinia)
await auth.restoreSession()

app.use(router)
await router.isReady()

window.addEventListener(AUTH_EXPIRED_EVENT, () => {
  const currentRoute = router.currentRoute.value
  const isMobileRoute = currentRoute.path.startsWith('/mobile')
  const loginPath = isMobileRoute ? '/mobile/login' : '/login'

  auth.clearAuth()

  if (currentRoute.path !== loginPath) {
    router.replace({
      path: loginPath,
      query: { redirect: currentRoute.fullPath },
    })
  }
})

app.mount('#app')
