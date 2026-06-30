<template>
  <BaseDrawer
    :is-open="isOpen"
    title="전수조사 계획 등록"
    body-class="p-0"
    hide-footer
    @close="handleClose"
  >
    <form class="flex h-full flex-col" @submit.prevent="handleRegisterInspection">
      <div class="flex-1 space-y-5 overflow-y-auto px-8 py-7">
        <Input
          id="inspection-description"
          v-model="registerForm.description"
          label="설명"
          placeholder="예: 개발팀 보유 유형자산 전수조사"
        />

        <div class="space-y-2">
          <FormField label="조사 대상" required>
            <Dropdown
              id="inspection-target-type"
              v-model="registerForm.targetType"
              :options="targetTypeOptions"
              menu-strategy="fixed"
              root-option="-- 조사 대상 선택 --"
            />
          </FormField>
        </div>

        <div v-if="registerForm.targetType === 'DEPARTMENT'" class="space-y-2" data-dropdown-panel>
          <label class="text-sm font-semibold text-text-main" for="inspection-target-department">
            대상 부서
          </label>
          <Dropdown
            id="inspection-target-department"
            v-model="registerForm.targetDepartmentId"
            :options="departmentGroupedOptions"
            menu-strategy="fixed"
          />
        </div>

        <div v-if="registerForm.targetType === 'CATEGORY'" class="space-y-2" data-dropdown-panel>
          <label class="text-sm font-semibold text-text-main" for="inspection-target-category">
            대상 품목
          </label>
          <Dropdown
            id="inspection-target-category"
            v-model="registerForm.targetCategoryId"
            :options="categoryGroupedOptions"
            menu-strategy="fixed"
          />
        </div>

        <div class="space-y-2">
          <FormField label="조사 방식" required>
            <Dropdown
              id="inspection-inspector-type"
              v-model="registerForm.inspectorType"
              :options="inspectorTypeOptions"
              menu-strategy="fixed"
              root-option="-- 조사 방식 선택 --"
            />
          </FormField>
          <p v-if="inspectionModeHelpText" class="text-xs leading-relaxed text-text-sub">
            {{ inspectionModeHelpText }}
          </p>
        </div>

        <div class="space-y-2">
          <FormField :label="inspectorFieldLabel" required>
            <Dropdown
              id="inspection-inspector-id"
              v-model="registerForm.inspectorId"
              :options="inspectorOptions"
              menu-strategy="fixed"
              :root-option="inspectorRootOption"
            />
          </FormField>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <Input
            id="inspection-start-date"
            v-model="registerForm.startDate"
            type="date"
            label="시작일"
            :min="minimumDate"
            required
          />
          <Input
            id="inspection-end-date"
            v-model="registerForm.endDate"
            type="date"
            label="종료일"
            :min="minimumDate"
            required
          />
        </div>

        <p
          v-if="registerError"
          class="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {{ registerError }}
        </p>
      </div>

      <div class="shrink-0 border-t border-border px-8 py-5">
        <Button
          class="w-full"
          type="submit"
          :disabled="!isRegisterReady || isRegisterSubmitting"
          :loading="isRegisterSubmitting"
        >
          등록하기
        </Button>
      </div>
    </form>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'

import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import Input from '@/components/common/Input.vue'
import { intangibleItemApi, tangibleItemApi } from '@/api/asset.api'
import { departmentApi } from '@/api/department.api'
import { intangibleInspectionApi, tangibleInspectionApi } from '@/api/inspection.api'
import { memberApi } from '@/api/member.api'
import { useNotificationStore } from '@/stores'
import { getApiErrorMessage } from '@/utils/apiError'
import { toDateInputValue as getCurrentDateInputValue } from '@/utils/date'
import type { Department, DropdownOption, Member } from '@/types'
import type {
  InspectionTargetType,
  InspectorType,
} from '@/types/inspection'

type CategoryTreeNode = {
  categoryId?: string
  tangibleAssetCategoryId?: string
  intangibleAssetCategoryId?: string
  id?: string
  name?: string
  categoryName?: string
  mainCategory?: string
  subCategories?: Array<string | CategoryTreeNode>
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
  children?: CategoryTreeNode[]
}

type CategoryGroupOption = {
  categoryId?: string
  mainCategory: string
  subCategories: string[]
  childCategories?: Record<string, string[]>
  subCategoryIds?: Record<string, string>
  childCategoryIds?: Record<string, string>
}

