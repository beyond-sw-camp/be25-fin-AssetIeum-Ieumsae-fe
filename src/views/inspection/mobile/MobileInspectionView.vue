<template>
  <div
    v-if="isInitialLoading"
    class="mx-auto flex h-dvh min-h-dvh w-full max-w-md flex-col bg-background text-text-main md:border-x md:border-border"
  >
    <header class="shrink-0 border-b border-border bg-surface px-5 py-5">
      <p class="text-lg font-bold text-primary">자산이음</p>
      <p class="mt-1 text-sm font-semibold text-text-sub">모바일 전수조사</p>
    </header>
    <main class="flex flex-1 flex-col justify-center px-5 py-8">
      <div class="flex flex-col items-center text-center">
        <LoaderCircle :size="32" class="animate-spin text-primary" />
        <p class="mt-4 text-base font-bold text-text-main">검수 대상을 불러오고 있습니다</p>
        <p class="mt-2 text-sm text-text-sub">잠시만 기다려주세요.</p>
      </div>
      <div class="mt-8 space-y-3" aria-hidden="true">
        <div v-for="index in 3" :key="index" class="rounded-lg border border-border bg-surface p-4">
          <div class="h-4 w-2/3 animate-pulse rounded bg-surface-secondary" />
          <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-surface-secondary" />
          <div class="mt-5 h-8 animate-pulse rounded bg-surface-secondary" />
        </div>
      </div>
    </main>
  </div>

  <div
    v-else-if="renderError"
    class="mx-auto flex h-screen min-h-screen w-full max-w-md flex-col justify-center bg-background px-5 text-text-main md:border-x md:border-border"
  >
    <div class="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
      <p class="text-base font-bold text-danger">
        모바일 화면을 불러오지 못했습니다.
      </p>
      <p class="mt-2 text-sm leading-relaxed text-text-sub">
        잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
      </p>
      <Button class="mt-6 w-full" size="lg" @click="goLogin">
        로그인 화면으로 이동
      </Button>
    </div>
  </div>

  <div v-else class="mx-auto flex h-dvh min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background text-text-main md:border-x md:border-border">
    <header class="shrink-0 border-b border-border bg-surface px-4 py-4">
      <div class="flex flex-row items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-bold text-primary">
            MOBILE INSPECTION
          </p>
          <h1 class="mt-1 text-xl font-bold text-text-main">
            자산 검수
          </h1>
        </div>
        
        <div class="flex flex-row items-center gap-2">
          <Button
            v-if="authStore.isAuthenticated"
            variant="outline"
            size="md"
            class="shrink-0"
            @click="handleLogout"
          >
            로그아웃
          </Button>
          <Button
            v-else
            variant="outline"
            size="md"
            class="shrink-0"
            @click="goLogin"
          >
            로그인
          </Button>
        </div>
      </div>
      <p class="w-full ml-1 mt-3 text-sm flex justify-start text-text-sub">
        {{ inspectionGuideText }}
      </p>
      <div
        v-if="user"
        class="flex flex-col mt-4 items-center gap-0.5 rounded-lg bg-surface-secondary px-3 py-2"
      >
        <div class="min-w-0 w-full flex justify-between">
          <div class="flex gap-2 items-center">
            <p class="truncate text-sm font-bold text-text-main">
              {{ user.name }}
            </p>
            <span class="shrink-0 text-xs font-semibold text-text-muted">
              {{ roleLabel }}
            </span>
          </div>  

          <p class="text-xs text-primary border border-white font-semibold px-2 py-1 rounded-2xl bg-white ">
            {{ user.departmentName || '-' }}
          </p>
        </div>
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

      <div class="mt-3 grid grid-cols-3 gap-2">
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

    <main class="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pt-3">
      <div
        v-if="authIssue"
        class="rounded-lg border border-dashed border-border bg-surface px-5 py-12 text-center"
      >
        <p class="text-base font-bold text-text-main">
          {{ authIssue }}
        </p>
        <p class="mt-2 text-sm leading-relaxed text-text-sub">
          로그인하면 배정된 자산 검수 목록을 확인할 수 있습니다.
        </p>
        <Button class="mt-6 w-full" size="lg" @click="goLogin">
          모바일 로그인으로 이동
        </Button>
      </div>

      <div v-else class="min-w-0 overflow-x-hidden bg-background pb-3">
        <Button
          v-if="assetType === 'tangible'"
          class="h-10! w-full"
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
        :loading-response="isLoadingResponse"
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
import { LoaderCircle, ScanLine } from 'lucide-vue-next'

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
import type { EmployeeInspectionTargetResponse, InspectionStatus } from '@/types/inspection'
import { useAuthStore, useNotificationStore } from '@/stores'
import { getApiErrorMessage } from '@/utils/apiError'
import { ROLE_LABEL } from '@/utils/labels'
import { canUseMobileInspectionRole } from '@/utils/mobileInspection'

