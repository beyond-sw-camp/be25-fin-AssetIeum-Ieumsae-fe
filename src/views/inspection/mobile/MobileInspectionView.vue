<template>
  <div
    v-if="renderError"
    class="mx-auto flex h-screen min-h-screen w-full max-w-md flex-col justify-center bg-background px-5 text-text-main md:border-x md:border-border"
  >
    <div class="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
      <p class="text-base font-bold text-danger">
        모바일 화면을 불러오지 못했습니다.
      </p>
      <p class="mt-2 text-sm leading-relaxed text-text-sub">
        {{ renderError }}
      </p>
      <Button class="mt-6 w-full" size="lg" @click="goLogin">
        로그인 화면으로 이동
      </Button>
    </div>
  </div>

  <div v-else class="mx-auto flex h-dvh min-h-dvh w-full max-w-md max-w-[100dvw] flex-col overflow-x-hidden bg-background text-text-main md:border-x md:border-border">
    <header class="shrink-0 border-b border-border bg-surface px-4 py-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-bold text-primary">
            MOBILE INSPECTION
          </p>
          <h1 class="mt-1 text-xl font-bold text-text-main">
            자산 검수
          </h1>
          <p class="mt-2 text-sm leading-relaxed text-text-sub">
            {{ inspectionGuideText }}
          </p>
        </div>

        <button
          v-if="authStore.isAuthenticated"
          type="button"
          class="shrink-0 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-sub transition hover:bg-primary/5 hover:text-primary"
          @click="handleLogout"
        >
          로그아웃
        </button>
        <button
          v-else
          type="button"
          class="shrink-0 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-sub transition hover:bg-primary/5 hover:text-primary"
          @click="goLogin"
        >
          로그인
        </button>
      </div>

      <div
        v-if="isDebugAuth"
        class="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-3 text-xs text-text-sub"
      >
        <p class="font-bold text-text-main">Auth Debug</p>
        <p class="mt-1">isAuthenticated: {{ authStore.isAuthenticated }}</p>
        <p>currentRole: {{ authStore.currentRole || '-' }}</p>
        <p>user.role: {{ authStore.user?.role || '-' }}</p>
        <p>storedRole: {{ storedRole || '-' }}</p>
      </div>

      <div
        v-if="user"
        class="mt-4 flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-3"
      >
        <div class="min-w-0 flex gap-1.5">
          <p class="truncate text-sm font-bold text-text-main">
            {{ user.name }}
          </p>
          <p class="mt-0.5 text-xs text-text-sub">
            {{ user.departmentName || '-' }}
          </p>
        </div>
        <span class="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-primary">
          {{ roleLabel }}
        </span>
      </div>

      <div class="mt-4 grid grid-cols-2 rounded-lg bg-surface-secondary p-1">
        <button
          type="button"
          :class="assetTypeButtonClass('tangible')"
          @click="changeAssetType('tangible')"
        >
          유형자산
        </button>
        <button
          type="button"
          :class="assetTypeButtonClass('intangible')"
          @click="changeAssetType('intangible')"
        >
          무형자산
        </button>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="flex justify-between rounded-lg bg-surface-secondary px-3 py-3">
          <p class="mt-1 text-xs font-semibold text-text-muted">전체</p>
          <p class="text-lg font-bold text-text-main">{{ totalElements }}</p>
        </div>
        <div class="flex justify-between rounded-lg bg-surface-secondary px-3 py-3">
          <p class="text-xs font-semibold text-text-muted">대기</p>
          <p class="text-lg font-bold text-primary">{{ pendingCount }}</p>
        </div>
        <div class="flex justify-between rounded-lg bg-surface-secondary px-3 py-3">
          <p class="text-xs font-semibold text-text-muted">완료</p>
          <p class="text-lg font-bold text-success">{{ respondedCount }}</p>
        </div>
      </div>
    </header>

    <main class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
      <div
        v-if="authIssue"
        class="rounded-lg border border-dashed border-border bg-surface px-5 py-12 text-center"
      >
        <p class="text-base font-bold text-text-main">
          {{ authIssue }}
        </p>
        <p class="mt-2 text-sm leading-relaxed text-text-sub">
          사원 또는 구매자산팀 계정으로 로그인하면 배정된 자산 검수 목록을 확인할 수 있습니다.
        </p>
        <Button class="mt-6 w-full" size="lg" @click="goLogin">
          모바일 로그인으로 이동
        </Button>
      </div>

      <div v-else class="min-w-0 overflow-x-hidden bg-background px-4 pb-3">
        <Button
          v-if="assetType === 'tangible'"
          class="h-13! w-full"
          size="lg"
          @click="isScannerOpen = true"
        >
          <ScanLine :size="18" />
          자산 검수하기
        </Button>
      </div>

      <div v-if="!authIssue && isLoading" class="space-y-3">
        <div
          v-for="index in 4"
          :key="index"
          class="h-28 animate-pulse rounded-lg border border-border bg-surface"
        />
      </div>

      <div
        v-else-if="!authIssue && filteredRows.length === 0"
        class="rounded-lg border border-dashed border-border bg-surface px-5 py-12 text-center"
      >
        <p class="text-sm font-semibold text-text-main">
          {{ emptyText }}
        </p>
        <p class="mt-2 text-xs text-text-sub">
          검수 대상이 생기면 이곳에 표시됩니다.
        </p>
      </div>

      <div v-else-if="!authIssue" class="min-w-0 space-y-3">
        <InspectionTargetCard
          v-for="target in filteredRows"
          :key="target.inspectionTargetId"
          :target="target"
          :selected="selectedTarget?.inspectionTargetId === target.inspectionTargetId"
          @select="selectTarget(target)"
        />
      </div>
    </main>

    <section
      v-if="!authIssue && selectedTarget"
      class="min-w-0 shrink-0 border-t border-border bg-surface px-4 py-4"
    >
      <InspectionResponseForm
        v-model:response-content="form.responseContent"
        v-model:follow-up-requests="form.followUpRequests"
        :target="selectedTarget"
        :submitting="isSubmitting"
        :disabled="isResponseDisabled"
        @submit="handleSubmit"
      />

      <p v-if="responseAvailabilityText" class="mt-3 text-xs leading-relaxed text-text-sub">
        {{ responseAvailabilityText }}
      </p>

      <p
        v-if="message"
        :class="[
          'mt-3 rounded-lg border px-4 py-3 text-sm',
          isSuccess
            ? 'border-success/30 bg-success/5 text-success'
            : 'border-danger/30 bg-danger/5 text-danger',
        ]"
      >
        {{ message }}
      </p>
    </section>

    <InspectionQrScanner
      v-if="assetType === 'tangible' && isScannerOpen"
      @detected="handleDetectedCode"
      @close="isScannerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onErrorCaptured, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ScanLine } from 'lucide-vue-next'

