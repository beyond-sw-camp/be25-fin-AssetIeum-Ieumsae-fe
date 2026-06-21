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
  let rawMessage = ''
  
  if (error instanceof Error) {
    rawMessage = error.stack || error.message
  } else if (typeof error === 'object' && error !== null) {
    try {
      rawMessage = JSON.stringify(error, null, 2)
    } catch (e) {
      rawMessage = String(error)
    }
  } else {
    rawMessage = String(error) || '알 수 없는 화면 오류가 발생했습니다.'
  }

  const message = rawMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  if (!root) return

  root.innerHTML = `
    <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #f8fafc; color: #111827;">
      <section style="width: 100%; max-width: 600px; border: 1px solid #fecaca; border-radius: 12px; background: #fff1f2; padding: 24px; text-align: left;">
        <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 700; text-align: center;">화면을 불러오지 못했습니다.</p>
        <pre style="margin: 12px 0 0; color: #6b7280; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;">${message}</pre>
      </section>
    </main>
  `
}

app.config.errorHandler = (error) => {
  showFatalError(error)
}

window.addEventListener('error', (event) => {
  const msg = event.error?.message || event.message || ''
  if (typeof msg === 'string' && msg.includes('ResizeObserver')) {
    event.preventDefault()
    return
  }
  showFatalError(event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || event.reason || ''
  if (typeof msg === 'string' && msg.includes('ResizeObserver')) {
    event.preventDefault()
    return
  }
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
