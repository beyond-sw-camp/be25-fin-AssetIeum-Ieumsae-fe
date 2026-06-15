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