import Button from '@/components/common/Button.vue'
import InspectionQrScanner from '@/components/inspection/mobile/InspectionQrScanner.vue'
import InspectionResponseForm from '@/components/inspection/mobile/InspectionResponseForm.vue'
import InspectionTargetCard, {
  type MobileInspectionTarget,
} from '@/components/inspection/mobile/InspectionTargetCard.vue'
import {
  intangibleInspectionApi,
  tangibleInspectionApi,
} from '@/api/inspection.api'
import { ApiError } from '@/api/client'
import type { EmployeeInspectionTargetResponse, InspectionStatus } from '@/types/inspection'
import { useAuthStore } from '@/stores'
import { resolveInspectionStatus } from '@/utils/inspectionStatus'
import { ROLE_LABEL } from '@/utils/labels'

type MobileAssetType = 'tangible' | 'intangible'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const assetType = ref<MobileAssetType>(route.query.assetType === 'intangible' ? 'intangible' : 'tangible')
const targets = ref<MobileInspectionTarget[]>([])
const selectedTarget = ref<MobileInspectionTarget | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const message = ref('')
const loadError = ref('')
const renderError = ref('')
const totalElements = ref(0)
const keyword = ref('')
const respondedFilter = ref('')
const isScannerOpen = ref(false)
const user = computed(() => authStore.user)
const roleLabel = computed(() => user.value ? ROLE_LABEL[user.value.role] : '')
const isDebugAuth = computed(() => route.query.debugAuth === '1')
const storedRole = computed(() => getStoredRole())
const canUseMobileInspection = computed(() => (
  authStore.isAuthenticated && canUseMobileInspectionRole(authStore.currentRole)
))
const authIssue = computed(() => {
  if (!authStore.isAuthenticated) return '로그인이 필요합니다.'
  if (!canUseMobileInspectionRole(authStore.currentRole)) {
    return '모바일 자산 검수는 사원 또는 구매자산팀 계정으로 이용할 수 있습니다.'
  }
  return ''
})

const form = reactive({
  responseContent: '',
  followUpRequests: false,
})