type MobileAssetType = 'tangible' | 'intangible'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const assetType = ref<MobileAssetType>(route.query.assetType === 'intangible' ? 'intangible' : 'tangible')
const targets = ref<MobileInspectionTarget[]>([])
const selectedTarget = ref<MobileInspectionTarget | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isLoadingResponse = ref(false)
const isSuccess = ref(false)
const message = ref('')
const loadError = ref('')
const renderError = ref('')
const totalElements = ref(0)
const keyword = ref('')
const respondedFilter = ref('')
const isScannerOpen = ref(false)
const hasLoadedOnce = ref(false)
const user = computed(() => authStore.user)
const roleLabel = computed(() => user.value ? ROLE_LABEL[user.value.role] : '')
const isDebugAuth = computed(() => route.query.debugAuth === '1')
const isInitialLoading = computed(() => isLoading.value && !hasLoadedOnce.value)
const canUseMobileInspection = computed(() => (
  authStore.isAuthenticated && canUseMobileInspectionRole(authStore.currentRole)
))
const authIssue = computed(() => {
  if (!authStore.isAuthenticated) return '로그인이 필요합니다.'
  if (!canUseMobileInspectionRole(authStore.currentRole)) {
    return '사용자 권한 정보를 확인할 수 없습니다. 다시 로그인해주세요.'
  }
  return ''
})

const form = reactive({
  responseContent: '',
  followUpRequests: false,
})

function isAssetTeamRole(role: string | null | undefined) {
  return role === 'ASSET_TEAM' || role === 'ASSET_MANAGER' || role === 'ADMIN'
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
    ? 'QR을 스캔하거나 목록에서 자산을 선택하여 검수 결과를 등록해주세요.'
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
  if (selectedTarget.value.isResponded) return ''
  if (selectedTarget.value.inspectionStatus === 'READY') return '전수조사 시작일부터 응답할 수 있습니다.'
  if (selectedTarget.value.inspectionStatus !== 'IN_PROGRESS') return '응답 기간이 종료된 자산입니다.'
  return ''
})

onErrorCaptured((error) => {
  console.error('모바일 전수조사 렌더링 오류:', error)
  renderError.value = '모바일 화면을 불러오지 못했습니다.'

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
    assetId: textValue(item.assetId, item.tangibleAssetId, item.intangibleAssetId),
    tangibleAssetId: textValue(item.tangibleAssetId),
    intangibleAssetId: textValue(item.intangibleAssetId),
    inspectionStatus: inspectionStatusValue(item.inspectionStatus),
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
  form.responseContent = ''
  form.followUpRequests = false
  if (!options.preserveMessage) message.value = ''

  if (target.isResponded) {
    void loadRegisteredResponse(target.inspectionTargetId)
  }
}

async function loadRegisteredResponse(targetId: string) {
  isLoadingResponse.value = true

  try {
    const response = await inspectionApi.value.getResponse(targetId)
    if (selectedTarget.value?.inspectionTargetId !== targetId) return

    form.responseContent = textValue(response.data.responseContent)
    form.followUpRequests = response.data.followUpRequests === true
  } catch (error) {
    if (selectedTarget.value?.inspectionTargetId !== targetId) return
    isSuccess.value = false
    message.value = getApiErrorMessage(error, '등록된 응답을 불러오지 못했습니다.')
    notificationStore.error('응답 조회 실패', message.value)
  } finally {
    if (selectedTarget.value?.inspectionTargetId === targetId) {
      isLoadingResponse.value = false
    }
  }
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
    const isAssetTeam = isAssetTeamRole(authStore.currentRole)
    const [ownTargets, managedTargets] = await Promise.all([
      loadMyTargets(),
      isAssetTeam ? loadManagedTargets() : Promise.resolve([]),
    ])
    const uniqueTargets = new Map<string, MobileInspectionTarget>()

    ownTargets
      .map(toTargetRow)
      .filter((target) => target.inspectionTargetId)
      .forEach((target) => uniqueTargets.set(target.inspectionTargetId, target))

    managedTargets
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
  } catch (error) {
    if (targets.value.length === 0) {
      totalElements.value = 0
      selectedTarget.value = null
    }
    loadError.value = getApiErrorMessage(error, '검수 대상 자산을 불러오지 못했습니다.')
    notificationStore.error('검수 대상 조회 실패', loadError.value)
  } finally {
    isLoading.value = false
    hasLoadedOnce.value = true
  }
}

