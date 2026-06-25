<template>
  <div class="page-container h-full overflow-y-auto">
    <div class="page-header">
      <h1 class="page-title">설정</h1>
      <p class="page-subtitle">계정과 서비스 이용 설정을 관리합니다.</p>
    </div>

    <section class="card mx-0 max-w-3xl p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary "
            aria-hidden="true" 
          >
            <div class="p-3">
              <KeyRound :size="20" />
            </div>  
          </div>
          <div>
            <h2 class="text-base font-semibold text-text-main">비밀번호</h2>
            <p class="mt-1 text-sm text-text-sub">
              계정 보안을 위해 비밀번호를 변경합니다.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          @click="router.push({ name: 'PasswordChange' })"
        >
          비밀번호 변경
        </Button>
      </div>
    </section>

    <section class="card mx-0 mt-4 max-w-3xl p-6">
      <div class="mb-5 flex min-w-0 items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <BellRing :size="20" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-text-main">알림 구독</h2>
          <p class="mt-1 text-sm text-text-sub">
            실시간 알림 수신 연결 상태를 관리합니다.
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-surface-secondary px-4 py-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-bold text-text-main">현재 구독 상태</p>
            <p class="mt-1 text-sm text-text-sub">{{ notificationSubscriptionSummary }}</p>
          </div>
          <span
            class="w-fit rounded-full px-3 py-1 text-xs font-semibold"
            :class="isNotificationSubscribed ? 'bg-success/10 text-success' : 'bg-surface text-text-sub'"
          >
            {{ isNotificationSubscribed ? '구독 중' : '연결 전' }}
          </span>
        </div>
      </div>

      <div
        v-if="notificationSubscriptionError"
        class="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger"
      >
        {{ notificationSubscriptionError }}
      </div>

      <div
        v-if="latestNotification"
        class="mt-4 rounded-xl border border-border bg-surface px-4 py-3"
      >
        <p class="text-xs font-semibold text-text-sub">최근 수신 알림</p>
        <p class="mt-2 text-sm font-bold text-text-main">{{ latestNotification.title }}</p>
        <p class="mt-1 text-sm text-text-sub">{{ latestNotification.content }}</p>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <Button
          v-if="isNotificationSubscribed"
          variant="outline"
          @click="disconnectNotificationSubscription"
        >
          구독 해제
        </Button>
        <Button
          :variant="isNotificationSubscribed ? 'outline' : 'primary'"
          @click="connectNotificationSubscription"
        >
          {{ isNotificationSubscribed ? '다시 연결' : '구독 연결' }}
        </Button>
      </div>
    </section>

    <section v-if="canManagePurchasePolicy" class="card mx-0 mt-4 max-w-3xl p-6">
      <div class="mb-5 flex min-w-0 items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Settings2 :size="20" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-text-main">구매 운영 정책</h2>
          <p class="mt-1 text-sm text-text-sub">
            구매 요청 방식과 직접 구매 허용 범위를 설정합니다.
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-border bg-surface-secondary px-4 py-3">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-bold text-text-main">현재 적용 정책</p>
              <p class="mt-1 text-sm text-text-sub">
                {{ currentPolicySummary }}
              </p>
            </div>
            <span class="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-sub">
              {{ isPolicyLoading ? '조회 중' : currentPolicy ? '적용 중' : '미조회' }}
            </span>
          </div>
        </div>

        <div>
          <p class="mb-2 text-sm font-semibold text-text-main">구매 방식</p>
          <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
            <button
              v-for="option in purchaseModeOptions"
              :key="option.value"
              type="button"
              :class="[
                'rounded-xl border px-4 py-3 text-left transition-colors',
                policyForm.purchaseMode === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text-main hover:bg-surface-secondary',
              ]"
              @click="setPurchaseMode(option.value)"
            >
              <span class="block text-sm font-bold">{{ option.label }}</span>
              <span class="mt-1 block text-xs text-text-sub">{{ option.description }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <span class="text-sm font-semibold text-text-main">직접 구매 허용</span>
            <input
              v-model="policyForm.allowDirectPurchase"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <span class="text-sm font-semibold text-text-main">병행 운영 허용</span>
            <input
              v-model="policyForm.allowParallelOperation"
              type="checkbox"
              class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-semibold text-text-main">예상 금액 초과 허용률</span>
          <div class="flex items-center gap-2">
            <input
              v-model.number="policyForm.overPercentageLimit"
              type="number"
              min="0"
              class="h-9 w-32 rounded-xl border border-border bg-surface px-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span class="text-sm font-semibold text-text-sub">%</span>
          </div>
        </label>

        <div
          v-if="policyError"
          class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger"
        >
          {{ policyError }}
        </div>

        <div
          v-if="policySavedMessage"
          class="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-semibold text-success"
        >
          {{ policySavedMessage }}
        </div>

        <div class="flex justify-end">
          <Button :loading="isPolicySaving" :disabled="isPolicySaving || isPolicyLoading" @click="savePolicy">
            저장
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { BellRing, KeyRound, Settings2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { ApiError, notificationApi, purchaseApi } from '@/api'
import Button from '@/components/common/Button.vue'
import { useEventSource } from '@/composables/useEventSource'
import { usePermission } from '@/composables/usePermission'
import type {
  PurchasePolicy,
  PurchasePolicyMode,
  ServerNotification,
} from '@/types'

interface PurchasePolicyForm {
  purchaseMode: PurchasePolicyMode
  allowDirectPurchase: boolean
  allowParallelOperation: boolean
  overPercentageLimit: number
}

const router = useRouter()
const { canManagePurchasePolicy } = usePermission()

const notificationSubscription = useEventSource()
const notificationSubscriptionError = ref('')
const latestNotification = ref<ServerNotification | null>(null)
let offNotificationEvent: (() => void) | null = null
let offMessageEvent: (() => void) | null = null

const purchaseModeOptions: Array<{
  label: string
  value: PurchasePolicyMode
  description: string
}> = [
  {
    label: '구매자산팀 구매',
    value: 'ONLY_ASSET_TEAM',
    description: '구매자산팀이 구매를 전담합니다.',
  },
  {
    label: '직접 구매',
    value: 'ONLY_DIRECT_PURCHASE',
    description: '요청자가 직접 구매 후 증빙합니다.',
  },
  {
    label: '병행 운영',
    value: 'PARALLEL',
    description: '두 구매 방식을 함께 사용합니다.',
  },
]

const policyForm = reactive<PurchasePolicyForm>({
  purchaseMode: 'PARALLEL',
  allowDirectPurchase: true,
  allowParallelOperation: true,
  overPercentageLimit: 10,
})
const isPolicyLoading = ref(false)
const isPolicySaving = ref(false)
const policyError = ref('')
const policySavedMessage = ref('')
const currentPolicy = ref<PurchasePolicy | null>(null)

const currentPolicySummary = computed(() => {
  if (!currentPolicy.value) {
    return '현재 정책 조회 API가 추가되면 이 영역에 적용 중인 정책을 표시합니다.'
  }

  return `${getPurchaseModeLabel(currentPolicy.value.purchaseMethod)} · 초과 허용률 ${currentPolicy.value.overPercentageLimit}%`
})

const isNotificationSubscribed = computed(() => notificationSubscription.isConnected.value)

const notificationSubscriptionSummary = computed(() => (
  isNotificationSubscribed.value
    ? '실시간 알림을 받을 수 있습니다.'
    : '실시간 알림 구독이 연결되어 있지 않습니다.'
))

onMounted(() => {
  if (canManagePurchasePolicy.value) {
    void loadPolicy()
  }
})

onUnmounted(() => {
  offNotificationEvent?.()
  offMessageEvent?.()
})

function connectNotificationSubscription() {
  notificationSubscriptionError.value = ''
  offNotificationEvent?.()
  offMessageEvent?.()

  try {
    notificationSubscription.connect(notificationApi.getSubscribePath())
    offNotificationEvent = notificationSubscription.on<ServerNotification>('notification', handleSubscribedNotification)
    offMessageEvent = notificationSubscription.on<ServerNotification>('message', handleSubscribedNotification)
  } catch (error) {
    notificationSubscriptionError.value = getErrorMessage(error, '알림 구독 연결에 실패했습니다.')
  }
}

function disconnectNotificationSubscription() {
  offNotificationEvent?.()
  offMessageEvent?.()
  offNotificationEvent = null
  offMessageEvent = null
  notificationSubscription.disconnect()
}

function handleSubscribedNotification(event: { data: ServerNotification }) {
  latestNotification.value = event.data
}

function setPurchaseMode(value: PurchasePolicyMode) {
  policyForm.purchaseMode = value
  policyForm.allowDirectPurchase = value !== 'ONLY_ASSET_TEAM'
  policyForm.allowParallelOperation = value === 'PARALLEL'
}

async function savePolicy() {
  isPolicySaving.value = true
  policyError.value = ''
  policySavedMessage.value = ''

  try {
    const response = await purchaseApi.updatePolicy({
      purchaseMethod: policyForm.purchaseMode,
      overPercentageLimit: Number(policyForm.overPercentageLimit),
    })
    currentPolicy.value = response.data
    applyPolicyToForm(response.data)
    policySavedMessage.value = '구매 운영 정책이 저장되었습니다.'
  } catch (error) {
    policyError.value = getErrorMessage(error, '구매 운영 정책 저장에 실패했습니다.')
  } finally {
    isPolicySaving.value = false
  }
}

async function loadPolicy() {
  isPolicyLoading.value = true
  policyError.value = ''
  policySavedMessage.value = ''

  try {
    const response = await purchaseApi.getPolicy()
    currentPolicy.value = response.data
    applyPolicyToForm(response.data)
  } catch (error) {
    policyError.value = getErrorMessage(error, '구매 운영 정책 조회에 실패했습니다.')
  } finally {
    isPolicyLoading.value = false
  }
}

function applyPolicyToForm(policy: PurchasePolicy) {
  policyForm.purchaseMode = policy.purchaseMethod
  policyForm.allowDirectPurchase = policy.purchaseMethod !== 'ONLY_ASSET_TEAM'
  policyForm.allowParallelOperation = policy.purchaseMethod === 'PARALLEL'
  policyForm.overPercentageLimit = Number(policy.overPercentageLimit)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}

function getPurchaseModeLabel(value: PurchasePolicyMode) {
  return purchaseModeOptions.find((option) => option.value === value)?.label ?? value
}
</script>