function getStoredRole() {
  try {
    const authUser = localStorage.getItem('authUser')
    if (!authUser) return ''

    const parsedUser = JSON.parse(authUser) as { role?: unknown }
    return typeof parsedUser.role === 'string' ? parsedUser.role : ''
  } catch {
    return ''
  }
}

function isAssetTeamRole(role: string | null | undefined) {
  return role === 'ASSET_TEAM' || role === 'ASSET_MANAGER' || role === 'ADMIN'
}

function canUseMobileInspectionRole(role: string | null | undefined) {
  return role === 'EMPLOYEE' || isAssetTeamRole(role)
}

const inspectionApi = computed(() => (
  assetType.value === 'tangible'
    ? tangibleInspectionApi
    : intangibleInspectionApi
))

const pendingCount = computed(() => targets.value.filter((target) => !target.isResponded).length)
const respondedCount = computed(() => targets.value.filter((target) => target.isResponded).length)
const emptyText = computed(() => loadError.value || '배정된 검수 대상 자산이 없습니다.')
const inspectionGuideText = computed(() => (
  assetType.value === 'tangible'
    ? 'QR을 스캔하거나 목록에서 자산을 선택해 검수 결과를 등록해주세요.'
    : '목록에서 무형자산을 선택해 검수 결과를 등록해주세요.'
))
const isResponseDisabled = computed(() => (
  !selectedTarget.value
  || selectedTarget.value.isResponded
  || selectedTarget.value.inspectionStatus === 'READY'
  || selectedTarget.value.inspectionStatus === 'COMPLETED'
  || selectedTarget.value.inspectionStatus === 'CLOSED'
))
const responseAvailabilityText = computed(() => {
  if (!selectedTarget.value) return ''
  if (selectedTarget.value.isResponded) return '이미 응답이 등록된 자산입니다.'
  if (selectedTarget.value.inspectionStatus === 'READY') return '전수조사 시작일부터 응답할 수 있습니다.'
  if (selectedTarget.value.inspectionStatus !== 'IN_PROGRESS') return '응답 기간이 종료된 자산입니다.'
  return ''
})

onErrorCaptured((error) => {
  renderError.value = error instanceof Error
    ? error.message
    : '알 수 없는 화면 오류가 발생했습니다.'

  return false
})

const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return targets.value.filter((target) => {
    const matchesResponded = !respondedFilter.value
      || String(target.isResponded) === respondedFilter.value
    const matchesKeyword = !query
      || [target.productName, target.assetCode, target.category, target.memberName]
        .some((value) => value.toLowerCase().includes(query))

    return matchesResponded && matchesKeyword
  })
})

watch(() => route.query.assetType, (nextAssetType) => {
  const normalizedType = nextAssetType === 'intangible' ? 'intangible' : 'tangible'
  if (assetType.value === normalizedType) return
  assetType.value = normalizedType
  if (canUseMobileInspection.value) {
    loadTargets()
  }
})

function assetTypeButtonClass(type: MobileAssetType) {
  return [
    'rounded-md px-3 py-2 text-sm font-bold transition',
    assetType.value === type
      ? 'bg-surface text-primary shadow-sm'
      : 'text-text-sub',
  ]
}

function changeAssetType(type: MobileAssetType) {
  if (assetType.value === type) return
  isScannerOpen.value = false
  router.replace({ query: { ...route.query, assetType: type } })
}

function textValue(...values: unknown[]) {
  return values
    .find((value): value is string | number => (
      (typeof value === 'string' && value.trim().length > 0)
      || typeof value === 'number'
    ))
    ?.toString() ?? ''
}

function booleanValue(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'boolean')
  return typeof value === 'boolean' ? value : false
}

function inspectionStatusValue(value: unknown): InspectionStatus {
  if (value === 'READY' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'CLOSED') {
    return value
  }

  return 'READY'
}

function toTargetRow(item: EmployeeInspectionTargetResponse): MobileInspectionTarget {
  return {
    inspectionTargetId: textValue(item.inspectionTargetId),
    inspectionId: textValue(item.inspectionId),
    inspectionStatus: resolveInspectionStatus({
      startDate: textValue(item.startDate),
      endDate: textValue(item.endDate),
      fallbackStatus: inspectionStatusValue(item.inspectionStatus),
    }),
    memberId: textValue(item.memberId),
    memberName: textValue(item.memberName) || '-',
    productName: textValue(item.productName, item.itemName) || '-',
    assetCode: textValue(item.assetCode, item.licenseCode) || '-',
    category: textValue(item.category, item.categoryName) || '-',
    isResponded: booleanValue(item.isResponded, item.responded),
    startDate: textValue(item.startDate),
    endDate: textValue(item.endDate),
  }
}