const props = defineProps<{
  isOpen: boolean
  assetType?: 'tangible' | 'intangible'
}>()

const minimumDate = getCurrentDateInputValue()
const notificationStore = useNotificationStore()

const emit = defineEmits<{
  close: []
  registered: []
}>()

const FormField = defineComponent({
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  setup(fieldProps, { slots }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('label', { class: 'text-sm font-semibold text-text-main flex items-center gap-0.5' }, [
        fieldProps.label,
        fieldProps.required ? h('span', { class: 'ml-1 text-primary font-bold' }, '*') : null,
      ]),
      slots.default?.(),
    ])
  },
})

const TARGET_TYPE_LABEL: Record<InspectionTargetType, string> = {
  ALL: '전체 자산',
  DEPARTMENT: '부서',
  CATEGORY: '품목',
}

const departments = ref<Department[]>([])
const members = ref<Member[]>([])
const categoryGroups = ref<CategoryTreeNode[]>([])
const registerError = ref('')
const isRegisterSubmitting = ref(false)
const assetType = computed(() => props.assetType ?? 'tangible')
const itemApi = computed(() => (
  assetType.value === 'intangible'
    ? intangibleItemApi
    : tangibleItemApi
))
const inspectionApi = computed(() => (
  assetType.value === 'intangible'
    ? intangibleInspectionApi
    : tangibleInspectionApi
))

type RegisterInspectorType = InspectorType | ''
type RegisterTargetType = InspectionTargetType | ''

const registerForm = reactive({
  description: '',
  targetType: '' as RegisterTargetType,
  targetDepartmentId: '',
  targetCategoryId: '',
  inspectorType: '' as RegisterInspectorType,
  inspectorId: '',
  startDate: '',
  endDate: '',
})

const targetTypeOptions = computed<DropdownOption[]>(() => Object.entries(TARGET_TYPE_LABEL).map(([value, label]) => ({
  label: value === 'ALL' ? `전체 ${assetType.value === 'intangible' ? '무형자산' : '유형자산'}` : label,
  value,
})))

const inspectorTypeOptions: DropdownOption[] = [
  { label: '자산팀 처리', value: 'ASSET_TEAM' },
  { label: '자산 소유자 응답', value: 'EMPLOYEE' },
]

const departmentGroupedOptions = computed<CategoryGroupOption[]>(() => toDepartmentGroups(departments.value))

const departmentOptions = computed<DropdownOption[]>(() => toDepartmentOptions(departments.value))

const departmentMap = computed(() => {
  const flatDepartments = flattenDepartments(departments.value)
  const departmentById = new Map(flatDepartments.map((department) => [department.departmentId, department]))
  const map = new Map<string, string>()

  const getDepartmentPath = (department: Department) => {
    const names: string[] = []
    let current: Department | undefined = department

    while (current) {
      names.unshift(current.name)
      current = current.parentDepartmentId
        ? departmentById.get(current.parentDepartmentId)
        : undefined
    }

    return names.join(' > ')
  }

  flatDepartments.forEach((department) => {
    map.set(department.departmentId, getDepartmentPath(department))
  })

  return map
})

const categoryGroupedOptions = computed<CategoryGroupOption[]>(() => toCategoryGroups(categoryGroups.value))

const categoryOptions = computed<DropdownOption[]>(() => toCategoryOptions(categoryGroups.value))

const inspectorFieldLabel = computed(() => (
  '조사 담당자'
))

const inspectorRootOption = computed(() => (
  '-- 조사 담당자 선택 --'
))

const inspectionModeHelpText = computed(() => {
  if (registerForm.inspectorType === 'ASSET_TEAM') {
    return '선택한 조사 담당자가 전수조사 대상 자산을 직접 확인하고 후속처리합니다.'
  }
  if (registerForm.inspectorType === 'EMPLOYEE') {
    return '각 대상 자산의 소유자가 응답하고, 선택한 조사 담당자가 후속처리합니다.'
  }

  return ''
})

const inspectorOptions = computed<DropdownOption[]>(() => {
  const filteredMembers = members.value.filter((member) => {
    const role = getMemberRole(member)

    if (!registerForm.inspectorType) {
      return false
    }

    return role === 'ASSET_TEAM' || role === 'ASSET_MANAGER'
  })

  return filteredMembers
    .map<DropdownOption>((member) => ({
      label: getMemberLabel(member),
      value: getMemberId(member),
    }))
    .filter((option) => Boolean(option.value))
})

