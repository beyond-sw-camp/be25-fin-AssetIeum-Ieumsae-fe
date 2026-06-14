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
      v-else-if="items.length === 0"
      class="rounded-xl bg-surface-secondary px-4 py-8 text-center text-sm text-text-muted"
    >
      {{ emptyText }}
    </p>

    <div v-else class="max-h-64 space-y-2 overflow-y-auto pr-1">
      <label
        v-for="item in items"
        :key="item.id"
        :class="[
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
          modelValue === item.id
            ? 'border-primary bg-primary/5'
            : 'border-border bg-surface hover:bg-surface-secondary',
        ]"
      >
        <input
          type="radio"
          class="mt-1 accent-primary"
          :name="name"
          :value="item.id"
          :checked="modelValue === item.id"
          @change="emit('update:modelValue', item.id)"
        />
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-text-main">{{ item.name }}</span>
          <span v-if="item.description" class="mt-1 block text-xs leading-5 text-text-muted">
            {{ item.description }}
          </span>
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface AssetRadioItem {
  id: string
  name: string
  description?: string
}

withDefaults(defineProps<{
  modelValue: string
  items: AssetRadioItem[]
  name?: string
  loading?: boolean
  errorMessage?: string
  emptyText?: string
}>(), {
  name: 'asset-selection',
  loading: false,
  errorMessage: '',
  emptyText: '선택할 수 있는 자산이 없습니다.',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
