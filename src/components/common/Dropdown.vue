<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <button
      type="button"
      class="
        inline-flex items-center justify-between gap-2 rounded-xl border border-border 
        bg-surface px-4 py-2 text-sm font-medium text-text-main 
        hover:bg-surface-secondary transition-all duration-200 min-w-[150px]
      "
      @click="toggleMainDropdown"
    >
      <slot name="icon" />
      <span>{{ modelValue }}</span>
      <ChevronDown
        :size="16"
        :class="['text-text-sub transition-transform duration-200 ml-auto', { 'rotate-180': isOpen }]"
      />
    </button>

    <div
      v-if="isOpen"
      class="
        absolute left-0 mt-1.5 min-w-[160px] rounded-xl border border-border 
        bg-surface p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100
      "
    >
      <button
        v-if="rootOption"
        type="button"
        class="w-full flex items-center rounded-lg px-3 py-2 text-sm text-left font-medium text-text-main hover:bg-surface-secondary mb-1"
        @click="selectOption(rootOption)"
      >
        {{ rootOption }}
      </button>

      <template v-if="isSimpleOptions">
        <button
          v-for="option in (options as string[])"
          :key="option"
          type="button"
          :class="[
            'w-full flex items-center rounded-lg px-3 py-2 text-sm text-left transition-colors',
            modelValue === option ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main hover:bg-surface-secondary'
          ]"
          @click="selectOption(option)"
        >
          {{ option }}
        </button>
      </template>

      <template v-else>
        <div
          v-for="group in (options as CategoryGroup[])"
          :key="group.mainCategory"
          class="relative"
        >
          <button
            type="button"
            :class="[
              'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors',
              activeGroup === group.mainCategory ? 'bg-surface-secondary text-primary font-medium' : 'text-text-main hover:bg-surface-secondary'
            ]"
            @click.stop="toggleSubMenu(group.mainCategory)"
          >
            <span>{{ group.mainCategory }}</span>
            <ChevronRight :size="14" class="text-text-sub" />
          </button>

          <div
            v-if="activeGroup === group.mainCategory"
            class="
              absolute left-full top-0 ml-1 min-w-[150px] rounded-xl border border-border 
              bg-surface p-1 shadow-xl z-50 animate-in fade-in slide-in-from-left-1 duration-100
            "
          >
            <button
              v-for="subCat in group.subCategories"
              :key="subCat"
              type="button"
              :class="[
                'w-full flex items-center rounded-lg px-3 py-1.5 text-sm text-left transition-colors',
                modelValue === subCat ? 'bg-primary/10 text-primary font-semibold' : 'text-text-main hover:bg-surface-secondary'
              ]"
              @click="selectOption(subCat)"
            >
              {{ subCat }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

interface Props {
  modelValue: string
  options: string[] | CategoryGroup[]
  rootOption?: string // 💡 있으면 보여주고, 없으면 안 보여주는 선택적 속성
}

// 🌟 [수정] 강제로 '전체 품목 보기'를 주입하던 withDefaults 기본값 설정을 제거했습니다.
const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const activeGroup = ref<string | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const isSimpleOptions = computed(() => {
  if (props.options.length === 0) return true
  return typeof props.options[0] === 'string'
})

const toggleMainDropdown = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) activeGroup.value = null
}

const toggleSubMenu = (mainCategory: string) => {
  if (activeGroup.value === mainCategory) {
    activeGroup.value = null
  } else {
    activeGroup.value = mainCategory
  }
}

const selectOption = (option: string) => {
  emit('update:modelValue', option)
  isOpen.value = false
  activeGroup.value = null
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
    activeGroup.value = null
  }
}

onMounted(() => window.addEventListener('click', handleClickOutside))
onUnmounted(() => window.removeEventListener('click', handleClickOutside))
</script>