async function loadMyTargets() {
  const response = await inspectionApi.value.getMyTargets({ page: 0, size: 100 })
  return Array.isArray(response.data?.content) ? response.data.content : []
}

async function loadManagedTargets() {
  const inspectionResponse = await inspectionApi.value.getList({
    status: 'IN_PROGRESS',
    page: 0,
    size: 100,
  })
  const activeInspections = inspectionResponse.data.content
    .filter((inspection) => (
      (!inspection.inspectorType || inspection.inspectorType === 'ASSET_TEAM')
      && inspectionStatusValue(inspection.inspectionStatus ?? inspection.status) === 'IN_PROGRESS'
    ))
    .map((inspection) => ({
      inspectionId: textValue(inspection.inspectionId),
      inspectionStatus: inspectionStatusValue(inspection.inspectionStatus ?? inspection.status),
    }))
    .filter((inspection) => inspection.inspectionId)

  if (activeInspections.length === 0) return []

  const targetResults = await Promise.allSettled(
    activeInspections.map(async ({ inspectionId, inspectionStatus }) => {
      try {
        const response = await inspectionApi.value.getTargets({
          inspectionId,
          page: 0,
          size: 100,
        })
        return { response, inspectionStatus }
      } catch (error) {
        console.error('모바일 전수조사 대상 조회 실패', { inspectionId, error })
        throw error
      }
    }),
  )
  const successfulResults = targetResults.filter((result) => result.status === 'fulfilled')

  if (successfulResults.length === 0) {
    const firstFailure = targetResults.find((result) => result.status === 'rejected')
    if (firstFailure?.status === 'rejected') throw firstFailure.reason
  }

  return successfulResults.flatMap((result) => (
    result.status === 'fulfilled' && Array.isArray(result.value.response.data?.content)
      ? result.value.response.data.content.map((target) => ({
          ...target,
          inspectionStatus: target.inspectionStatus ?? result.value.inspectionStatus,
        }))
      : []
  ))
}

async function handleSubmit() {
  if (isResponseDisabled.value || !selectedTarget.value || !form.responseContent.trim()) {
    isSuccess.value = false
    message.value = '응답할 자산과 확인 내용을 입력해주세요.'
    notificationStore.warning(message.value)
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
    notificationStore.success(message.value)
    form.responseContent = ''
    form.followUpRequests = false
    await Promise.allSettled([
      inspectionApi.value.getResponse(targetId),
      loadTargets({ selectedTargetId: targetId, preserveMessage: true }),
    ])
  } catch (error) {
    isSuccess.value = false
    message.value = getApiErrorMessage(error, '검수 응답 등록에 실패했습니다.')
    notificationStore.error('검수 응답 등록 실패', message.value)
  } finally {
    isSubmitting.value = false
  }
}

function handleDetectedCode(rawValue: string) {
  const scannedValues = extractScannedValues(rawValue)
  const target = targets.value.find((item) => {
    const candidateValues = [
      item.assetId,
      item.tangibleAssetId,
      item.intangibleAssetId,
      item.assetCode,
      item.inspectionTargetId,
    ].filter((value): value is string => Boolean(value))

    return candidateValues.some((value) => scannedValues.has(value.trim()))
  })

  if (!target) {
    isScannerOpen.value = false
    isSuccess.value = false
    message.value = '배정된 검수 대상에서 해당 자산을 찾지 못했습니다.'
    notificationStore.warning(message.value)
    return
  }

  selectTarget(target)
  isScannerOpen.value = false
}

function extractScannedValues(rawValue: string) {
  const values = new Set<string>()
  const trimmedValue = rawValue.trim()
  if (!trimmedValue) return values

  values.add(trimmedValue)

  try {
    values.add(decodeURIComponent(trimmedValue))
  } catch {
    // Keep the original value when it is not URI encoded.
  }

  try {
    const url = new URL(trimmedValue)
    for (const key of ['assetCode', 'assetId', 'tangibleAssetId', 'inspectionTargetId']) {
      const value = url.searchParams.get(key)?.trim()
      if (value) values.add(value)
    }

    url.pathname
      .split('/')
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => values.add(value))
  } catch {
    // Plain asset codes are the current QR payload format.
  }

  return values
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