function selectTarget(target: MobileInspectionTarget, options: { preserveMessage?: boolean } = {}) {
  selectedTarget.value = target
  form.responseContent = target.isResponded ? '이미 응답이 등록된 자산입니다.' : ''
  form.followUpRequests = false
  if (!options.preserveMessage) message.value = ''
}

async function loadTargets(options: { selectedTargetId?: string; preserveMessage?: boolean } = {}) {
  if (!canUseMobileInspection.value) {
    loadError.value = authIssue.value
    return
  }

  isLoading.value = true
  loadError.value = ''
  if (!options.preserveMessage) message.value = ''

  try {
    const responses = isAssetTeamRole(authStore.currentRole)
      ? await Promise.all([
          inspectionApi.value.getTargets({ page: 0, size: 100 }),
          inspectionApi.value.getMyTargets({ page: 0, size: 100 }),
        ])
      : [await inspectionApi.value.getMyTargets({ page: 0, size: 100 })]
    const content = responses.flatMap((response) => (
      Array.isArray(response.data?.content) ? response.data.content : []
    ))
    const uniqueTargets = new Map<string, MobileInspectionTarget>()

    content
      .map(toTargetRow)
      .filter((target) => target.inspectionTargetId)
      .forEach((target) => uniqueTargets.set(target.inspectionTargetId, target))

    targets.value = Array.from(uniqueTargets.values())
    totalElements.value = targets.value.length
    const initialTarget = options.selectedTargetId
      ? targets.value.find((target) => target.inspectionTargetId === options.selectedTargetId) ?? null
      : null
    if (initialTarget) {
      selectTarget(initialTarget, { preserveMessage: options.preserveMessage })
    } else {
      selectedTarget.value = null
    }
  } catch {
    if (targets.value.length === 0) {
      totalElements.value = 0
      selectedTarget.value = null
    }
    loadError.value = '검수 대상 자산을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (isResponseDisabled.value || !selectedTarget.value || !form.responseContent.trim()) {
    isSuccess.value = false
    message.value = '응답할 자산과 확인 내용을 입력해주세요.'
    return
  }

  isSubmitting.value = true
  message.value = ''

  try {
    const targetId = selectedTarget.value.inspectionTargetId
    await inspectionApi.value.createResponse(targetId, {
      responseContent: form.responseContent,
      followUpRequests: form.followUpRequests,
    })

    targets.value = targets.value.map((target) => (
      target.inspectionTargetId === targetId
        ? { ...target, isResponded: true }
        : target
    ))
    isSuccess.value = true
    message.value = '검수 응답이 등록되었습니다.'
    form.responseContent = ''
    form.followUpRequests = false
    await Promise.allSettled([
      inspectionApi.value.getResponse(targetId),
      loadTargets({ selectedTargetId: targetId, preserveMessage: true }),
    ])
  } catch (error) {
    isSuccess.value = false
    message.value = error instanceof ApiError
      ? `검수 응답 등록에 실패했습니다. ${error.message}`
      : '검수 응답 등록에 실패했습니다. 입력한 정보를 확인해주세요.'
  } finally {
    isSubmitting.value = false
  }
}

function handleDetectedCode(rawValue: string) {
  const code = rawValue.trim()
  const target = targets.value.find((item) => (
    item.assetCode === code
    || item.inspectionTargetId === code
    || code.includes(item.assetCode)
    || code.includes(item.inspectionTargetId)
  ))

  if (!target) {
    isScannerOpen.value = false
    isSuccess.value = false
    message.value = '배정된 검수 대상에서 해당 자산을 찾지 못했습니다.'
    return
  }

  selectTarget(target)
  isScannerOpen.value = false
}

async function handleLogout() {
  await authStore.logout()
  goLogin()
}

function goLogin() {
  router.replace({
    path: '/mobile/login',
    query: isDebugAuth.value ? { debugAuth: '1' } : undefined,
  })
}

onMounted(() => {
  if (!canUseMobileInspection.value) {
    if (isDebugAuth.value && authStore.isAuthenticated) {
      sessionStorage.setItem('mobileAuthDebugLastRole', authStore.currentRole ?? 'null')
    }
    return
  }

  loadTargets()
})
</script>