const isRegisterReady = computed(() => Boolean(
  registerForm.targetType
  && (registerForm.targetType !== 'DEPARTMENT' || registerForm.targetDepartmentId)
  && (registerForm.targetType !== 'CATEGORY' || registerForm.targetCategoryId)
  && registerForm.inspectorType !== ''
  && registerForm.inspectorId !== ''
  && registerForm.startDate
  && registerForm.endDate
))

function cleanText(value: unknown) {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  const normalized = trimmed.toLowerCase()
  if (normalized === 'undefined' || normalized === 'null') return ''

  return trimmed
}

function firstText(...values: unknown[]) {
  return values.map(cleanText).find(Boolean) ?? ''
}

function getLastPathName(path: string) {
  const parts = path.split('>').map((part) => part.trim()).filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

function getMemberId(member: Member | null | undefined) {
  if (!member) return ''

  return firstText(member.memberId)
}

function getMemberRole(member: Member | null | undefined) {
  if (!member) return ''

  return firstText(member.role)
}

function getMemberDepartmentName(member: Member | null | undefined) {
  if (!member) return '-'

  const departmentPath = firstText(member.departmentNamePath)

  if (departmentPath) {
    return getLastPathName(departmentPath) || '-'
  }

  const departmentName = firstText(member.departmentName)

  if (departmentName) {
    return departmentName
  }

  const departmentId = firstText(member.departmentId)

  if (departmentId) {
    const mappedDepartmentName = departmentMap.value.get(departmentId)
    return mappedDepartmentName ? getLastPathName(mappedDepartmentName) || mappedDepartmentName : '-'
  }

  return '-'
}

function getMemberLabel(member: Member) {
  const memberNoText = firstText(member.memberNo)
  const memberNo = memberNoText ? `(${memberNoText})` : ''
  const memberName = firstText(member.name) || '-'

  return `${getMemberDepartmentName(member)} - ${memberName}${memberNo}`
}

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) return
  registerError.value = ''
  hydrateEmptySelections()
})

watch(() => registerForm.targetType, () => {
  if (registerForm.targetType !== 'DEPARTMENT') registerForm.targetDepartmentId = ''
  if (registerForm.targetType !== 'CATEGORY') registerForm.targetCategoryId = ''

  if (registerForm.targetType === 'DEPARTMENT' && !registerForm.targetDepartmentId) {
    registerForm.targetDepartmentId = firstOptionValue(departmentOptions.value)
  }
  if (registerForm.targetType === 'CATEGORY' && !registerForm.targetCategoryId) {
    registerForm.targetCategoryId = firstOptionValue(categoryOptions.value)
  }
})

watch(() => registerForm.inspectorType, () => {
  registerForm.inspectorId = ''
})

function firstOptionValue(options: DropdownOption[]) {
  return options[0]?.value ? String(options[0].value) : ''
}

function flattenDepartments(items: Department[]): Department[] {
  const departmentById = new Map<string, Department>()

  const visit = (departments: Department[]) => {
    departments.forEach((department) => {
      const { children = [], ...current } = department
      departmentById.set(current.departmentId, current)
      visit(children)
    })
  }

  visit(items)
  return Array.from(departmentById.values())
}

function toDepartmentOptions(items: Department[]): DropdownOption[] {
  const flatDepartments = flattenDepartments(items)
  const departmentById = new Map(flatDepartments.map((department) => [department.departmentId, department]))

  const getDepartmentPath = (department: Department) => {
    const names: string[] = []
    let current: Department | undefined = department

    while (current) {
      names.unshift(current.name)
      current = current.parentDepartmentId
        ? departmentById.get(current.parentDepartmentId)
        : undefined
    }

    return names.join(' > ')
  }

  return flatDepartments.map((department) => ({
    label: getDepartmentPath(department),
    value: department.departmentId,
  }))
}

function buildDepartmentTree(items: Department[]) {
  const flatDepartments = flattenDepartments(items)
  const departmentById = new Map(flatDepartments.map((department) => [
    department.departmentId,
    { ...department, children: [] as Department[] },
  ]))
  const roots: Array<Department & { children: Department[] }> = []

  departmentById.forEach((department) => {
    const parent = department.parentDepartmentId
      ? departmentById.get(department.parentDepartmentId)
      : undefined

    if (parent) {
      parent.children.push(department)
      return
    }

    roots.push(department)
  })

  return roots
}

