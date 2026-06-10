<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  modelValue: string | number
  type?: 'text' | 'password' | 'number' | 'tel'
  label?: string
  required?: boolean
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  type: 'text',
  label: '',
  required: false,
  placeholder: '',
  autocomplete: 'off',
  disabled: false,
  error: false,
  errorMessage: '',
  maxlength: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClasses = computed(() => {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm bg-surface text-text-main placeholder-text-muted transition-all duration-200 outline-none h-9',
    props.error
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
    props.disabled && 'cursor-not-allowed bg-surface-secondary text-text-muted border-border opacity-60',
  ]
})

const currentLength = computed(() => String(props.modelValue ?? '').length)
const errorId = computed(() => props.id ? `${props.id}-error` : undefined)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full flex flex-col gap-1.5 text-left">
    <div v-if="props.label || props.maxlength" class="flex items-center justify-between px-0.5">
      <label
        class="text-sm font-semibold text-text-main flex items-center gap-0.5"
        :for="props.id"
      >
        {{ props.label }}
        <span v-if="props.required" class="text-primary font-bold">*</span>
      </label>
      
      <span v-if="props.maxlength" class="text-xs text-text-muted">
        {{ currentLength }}/{{ props.maxlength }}
      </span>
    </div>

    <input
      :id="props.id"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      :maxlength="props.maxlength"
      :aria-invalid="props.error"
      :aria-describedby="props.error && props.errorMessage ? errorId : undefined"
      :class="inputClasses"
      @input="handleInput"
    />

    <p
      v-if="props.error && props.errorMessage"
      :id="errorId"
      class="text-xs text-danger font-medium px-0.5 mt-0.5 animate-fadeIn"
      role="alert"
    >
      {{ props.errorMessage }}
    </p>
  </div>
</template>