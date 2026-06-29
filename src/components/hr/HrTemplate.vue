<template>
  <div class="flex h-full flex-col overflow-hidden bg-background text-text-main transition-colors duration-300">
    <div class="page-header flex shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="page-title text-lg">
          입사 템플릿 설정
        </h1>
      </div>

      <div class="flex mr-3 items-center gap-2">
        <Button
          v-if="template"
          variant="outline"
          :disabled="isLoading || isDeleting"
          :loading="isDeleting"
          @click="handleDeleteTemplate"
        >
          템플릿 삭제
        </Button>

        <Button
          v-if="template && canRegisterHrTemplate"
          variant="primary"
          :disabled="isLoading"
          @click="openRegisterDrawer"
        >
          <div class="flex gap-1.5 text-center">
            <RefreshCcw :size="14" />
            <p>템플릿 다시 등록</p>
          </div>
        </Button>
      </div>
    </div>

    <div class="card mb-4 flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-surface">
      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center text-sm text-text-sub"
      >
        입사 템플릿을 불러오는 중입니다.
      </div>

      <div
        v-else-if="errorMessage"
        class="m-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
      >
        {{ errorMessage }}
      </div>

      <div
        v-else-if="!template"
        class="flex flex-1 flex-col items-center justify-center gap-3 text-center"
      >
        <p class="text-sm font-semibold text-text-main">
          등록된 입사 템플릿이 없습니다.
        </p>
        <p class="text-xs text-text-sub">
          신규 입사자에게 지급할 기본 자산 구성을 등록해주세요.
        </p>
        <Button
          v-if="canRegisterHrTemplate"
          variant="primary"
          size="md"
          @click="openRegisterDrawer"
        >
          템플릿 등록
        </Button>
      </div>

      <div v-else class="flex flex-col min-h-0 overflow-y-auto gap-3">
        <section class="flex-1 space-y-3 p-4 pt-2 pb-0">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-text-main">
              지급 자산
            </h2>
            <span class="text-xs text-text-sub px-2">
              총 {{ template.items?.length ?? 0 }}개 항목
            </span>
          </div>
          <Table
            :columns="templateItemColumns"
            :rows="templateItemRows"
            row-key="rowKey"
            empty-text="등록된 지급 자산이 없습니다."
          />
        </section>

        <section>
          <p class="flex justify-end items-center text-text-sub text-sm pt-1 pb-1 pr-3">수정일 : {{ formatDateTime(template.updatedAt) }}</p>
        </section>
      </div>
    </div>
  </div>

  <HrTemplateRegister
    :is-open="isRegisterDrawerOpen"
    :template-id="template ? getTemplateId(template) : null"
    :asset-types="assetTypes"
    :tangible-asset-items="tangibleAssetItems"
    :intangible-asset-items="intangibleAssetItems"
    @close="isRegisterDrawerOpen = false"
    @registered="handleTemplateRegistered"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCcw } from 'lucide-vue-next'

import { intangibleItemApi, tangibleItemApi } from '@/api/asset.api'
import { hrApi } from '@/api/hr.api'
import Button from '@/components/common/Button.vue'
import Table, { type Column } from '@/components/common/Table.vue'
import { usePermission } from '@/composables'
import type { IntangibleItem, TangibleAssetItem } from '@/types'
import type { HrTemplateAssetType, HrTemplateId, HrTemplateItemResponse, HrTemplateResponse } from '@/types/hr'

import HrTemplateRegister from './HrTemplateRegister.vue'

interface HrTemplateItemRow extends HrTemplateItemResponse, Record<string, unknown> {
  rowKey: string
  assetTypeLabel: string
}

const isRegisterDrawerOpen = ref(false)
const template = ref<HrTemplateResponse | null>(null)
const isLoading = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const { canRegisterHrTemplate } = usePermission()
const assetTypes: HrTemplateAssetType[] = ['TANGIBLE', 'INTANGIBLE']
const tangibleAssetItems = ref<TangibleAssetItem[]>([])
const intangibleAssetItems = ref<IntangibleItem[]>([])