function toDepartmentGroups(items: Department[]): CategoryGroupOption[] {
  const collectDescendants = (
    departments: Department[],
    parentNames: string[] = [],
  ): Array<{ label: string; id: string }> => departments.flatMap((department) => {
    const names = [...parentNames, department.name]
    return [
      { label: names.join(' > '), id: department.departmentId },
      ...collectDescendants(department.children ?? [], names),
    ]
  })

  return buildDepartmentTree(items).map((rootDepartment) => {
    const subCategories: string[] = []
    const childCategories: Record<string, string[]> = {}
    const subCategoryIds: Record<string, string> = {}
    const childCategoryIds: Record<string, string> = {}

    rootDepartment.children?.forEach((middleDepartment) => {
      const middleName = middleDepartment.name
      subCategories.push(middleName)
      subCategoryIds[middleName] = middleDepartment.departmentId

      const childDepartments = collectDescendants(middleDepartment.children ?? [])
      if (childDepartments.length > 0) {
        const childLabels = childDepartments.map((department) => department.label)
        childCategories[middleName] = childLabels
        subCategories.push(...childLabels)
        childDepartments.forEach((department) => {
          childCategoryIds[department.label] = department.id
        })
      }
    })

    return {
      categoryId: rootDepartment.departmentId,
      mainCategory: rootDepartment.name,
      subCategories,
      childCategories,
      subCategoryIds,
      childCategoryIds,
    }
  })
}

function isGroupedCategory(category: CategoryTreeNode) {
  return Boolean(category.mainCategory)
}

function toCategoryGroups(items: CategoryTreeNode[]): CategoryGroupOption[] {
  return items
    .map((category) => {
      if (isGroupedCategory(category)) {
        return {
          categoryId: category.categoryId,
          mainCategory: category.mainCategory ?? '',
          subCategories: category.subCategories?.filter((subCategory): subCategory is string => typeof subCategory === 'string') ?? [],
          childCategories: category.childCategories ?? {},
          subCategoryIds: category.subCategoryIds ?? {},
          childCategoryIds: category.childCategoryIds ?? {},
        }
      }

      const mainCategory = categoryNameOf(category)
      const subCategories: string[] = []
      const childCategories: Record<string, string[]> = {}
      const subCategoryIds: Record<string, string> = {}
      const childCategoryIds: Record<string, string> = {}

      categoryChildrenOf(category).forEach((middleCategory) => {
        const middleName = categoryNameOf(middleCategory)
        if (!middleName) return

        subCategories.push(middleName)
        subCategoryIds[middleName] = categoryIdOf(middleCategory)

        const smallNames = categoryChildrenOf(middleCategory)
          .map((smallCategory) => {
            const smallName = categoryNameOf(smallCategory)
            if (smallName) {
              childCategoryIds[smallName] = categoryIdOf(smallCategory)
            }
            return smallName
          })
          .filter((smallName): smallName is string => Boolean(smallName))

        if (smallNames.length > 0) {
          childCategories[middleName] = smallNames
          subCategories.push(...smallNames)
        }
      })

      return {
        categoryId: categoryIdOf(category),
        mainCategory,
        subCategories,
        childCategories,
        subCategoryIds,
        childCategoryIds,
      }
    })
    .filter((category) => category.mainCategory)
}

function groupedCategoryOptions(group: CategoryTreeNode) {
  const mainCategory = group.mainCategory ?? ''
  const options: DropdownOption[] = []

  if (group.categoryId && mainCategory) {
    options.push({
      label: `대분류: ${mainCategory}`,
      value: group.categoryId,
    })
  }

  Object.entries(group.subCategoryIds ?? {}).forEach(([middleName, middleId]) => {
    options.push({
      label: `대분류: ${mainCategory} > 중분류: ${middleName}`,
      value: middleId,
    })

    const smallNames = group.childCategories?.[middleName] ?? []
    smallNames.forEach((smallName) => {
      const smallId = group.childCategoryIds?.[smallName]
      if (!smallId) return

      options.push({
        label: `대분류: ${mainCategory} > 중분류: ${middleName} > 소분류: ${smallName}`,
        value: smallId,
      })
    })
  })

  return options
}

function categoryIdOf(category: CategoryTreeNode) {
  return category.categoryId
    ?? category.tangibleAssetCategoryId
    ?? category.intangibleAssetCategoryId
    ?? category.id
    ?? ''
}

