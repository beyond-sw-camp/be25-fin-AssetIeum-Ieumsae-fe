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
          <h2 class="text-base font-semibold text-text-main">알림 설정</h2>
          <p class="mt-1 text-sm text-text-sub">
            받고 싶은 알림 유형과 보조 수신 방식을 선택합니다.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <label
          v-for="option in notificationPreferenceOptions"
          :key="option.key"
          class="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-secondary"
        >
          <span>
            <span class="block text-sm font-semibold text-text-main">{{ option.label }}</span>
            <span class="mt-1 block text-xs leading-5 text-text-sub">{{ option.description }}</span>
          </span>
          <input
            v-model="notificationPreferences[option.key]"
            type="checkbox"
            class="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
          />
        </label>
      </div>

      <div
        v-if="notificationPreferenceMessage"
        class="mt-4 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-semibold text-success"
      >
        {{ notificationPreferenceMessage }}
      </div>

      <div class="mt-5 flex justify-end">
        <Button variant="outline" @click="saveNotificationPreferences">
          저장
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
import { computed, onMounted, reactive, ref } from 'vue'
import { BellRing, KeyRound, Settings2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { ApiError, purchaseApi } from '@/api'
import Button from '@/components/common/Button.vue'
import { usePermission } from '@/composables/usePermission'
import type {
  NotificationPreferences,
  PurchasePolicy,
  PurchasePolicyMode,
} from '@/types'

interface PurchasePolicyForm {
  purchaseMode: PurchasePolicyMode
  allowDirectPurchase: boolean
  allowParallelOperation: boolean
  overPercentageLimit: number
}

type NotificationPreferenceKey = keyof NotificationPreferences

const router = useRouter()
const { canManagePurchasePolicy } = usePermission()

const NOTIFICATION_PREFERENCES_KEY = 'assetIeumNotificationPreferences'

const defaultNotificationPreferences: NotificationPreferences = {
  system: true,
  ticketStatus: true,
  assetReturnDue: true,
  intangibleExpiration: true,
  inspection: true,
  budgetThreshold: true,
  email: false,
}

const notificationPreferenceOptions: Array<{
  key: NotificationPreferenceKey
  label: string
  description: string
}> = [
  {
    key: 'system',
    label: '서비스 공지',
    description: '점검, 정책 변경 등 시스템에서 보내는 안내를 받습니다.',
  },
  {
    key: 'ticketStatus',
    label: '티켓 상태 변경',
    description: '승인, 반려, 처리 완료 등 내 요청의 상태 변화를 받습니다.',
  },
  {
    key: 'assetReturnDue',
    label: '자산 반납 예정',
    description: '대여 자산의 반납 예정일이 가까워지면 알림을 받습니다.',
  },
  {
    key: 'intangibleExpiration',
    label: '무형자산 만료 예정',
    description: '라이선스와 구독 만료 예정 알림을 받습니다.',
  },
  {
    key: 'inspection',
    label: '전수조사',
    description: '전수조사 시작과 응답 요청 알림을 받습니다.',
  },
  {
    key: 'budgetThreshold',
    label: '예산 기준',
    description: '예산 사용률과 한도 관련 알림을 받습니다.',
  },
  {
    key: 'email',
    label: '이메일 보조 수신',
    description: '중요 알림을 이메일로도 함께 받습니다.',
  },
]

const notificationPreferences = reactive<NotificationPreferences>({
  ...defaultNotificationPreferences,
})
const notificationPreferenceMessage = ref('')

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

onMounted(() => {
  loadNotificationPreferences()

  if (canManagePurchasePolicy.value) {
    void loadPolicy()
  }
})

function loadNotificationPreferences() {
  const saved = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY)
  if (!saved) return

  try {
    Object.assign(notificationPreferences, {
      ...defaultNotificationPreferences,
      ...JSON.parse(saved),
    })
  } catch {
    Object.assign(notificationPreferences, defaultNotificationPreferences)
  }
}

function saveNotificationPreferences() {
  localStorage.setItem(
    NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify(notificationPreferences),
  )
  notificationPreferenceMessage.value = '알림 설정이 저장되었습니다.'

  window.setTimeout(() => {
    notificationPreferenceMessage.value = ''
  }, 3000)
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
