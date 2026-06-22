<template>
  <BaseDrawer
    :is-open="isOpen"
    title="비표준 품목 등록"
    panel-class="w-full max-w-2xl"
    @close="handleClose"
  >
    <div class="space-y-5">
      <section class="rounded-lg border border-border bg-surface-secondary p-4 text-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-semibold text-text-main">{{ requestItemName }}</p>
            <p class="mt-1 text-text-sub">{{ ticket.ticketNo }} · {{ assetTypeLabel }}</p>
          </div>
          <span class="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            비표준 품목
          </span>
        </div>
        <dl class="mt-4 grid gap-3 text-xs md:grid-cols-3">
          <div>
            <dt class="text-text-muted">제조사</dt>
            <dd class="mt-1 font-semibold text-text-main">{{ ticket.manufacturer || '-' }}</dd>
          </div>
          <div>
            <dt class="text-text-muted">모델명</dt>
            <dd class="mt-1 font-semibold text-text-main">{{ ticket.modelName || ticket.requestedItemDetail || '-' }}</dd>
          </div>
          <div>
            <dt class="text-text-muted">수량</dt>
            <dd class="mt-1 font-semibold text-text-main">{{ ticket.quantity ?? 1 }}개</dd>
          </div>
        </dl>
      </section>

      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          v-model="keyword"
          class="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="품목명, 제조사, 모델명 검색"
          :disabled="submitting"
          @keyup.enter="handleSearch"
        />
        <Button variant="outline" :disabled="submitting" @click="handleSearch">
          <Search :size="15" />
          검색
        </Button>
      </div>

      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text-main">검색된 비표준 품목</h3>
          <span class="text-xs text-text-muted">{{ filteredItems.length }}개</span>
        </div>

        <div class="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
          <label
            v-for="item in filteredItems"
            :key="item.itemId"
            :class="[
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              selectedMode === 'existing' && selectedItemId === item.itemId
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-surface-secondary',
            ]"
          >
            <input
              v-model="selectedItemId"
              type="radio"
              class="mt-1"
              name="direct-purchase-item"
              :value="item.itemId"
              :disabled="submitting"
              @change="selectedMode = 'existing'"
            />
            <span class="min-w-0 flex-1">
              <span class="block font-semibold text-text-main">{{ item.productName }}</span>
              <span class="mt-1 block text-xs text-text-muted">
                {{ item.manufacturer }} · {{ item.modelName }} · {{ item.categoryName || '-' }}
              </span>
            </span>
            <span class="shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-sub">
              비표준
            </span>
          </label>

          <div v-if="filteredItems.length === 0" class="p-6 text-center text-sm text-text-sub">
            검색어와 일치하는 비표준 품목이 없습니다.
          </div>
        </div>
      </section>

      <section class="space-y-3 rounded-lg border border-border p-4">
        <label class="flex items-center gap-2 text-sm font-semibold text-text-main">
          <input
            v-model="selectedMode"
            type="radio"
            value="new"
            :disabled="submitting"
          />
          새 비표준 품목으로 등록
        </label>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">품목명</span>
            <input v-model="newItem.productName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">카테고리</span>
            <input v-model="newItem.categoryName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">제조사</span>
            <input v-model="newItem.manufacturer" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-semibold text-text-muted">모델명</span>
            <input v-model="newItem.modelName" class="form-input" :disabled="submitting || selectedMode !== 'new'" />
          </label>
        </div>
      </section>

      <p v-if="message" class="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        {{ message }}
      </p>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" :disabled="submitting" @click="handleClose">
          취소
        </Button>
        <Button class="flex-1" :loading="submitting" @click="handleSubmit">
          품목 등록 후 자산 등록
        </Button>
      </div>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import type { TicketDetail } from '@/types'

interface NonStandardItemOption {
  itemId: string
  productName: string
  manufacturer: string
  modelName: string
  categoryName?: string | null
}

const props = defineProps<{
  isOpen: boolean
  ticket: TicketDetail
  submitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [{ mode: 'existing' | 'new'; item?: NonStandardItemOption; newItem?: NonStandardItemOption }]
}>()

const keyword = ref('')
const selectedMode = ref<'existing' | 'new'>('existing')
const selectedItemId = ref('')
const message = ref('')
const newItem = reactive({
  itemId: 'new',
  productName: '',
  manufacturer: '',
  modelName: '',
  categoryName: '',
})

const requestItemName = computed(() => (
  props.ticket.requestedItemName
  ?? props.ticket.requestedItemDetail
  ?? props.ticket.productName
  ?? '-'
))

const assetTypeLabel = computed(() => (
  props.ticket.assetType === 'INTANGIBLE' ? '무형자산' : '유형자산'
))

const suggestedItems = computed<NonStandardItemOption[]>(() => {
  const productName = requestItemName.value
  const manufacturer = props.ticket.manufacturer ?? ''
  const modelName = props.ticket.modelName ?? props.ticket.requestedItemDetail ?? productName

  return [
    {
      itemId: 'suggested-request',
      productName,
      manufacturer: manufacturer || '제조사 미입력',
      modelName,
      categoryName: props.ticket.categoryName ?? null,
    },
  ].filter((item) => item.productName && item.productName !== '-')
})

const filteredItems = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return suggestedItems.value

  return suggestedItems.value.filter((item) => (
    item.productName.toLowerCase().includes(query)
    || item.manufacturer.toLowerCase().includes(query)
    || item.modelName.toLowerCase().includes(query)
  ))
})

function resetForm() {
  keyword.value = requestItemName.value === '-' ? '' : requestItemName.value
  selectedMode.value = 'existing'
  selectedItemId.value = suggestedItems.value[0]?.itemId ?? ''
  message.value = ''
  newItem.productName = requestItemName.value === '-' ? '' : requestItemName.value
  newItem.manufacturer = props.ticket.manufacturer ?? ''
  newItem.modelName = props.ticket.modelName ?? props.ticket.requestedItemDetail ?? ''
  newItem.categoryName = props.ticket.categoryName ?? ''
}

function handleSearch() {
  message.value = ''
}

function handleClose() {
  if (props.submitting) return
  emit('close')
}

function handleSubmit() {
  message.value = '비표준 품목 등록/선택 API가 아직 연결되지 않았습니다. API 구현 후 이 화면에서 품목 등록과 자산 등록을 이어서 처리하면 됩니다.'

  const item = filteredItems.value.find((option) => option.itemId === selectedItemId.value)
  emit('submit', {
    mode: selectedMode.value,
    item,
    newItem: selectedMode.value === 'new' ? { ...newItem } : undefined,
  })
}

watch(
  () => [props.isOpen, props.ticket.ticketId] as const,
  ([isOpen]) => {
    if (isOpen) resetForm()
  },
  { immediate: true },
)
</script>

<style scoped>
.form-input {
  width: 100%;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
}
</style>