function categoryNameOf(category: CategoryTreeNode) {
  return category.name ?? category.categoryName ?? ''
}

function categoryChildrenOf(category: CategoryTreeNode) {
  return category.children
    ?? category.subCategories?.filter((child): child is CategoryTreeNode => typeof child === 'object')
    ?? []
}

function categoryDepthLabel(depth: number) {
  if (depth === 0) return '대분류'
  if (depth === 1) return '중분류'
  if (depth === 2) return '소분류'
  return `${depth + 1}단계`
}

function toCategoryOptions(items: CategoryTreeNode[], parentLabels: string[] = []): DropdownOption[] {
  return items.flatMap((category) => {
    if (isGroupedCategory(category)) {
      return groupedCategoryOptions(category)
    }

    const categoryId = categoryIdOf(category)
    const categoryName = categoryNameOf(category)
    const depthLabel = categoryDepthLabel(parentLabels.length)
    const labels = [...parentLabels, `${depthLabel}: ${categoryName}`]
    const children = categoryChildrenOf(category)
    const childOptions = toCategoryOptions(children, labels)

    if (!categoryId || !categoryName) return childOptions

    return [
      {
        label: labels.join(' > '),
        value: categoryId,
      },
      ...childOptions,
    ]
  })
}

function hydrateEmptySelections() {
  if (!registerForm.targetDepartmentId) {
    registerForm.targetDepartmentId = firstOptionValue(departmentOptions.value)
  }

  if (!registerForm.targetCategoryId) {
    registerForm.targetCategoryId = firstOptionValue(categoryOptions.value)
  }
}

function resetRegisterForm() {
  registerForm.description = ''
  registerForm.targetType = ''
  registerForm.targetDepartmentId = ''
  registerForm.targetCategoryId = ''
  registerForm.inspectorType = ''
  registerForm.inspectorId = ''
  registerForm.startDate = ''
  registerForm.endDate = ''
}

async function loadReferenceData() {
  const [departmentsResult, membersResult, categoriesResult] = await Promise.allSettled([
    departmentApi.getList({ page: 0, size: 999 }),
    memberApi.getList({ page: 0, size: 999 }),
    itemApi.value.getCategories(),
  ])

  departments.value = departmentsResult.status === 'fulfilled'
    ? departmentsResult.value.data.content
    : []
  members.value = membersResult.status === 'fulfilled'
    ? membersResult.value.data.content
    : []
  categoryGroups.value = categoriesResult.status === 'fulfilled'
    ? toCategoryTreeNodes(categoriesResult.value.data)
    : []

  hydrateEmptySelections()
}

function toCategoryTreeNodes(items: unknown): CategoryTreeNode[] {
  if (!Array.isArray(items)) return []

  return items.filter((item): item is CategoryTreeNode => (
    typeof item === 'object'
    && item !== null
  ))
}

function handleClose() {
  emit('close')
}

async function handleRegisterInspection() {
  if (!isRegisterReady.value) {
    registerError.value = '전수조사 계획 정보를 모두 입력해주세요.'
    return
  }

  if (new Date(registerForm.startDate).getTime() > new Date(registerForm.endDate).getTime()) {
    registerError.value = '종료일은 시작일 이후여야 합니다.'
    return
  }

  isRegisterSubmitting.value = true
  registerError.value = ''

  try {
    await inspectionApi.value.create({
      targetType: registerForm.targetType as InspectionTargetType,
      targetDepartmentId: registerForm.targetType === 'DEPARTMENT' ? registerForm.targetDepartmentId : null,
      targetCategoryId: registerForm.targetType === 'CATEGORY' ? registerForm.targetCategoryId : null,
      inspectorType: registerForm.inspectorType as InspectorType,
      description: registerForm.description,
      inspectorId: registerForm.inspectorId,
      startDate: registerForm.startDate,
      endDate: registerForm.endDate,
    })

    emit('registered')
    notificationStore.success('전수조사 계획이 등록되었습니다.')
    resetRegisterForm()
    emit('close')
  } catch (error) {
    registerError.value = getApiErrorMessage(error, '전수조사 계획 등록에 실패했습니다.')
    notificationStore.error('전수조사 계획 등록 실패', registerError.value)
  } finally {
    isRegisterSubmitting.value = false
  }
}

onMounted(loadReferenceData)
</script>
