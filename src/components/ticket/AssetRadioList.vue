<template>
  <div class="space-y-2">
    <p v-if="loading" class="rounded-xl bg-surface-secondary px-4 py-8 text-center text-sm text-text-muted">
      자산 정보를 불러오는 중입니다.
    </p>

    <p
      v-else-if="errorMessage"
      class="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      {{ errorMessage }}
    </p>

    <p
      v-else-if="totalItemCount === 0"
      class="rounded-xl bg-surface-secondary px-4 py-8 text-center text-sm text-text-muted"
    >
      {{ emptyText }}
    </p>

    <div v-else-if="hasGroups" class="grid gap-3 md:grid-cols-2">
      <section
        v-for="group in visibleGroups"
        :key="group.label || 'default'"
        class="min-w-0 overflow-hidden rounded-xl border border-border bg-surface"
      >
        <div class="flex items-center justify-between border-b border-border bg-surface-secondary/60 px-3 py-2">
          <h3 class="text-sm font-semibold text-text-main">{{ group.label }}</h3>
          <span class="text-xs text-text-muted">{{ group.items.length }}개</span>
        </div>

        <div class="max-h-72 space-y-2 overflow-y-auto p-2">
          <p
            v-if="group.items.length === 0"
            class="rounded-lg bg-surface-secondary px-3 py-8 text-center text-sm text-text-muted"
          >
            조회된 품목이 없습니다.
          </p>

          <label
            v-for="item in group.items"
            v-else
            :key="item.id"
            :class="itemClass(item)"
          >
            <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                type="radio"
                class="peer sr-only"
                :name="name"
                :value="item.id"
                :checked="modelValue === item.id"
                @change="emit('update:modelValue', item.id)"
              />
              <span
                class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
              />
              <span
                class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
              <span v-if="item.description" class="mt-1 block text-xs leading-5 text-text-muted">
                {{ item.description }}
              </span>
            </span>
            <span v-if="hasAvailableCount(item)" :class="availableCountClass(item)">
              {{ availableCountText(item) }}
            </span>
          </label>
        </div>
      </section>
    </div>

    <div v-else class="max-h-64 space-y-2 overflow-y-auto pr-1">
      <label
        v-for="item in items"
        :key="item.id"
        :class="itemClass(item)"
      >
        <span class="group relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="radio"
            class="peer sr-only"
            :name="name"
            :value="item.id"
            :checked="modelValue === item.id"
            @change="emit('update:modelValue', item.id)"
          />
          <span
            class="h-5 w-5 rounded-full border border-gray-300 bg-white transition-all duration-200 group-hover:border-gray-400 peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20"
          />
          <span
            class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform duration-200 ease-out peer-checked:scale-100"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
          <span v-if="item.description" class="mt-1 block text-xs leading-5 text-text-muted">
            {{ item.description }}
          </span>
        </span>
        <span v-if="hasAvailableCount(item)" :class="availableCountClass(item)">
          {{ availableCountText(item) }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface AssetRadioItem {
  id: string
  name: string
  description?: string
  availableCount?: number
}

export interface AssetRadioGroup {
  label: string
  items: AssetRadioItem[]
}

const props = withDefaults(defineProps<{
  modelValue: string
  items: AssetRadioItem[]
  itemGroups?: AssetRadioGroup[]
  name?: string
  loading?: boolean
  errorMessage?: string
  emptyText?: string
}>(), {
  itemGroups: () => [],
  name: 'asset-selection',
  loading: false,
  errorMessage: '',
  emptyText: '선택할 수 있는 자산이 없습니다.',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visibleGroups = computed(() => {
  if (!hasGroups.value) return [{ label: '', items: props.items.filter((item) => item.id) }]

  return props.itemGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id),
    }))
})

const totalItemCount = computed(() => (
  visibleGroups.value.reduce((sum, group) => sum + group.items.length, 0)
))

const hasGroups = computed(() => props.itemGroups.length > 0)

function itemClass(item: AssetRadioItem) {
  return [
    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
    props.modelValue === item.id
      ? 'border-primary bg-primary/5'
      : 'border-border bg-surface hover:bg-surface-secondary',
  ]
}

function hasAvailableCount(item: AssetRadioItem) {
  return typeof item.availableCount === 'number' && Number.isFinite(item.availableCount)
}

function availableCountClass(item: AssetRadioItem) {
  return [
    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
    (item.availableCount ?? 0) > 0
      ? 'bg-primary/10 text-primary'
      : 'bg-danger/10 text-danger',
  ]
}

function availableCountText(item: AssetRadioItem) {
  return `남은 수량 ${item.availableCount ?? 0}개`
}
</script>
