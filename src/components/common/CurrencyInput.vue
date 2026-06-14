<template>
  <div class="flex w-full flex-col gap-2 text-left">
    <label
      v-if="label"
      :for="id"
      class="flex items-center gap-0.5 text-sm font-semibold text-text-main"
    >
      {{ label }}
      <span v-if="required" class="font-bold text-primary">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        :value="formattedValue"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder"
        :disabled="disabled"
        class="h-9 w-full rounded-xl border border-border bg-surface py-2.5 pl-4 pr-10 text-sm text-text-main outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60"
        @input="handleInput"
      />
      <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">
        원
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  modelValue: string
  label?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  label: '',
  required: false,
  placeholder: '0',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function formatCurrency(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formattedValue = computed(() => {
  if (!props.modelValue) return ''
  return formatCurrency(props.modelValue)
})

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  input.value = formatCurrency(digits)
  emit('update:modelValue', digits)
}
</script>
