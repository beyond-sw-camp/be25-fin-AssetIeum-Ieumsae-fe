<template>
  <section class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">시스템 관리자</p>
        <h1 class="page-title">회사 관리</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :loading="isLoading" @click="refreshAllCompanies">
          <RefreshCw :size="16" />
          새로고침
        </Button>
        <Button @click="openCompanyDrawer">
          <Plus :size="16" />
          회사 등록
        </Button>
      </div>
    </header>

    <div v-if="!canManagePlatform" class="mx-3 rounded-xl border border-border bg-surface p-8 text-center">
      <ShieldAlert :size="32" class="mx-auto mb-3 text-danger" />
      <p class="font-semibold text-text-main">시스템 관리자만 접근할 수 있습니다.</p>
      <p class="mt-1 text-sm text-text-sub">회사 관리는 플랫폼 관리 권한이 필요합니다.</p>
    </div>

    <section
      v-else
      class="card mx-3 mb-6 flex min-h-0 flex-1 flex-col border border-border"
    >
      <div class="flex shrink-0 flex-col gap-3 border-b border-border pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <Dropdown
            :model-value="pageSize"
            :options="PAGE_SIZE_OPTIONS"
            class="w-32!"
            aria-label="페이지 크기"
            @update:model-value="handlePageSizeChange"
          />
        </div>

        <form class="flex w-full gap-2 lg:max-w-md" @submit.prevent="handleSearch">
          <input
            v-model="keywordInput"
            type="search"
            class="h-9 min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="회사명 또는 회사코드 검색"
            aria-label="회사명 또는 회사코드 검색"
          />
          <Button type="submit">
            <Search :size="16" />
            조회
          </Button>
        </form>
      </div>

      <div class="mt-3 flex shrink-0 items-center justify-between gap-3">
        <p class="text-sm text-text-sub">
          총 {{ totalElements }}개 회사
        </p>
      </div>

      <div
        v-if="errorMessage"
        class="mt-4 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3"
      >
        <p class="text-sm font-semibold text-danger">{{ errorMessage }}</p>
        <Button variant="outline" size="sm" @click="fetchCompanies">다시 조회</Button>
      </div>

      <div class="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface">
        <Table
          :columns="companyColumns"
          :rows="companies"
          :loading="isLoading"
          row-key="companyId"
          empty-text="등록된 회사가 없습니다."
          class="border-0! [&_table]:min-w-190"
        >
          <template #cell-companyCode="{ value }">
            <span class="font-bold text-text-main">{{ value }}</span>
          </template>

          <template #cell-companyName="{ row }">
            <span>{{ row.companyName || '-' }}</span>
          </template>

          <template #cell-memberCount="{ value }">
            <span>{{ Number(value || 0).toLocaleString('ko-KR') }}명</span>
          </template>

          <template #cell-createdAt="{ value }">
            <span class="text-text-sub">{{ formatDate(String(value)) }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                class="border-danger! text-danger! hover:bg-danger/5!"
                @click.stop="requestDeleteCompany(row)"
              >
                <Trash2 :size="14" />
                삭제
              </Button>
            </div>
          </template>
        </Table>
      </div>

      <div class="flex shrink-0 items-center justify-center border-t border-border py-3">
        <div class="flex items-center justify-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="page === 0 || isLoading"
            aria-label="이전 페이지"
            @click="page -= 1"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            v-for="pageNumber in visiblePageNumbers"
            :key="pageNumber"
            type="button"
            :class="[
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
              pageNumber === page ? 'bg-primary text-white' : 'text-text-sub hover:bg-surface-secondary',
            ]"
            :disabled="isLoading"
            @click="page = pageNumber"
          >
            {{ pageNumber + 1 }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="totalPages === 0 || page >= totalPages - 1 || isLoading"
            aria-label="다음 페이지"
            @click="page += 1"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <BaseDrawer
      :is-open="isCompanyDrawerOpen"
      title="회사 등록"
      @close="closeCompanyDrawer"
    >
      <form class="space-y-5" @submit.prevent="createCompany">
        <Input
          id="system-company-name"
          v-model="companyForm.companyName"
          label="회사명"
          required
          placeholder="예: 자산이음"
          :disabled="isCreatingCompany"
          :error="companySubmitted && Boolean(companyNameError)"
          :error-message="companyNameError"
        />
        <Input
          id="system-company-code"
          v-model="companyForm.companyCode"
          label="회사 코드"
          required
          placeholder="예: assetieum"
          :disabled="isCreatingCompany"
          :error="companySubmitted && Boolean(companyCodeError)"
          :error-message="companyCodeError"
        />
        <p class="rounded-lg bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-sub">
          회사 등록 시 백엔드에서 공용 시스템 관리자 계정을 자동 생성합니다.
        </p>
      </form>

      <template #footer>
        <div class="grid w-full grid-cols-2 gap-2">
          <Button class="w-full" variant="outline" :disabled="isCreatingCompany" @click="closeCompanyDrawer">
            취소
          </Button>
          <Button class="w-full" :loading="isCreatingCompany" @click="createCompany">
            등록
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <ConfirmationModal
      :is-open="Boolean(companyToDelete)"
      title="회사 삭제"
      :message="`'${companyToDelete?.companyCode ?? ''}' 회사를 삭제하시겠습니까?`"
      confirm-text="삭제"
      cancel-text="취소"
      :loading="isDeletingCompany"
      @confirm="deleteCompany"
      @cancel="companyToDelete = null"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-vue-next'

import { ApiError, companyApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { usePermission } from '@/composables'
import { useNotificationStore } from '@/stores'
import type { Company, DropdownOption, Role } from '@/types'

const PAGE_SIZE_OPTIONS: DropdownOption[] = [
  { label: '10개씩 보기', value: 10 },
  { label: '20개씩 보기', value: 20 },
  { label: '50개씩 보기', value: 50 },
]
const PLATFORM_ADMIN_ROLES: Role[] = ['SUPER_ADMIN']

const { hasRole } = usePermission()
const notificationStore = useNotificationStore()

const canManagePlatform = computed(() => hasRole(...PLATFORM_ADMIN_ROLES))
const companies = ref<Company[]>([])
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const keyword = ref('')
const keywordInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const isCompanyDrawerOpen = ref(false)
const isCreatingCompany = ref(false)
const companySubmitted = ref(false)
const companyForm = reactive({
  companyName: '',
  companyCode: '',
})

const companyToDelete = ref<Company | null>(null)
const isDeletingCompany = ref(false)

const companyColumns: Column<Company>[] = [
  { key: 'companyCode', label: '회사 코드', width: '24%', align: 'center' },
  { key: 'companyName', label: '회사명', width: '24%', align: 'center' },
  { key: 'memberCount', label: '구성원 수', width: '16%', align: 'center' },
  { key: 'createdAt', label: '등록일', width: '18%', align: 'center' },
  { key: 'actions', label: '관리', width: '18%', align: 'center' },
]

const companyNameError = computed(() => (
  companyForm.companyName.trim() ? '' : '회사명을 입력해주세요.'
))

const companyCodeError = computed(() => (
  companyForm.companyCode.trim() ? '' : '회사 코드를 입력해주세요.'
))

const hasCompanyFormError = computed(() => Boolean(companyNameError.value || companyCodeError.value))

const visiblePageNumbers = computed(() => {
  const maxVisible = 5
  const start = Math.max(0, Math.min(page.value - 2, totalPages.value - maxVisible))
  const end = Math.min(totalPages.value, start + maxVisible)
  return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index)
})

watch(page, () => {
  void fetchCompanies()
})

onMounted(() => {
  void fetchCompanies()
})

async function fetchCompanies() {
  if (!canManagePlatform.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await companyApi.getList({
      page: page.value,
      size: pageSize.value,
      keyword: keyword.value || undefined,
    })
    companies.value = response.data.content
    totalElements.value = response.data.totalElements
    totalPages.value = response.data.totalPages
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '회사 목록을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  keyword.value = keywordInput.value.trim()
  if (page.value === 0) {
    void fetchCompanies()
    return
  }
  page.value = 0
}

function refreshAllCompanies() {
  keywordInput.value = ''
  keyword.value = ''
  if (page.value === 0) {
    void fetchCompanies()
    return
  }
  page.value = 0
}

function handlePageSizeChange(value: string | number) {
  pageSize.value = Number(value)
  if (page.value === 0) {
    void fetchCompanies()
    return
  }
  page.value = 0
}

function openCompanyDrawer() {
  companySubmitted.value = false
  companyForm.companyName = ''
  companyForm.companyCode = ''
  isCompanyDrawerOpen.value = true
}

function closeCompanyDrawer() {
  if (isCreatingCompany.value) return
  isCompanyDrawerOpen.value = false
}

async function createCompany() {
  companySubmitted.value = true
  if (hasCompanyFormError.value) return

  isCreatingCompany.value = true
  try {
    await companyApi.create({
      companyName: companyForm.companyName.trim(),
      companyCode: companyForm.companyCode.trim(),
    })
    notificationStore.success('회사를 등록했습니다.', '공용 시스템 관리자 계정은 백엔드에서 자동 생성됩니다.')
    isCompanyDrawerOpen.value = false
    page.value = 0
    await fetchCompanies()
  } catch (error) {
    notificationStore.error('회사를 등록하지 못했습니다.', getErrorMessage(error, '회사명과 회사 코드를 확인해주세요.'))
  } finally {
    isCreatingCompany.value = false
  }
}

function requestDeleteCompany(company: Company) {
  companyToDelete.value = company
}

async function deleteCompany() {
  if (!companyToDelete.value) return

  isDeletingCompany.value = true
  try {
    await companyApi.delete(companyToDelete.value.companyId)
    notificationStore.success('회사를 삭제했습니다.')
    companyToDelete.value = null
    await fetchCompanies()
  } catch (error) {
    notificationStore.error('회사를 삭제하지 못했습니다.', getErrorMessage(error, '다시 시도해주세요.'))
  } finally {
    isDeletingCompany.value = false
  }
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error) return error.message || fallback
  return fallback
}
</script>