const templateItemColumns: Column<HrTemplateItemRow>[] = [
  { key: 'assetTypeLabel', label: '자산 유형', align: 'center', width: '16%' },
  { key: 'productName', label: '품목명', align: 'left', width: '52%', maxLines: 2 },
  { key: 'quantity', label: '수량', align: 'center', width: '16%' },
]

const templateItemRows = computed<HrTemplateItemRow[]>(() => (
  template.value?.items?.map((item) => ({
    ...item,
    rowKey: String(item.hrTemplateItemId || `${item.assetType}-${item.assetItemId}`),
    assetTypeLabel: item.assetType === 'TANGIBLE' ? '유형자산' : '무형자산',
  })) ?? []
))

const getTemplateId = (value: HrTemplateResponse): HrTemplateId | null => (
  value.templateId ?? value.hrTemplateId ?? null
)

const resolveLatestUpdatedAt = (
  value: HrTemplateResponse,
  preferredUpdatedAt?: string,
) => {
  const candidates = [
    preferredUpdatedAt,
    value.updatedAt,
    ...((value.items ?? []).flatMap((item) => [item.updatedAt, item.createdAt])),
    value.createdAt,
  ].filter((date): date is string => Boolean(date))

  return candidates.reduce<string | undefined>((latest, current) => {
    if (!latest) return current

    const latestDate = new Date(latest)
    const currentDate = new Date(current)
    if (Number.isNaN(latestDate.getTime())) return current
    if (Number.isNaN(currentDate.getTime())) return latest

    return currentDate.getTime() > latestDate.getTime() ? current : latest
  }, undefined)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16)

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const loadTemplate = async (preferredUpdatedAt?: string) => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await hrApi.getTemplate()
    template.value = hasTemplateItems(response.data)
      ? {
          ...response.data,
          updatedAt: resolveLatestUpdatedAt(response.data, preferredUpdatedAt),
        }
      : null
  } catch (error) {
    console.error('HR 템플릿 조회 실패', error)
    template.value = null
    errorMessage.value = '입사 템플릿을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const handleTemplateRegistered = (updatedAt?: string) => {
  void loadTemplate(updatedAt)
}

const loadAssetItems = async () => {
  try {
    const [tangibleResponse, intangibleResponse] = await Promise.all([
      tangibleItemApi.getList({ page: 0, size: 100 }),
      intangibleItemApi.getList({ page: 0, size: 100 }),
    ])

    tangibleAssetItems.value = tangibleResponse.data.content
    intangibleAssetItems.value = intangibleResponse.data.content
  } catch (error) {
    console.error('HR 템플릿 품목 목록 조회 실패', error)
    errorMessage.value = '템플릿 등록에 필요한 자산 품목을 불러오지 못했습니다.'
  }
}

const openRegisterDrawer = () => {
  isRegisterDrawerOpen.value = true
}

const hasTemplateItems = (value: HrTemplateResponse | null): value is HrTemplateResponse => (
  Boolean(value && (value.items?.length ?? 0) > 0)
)

// TODO: API 명세/백엔드 확인 필요 - 현재 서버 삭제는 soft delete 후 재등록 중복 제약과 충돌해 구성 비우기로 처리한다.
const handleDeleteTemplate = async () => {
  if (!template.value || isDeleting.value) return
  if (!window.confirm('입사 템플릿 구성을 삭제할까요?')) return

  isDeleting.value = true

  try {
    await hrApi.deleteTemplate()
    template.value = null
  } catch (error) {
    console.error('HR 템플릿 삭제 실패', error)
    errorMessage.value = '입사 템플릿 구성을 삭제하지 못했습니다.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadTemplate()
  void loadAssetItems()
})
</script>
