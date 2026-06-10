<script setup lang="ts">
import {
  Building2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import { departmentApi, memberApi } from '@/api'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import Button from '@/components/common/Button.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import Input from '@/components/common/Input.vue'
import OrganizationTreeNode from '@/components/organization/OrganizationTreeNode.vue'
import { usePermission } from '@/composables'
import { useDepartmentStore, useNotificationStore } from '@/stores'
import type { Department, DepartmentTreeNode, Member } from '@/types'
import { MEMBER_STATUS_LABEL, ROLE_LABEL } from '@/utils/labels'

const departmentStore = useDepartmentStore()
const notificationStore = useNotificationStore()
const { canEditOrganization } = usePermission()

const selectedDetail = ref<Department | null>(null)
const members = ref<Member[]>([])
const isDetailLoading = ref(false)
const isMembersLoading = ref(false)
const isSaving = ref(false)
const isCreating = ref(false)
const isDeleting = ref(false)
const detailError = ref('')
const membersError = ref('')
const isCreateDrawerOpen = ref(false)
const departmentToDelete = ref<DepartmentTreeNode | null>(null)
let detailRequestId = 0
let membersRequestId = 0

const editForm = reactive({
  name: '',
  parentDepartmentId: null as string | null,
})

const createForm = reactive({
  name: '',
  parentDepartmentId: null as string | null,
})

const editNameError = computed(() =>
  editForm.name.trim() ? '' : '부서명을 입력해주세요.',
)
const createNameError = computed(() =>
  createForm.name.trim() ? '' : '부서명을 입력해주세요.',
)
const createParentError = computed(() =>
  createForm.parentDepartmentId ? '' : '상위 부서를 선택해주세요.',
)

const descendantIds = computed(() => {
  const selectedId = departmentStore.selectedDepartmentId
  const ids = new Set<string>()

  if (selectedId === null) return ids

  function collect(parentId: string) {
    departmentStore.departments
      .filter(({ parentDepartmentId }) => parentDepartmentId === parentId)
      .forEach(({ departmentId }) => {
        ids.add(departmentId)
        collect(departmentId)
      })
  }

  collect(selectedId)
  return ids
})

const editParentOptions = computed(() =>
  departmentStore.departments.filter(({ departmentId }) =>
    departmentId !== departmentStore.selectedDepartmentId
    && !descendantIds.value.has(departmentId)
  ),
)

const isEditDirty = computed(() => {
  if (!selectedDetail.value) return false

  return editForm.name.trim() !== selectedDetail.value.name
    || editForm.parentDepartmentId !== selectedDetail.value.parentDepartmentId
})
const isSelectedRoot = computed(() => selectedDetail.value?.parentDepartmentId === null)

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function resetEditForm() {
  if (!selectedDetail.value) return

  editForm.name = selectedDetail.value.name
  editForm.parentDepartmentId = selectedDetail.value.parentDepartmentId
  detailError.value = ''
}

function resetCreateForm() {
  createForm.name = ''
  createForm.parentDepartmentId = departmentStore.selectedDepartmentId
}

async function fetchDepartmentDetail(departmentId: string) {
  const requestId = ++detailRequestId
  isDetailLoading.value = true
  detailError.value = ''

  try {
    const response = await departmentApi.getDetail(departmentId)
    if (requestId !== detailRequestId) return

    selectedDetail.value = response.data
    resetEditForm()
  } catch (error) {
    if (requestId !== detailRequestId) return

    selectedDetail.value = departmentStore.selectedDepartment
    detailError.value = getErrorMessage(error, '부서 상세 정보를 불러오지 못했습니다.')
    resetEditForm()
  } finally {
    if (requestId === detailRequestId) {
      isDetailLoading.value = false
    }
  }
}

async function fetchDepartmentMembers(departmentId: string) {
  const requestId = ++membersRequestId
  isMembersLoading.value = true
  membersError.value = ''

  try {
    const response = await memberApi.getList({ departmentId, size: 999 })
    if (requestId !== membersRequestId) return

    members.value = response.data.content
  } catch (error) {
    if (requestId !== membersRequestId) return

    membersError.value = getErrorMessage(error, '부서원 목록을 불러오지 못했습니다.')
  } finally {
    if (requestId === membersRequestId) {
      isMembersLoading.value = false
    }
  }
}

async function handleSelectDepartment(departmentId: string) {
  const department = departmentStore.departments.find(
    (item) => item.departmentId === departmentId,
  )
  if (!department || department.parentDepartmentId === null) return

  departmentStore.selectDepartment(departmentId)
  members.value = []

  await Promise.all([
    fetchDepartmentDetail(departmentId),
    fetchDepartmentMembers(departmentId),
  ])
}

async function loadOrganization() {
  try {
    await departmentStore.fetchAll()
    const selectedDepartment = departmentStore.selectedDepartment

    if (selectedDepartment?.parentDepartmentId !== null) {
      await handleSelectDepartment(selectedDepartment.departmentId)
    } else {
      departmentStore.selectDepartment(null)
      selectedDetail.value = null
      members.value = []
    }
  } catch {
    // 목록 오류는 store의 errorMessage로 표시한다.
  }
}

function openCreateDrawer() {
  resetCreateForm()
  isCreateDrawerOpen.value = true
}

async function handleCreateDepartment() {
  if (createNameError.value || createParentError.value) return

  isCreating.value = true

  try {
    const response = await departmentApi.create({
      name: createForm.name.trim(),
      parentDepartmentId: createForm.parentDepartmentId,
    })

    isCreateDrawerOpen.value = false
    await departmentStore.fetchAll()
    await handleSelectDepartment(response.data.departmentId)
    notificationStore.success('부서가 등록되었습니다.')
  } catch (error) {
    notificationStore.error(
      '부서를 등록하지 못했습니다.',
      getErrorMessage(error, '잠시 후 다시 시도해주세요.'),
    )
  } finally {
    isCreating.value = false
  }
}

async function handleUpdateDepartment() {
  const departmentId = departmentStore.selectedDepartmentId
  if (departmentId === null || editNameError.value || !isEditDirty.value) return

  isSaving.value = true
  detailError.value = ''

  try {
    await departmentApi.update(departmentId, {
      name: editForm.name.trim(),
      parentDepartmentId: editForm.parentDepartmentId,
    })

    await departmentStore.fetchAll()
    await fetchDepartmentDetail(departmentId)
    notificationStore.success('부서 정보가 저장되었습니다.')
  } catch (error) {
    detailError.value = getErrorMessage(error, '부서 정보를 저장하지 못했습니다.')
  } finally {
    isSaving.value = false
  }
}

function requestDeleteDepartment(department: DepartmentTreeNode) {
  if (department.parentDepartmentId === null) {
    notificationStore.warning('최상위 회사 부서는 삭제할 수 없습니다.')
    return
  }

  if (department.children.length > 0) {
    notificationStore.warning('하위 부서가 있는 부서는 삭제할 수 없습니다.')
    return
  }

  if (department.memberCount > 0) {
    notificationStore.warning('소속 부서원이 있는 부서는 삭제할 수 없습니다.')
    return
  }

  departmentToDelete.value = department
}

async function handleDeleteDepartment() {
  const target = departmentToDelete.value
  if (!target) return

  if (target.memberCount > 0) {
    departmentToDelete.value = null
    notificationStore.warning('소속 부서원이 있는 부서는 삭제할 수 없습니다.')
    return
  }

  if (target.parentDepartmentId === null) {
    departmentToDelete.value = null
    notificationStore.warning('최상위 회사 부서는 삭제할 수 없습니다.')
    return
  }

  isDeleting.value = true

  try {
    await departmentApi.delete(target.departmentId)
    departmentToDelete.value = null
    await departmentStore.fetchAll()

    const parentDepartment = departmentStore.departments.find(
      ({ departmentId }) => departmentId === target.parentDepartmentId,
    )

    if (parentDepartment?.parentDepartmentId !== null) {
      await handleSelectDepartment(target.parentDepartmentId)
    } else {
      departmentStore.selectDepartment(null)
      selectedDetail.value = null
      members.value = []
    }

    notificationStore.success('부서가 삭제되었습니다.')
  } catch (error) {
    notificationStore.error(
      '부서를 삭제하지 못했습니다.',
      getErrorMessage(error, '부서 상태를 확인한 뒤 다시 시도해주세요.'),
    )
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadOrganization)
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto bg-background text-text-main transition-colors duration-300 xl:overflow-hidden">
    <header class="page-header flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">Organization</p>
        <h1 class="page-title">조직도</h1>
      </div>
      <Button v-if="canEditOrganization" size="md" @click="openCreateDrawer">
        <Plus :size="18" />
        부서 추가
      </Button>
    </header>

    <div class="mx-3 mb-4 grid min-h-[680px] flex-1 gap-5 xl:min-h-0 xl:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.3fr)]">
      <section class="card mx-0 flex min-h-0 flex-col overflow-hidden border border-border p-0">
        <div class="border-b border-border px-5 py-4">
          <h2 class="text-lg font-bold text-text-main">부서 계층도</h2>
        </div>

        <div class="min-h-0 flex-1 overflow-auto p-4">
          <div
            v-if="departmentStore.isLoading"
            class="flex h-full min-h-64 items-center justify-center text-text-sub"
          >
            <RefreshCw class="mr-2 animate-spin" :size="20" />
            조직도를 불러오는 중입니다.
          </div>

          <div
            v-else-if="departmentStore.errorMessage"
            class="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center"
          >
            <p class="text-sm text-danger">{{ departmentStore.errorMessage }}</p>
            <Button variant="outline" @click="loadOrganization">
              <RefreshCw :size="16" />
              다시 시도
            </Button>
          </div>

          <ul v-else-if="departmentStore.departmentTree.length" class="space-y-1">
            <OrganizationTreeNode
              v-for="department in departmentStore.departmentTree"
              :key="department.departmentId"
              :node="department"
              :selected-department-id="departmentStore.selectedDepartmentId"
              :can-delete="canEditOrganization"
              @select="handleSelectDepartment"
              @delete="requestDeleteDepartment"
            />
          </ul>

          <div v-else class="flex h-full min-h-64 items-center justify-center text-sm text-text-muted">
            등록된 부서가 없습니다.
          </div>
        </div>
      </section>

      <div class="flex min-h-0 min-w-0 flex-col gap-5 overflow-hidden">
        <section class="card mx-0 shrink-0 border border-border p-5">
          <div class="mb-5 flex items-start gap-3">
            <span class="rounded-xl bg-primary/15 p-2 text-primary">
              <Building2 :size="22" />
            </span>
            <div>
              <h2 class="text-lg font-bold text-text-main">부서 상세 정보</h2>
              <p class="mt-1 text-sm text-text-sub">
                선택된 부서의 정보를 수정하고 관리합니다.
              </p>
            </div>
          </div>

          <div
            v-if="isDetailLoading"
            class="flex min-h-40 items-center justify-center text-text-sub"
          >
            <RefreshCw class="mr-2 animate-spin" :size="20" />
            상세 정보를 불러오는 중입니다.
          </div>

          <div
            v-else-if="!selectedDetail"
            class="flex min-h-40 items-center justify-center text-sm text-text-muted"
          >
            부서를 선택하면 상세 정보가 표시됩니다.
          </div>

          <form v-else class="space-y-4" @submit.prevent="handleUpdateDepartment">
            <div class="grid gap-4 md:grid-cols-2">
              <Input
                id="department-name"
                v-model="editForm.name"
                label="부서명"
                required
                :disabled="!canEditOrganization || isSaving"
                :error="Boolean(editNameError)"
                :error-message="editNameError"
              />

              <div class="flex flex-col gap-1.5">
                <label for="parent-department" class="text-sm font-semibold text-text-main">
                  상위 부서
                </label>
                <select
                  id="parent-department"
                  v-model="editForm.parentDepartmentId"
                  class="input-custom h-11 py-2.5"
                  :disabled="!canEditOrganization || isSaving || isSelectedRoot"
                >
                  <option v-if="isSelectedRoot" :value="null">최상위 부서</option>
                  <option
                    v-for="department in editParentOptions"
                    :key="department.departmentId"
                    :value="department.departmentId"
                  >
                    {{ department.name }}
                  </option>
                </select>
              </div>
            </div>

            <p v-if="detailError" class="text-sm text-danger" role="alert">
              {{ detailError }}
            </p>

            <div v-if="canEditOrganization" class="flex justify-end gap-2">
              <Button
                variant="outline"
                :disabled="!isEditDirty || isSaving"
                @click="resetEditForm"
              >
                <RotateCcw :size="16" />
                초기화
              </Button>
              <Button
                type="submit"
                :loading="isSaving"
                :disabled="Boolean(editNameError) || !isEditDirty"
              >
                <Save :size="16" />
                저장하기
              </Button>
            </div>
          </form>
        </section>

        <section class="card mx-0 flex min-h-0 flex-1 flex-col overflow-hidden border border-border p-5">
          <div class="mb-4 flex items-center gap-2">
            <Users :size="20" class="text-text-sub" />
            <h2 class="text-lg font-bold text-text-main">
              부서원 목록
              <span v-if="selectedDetail" class="text-text-sub">
                ({{ selectedDetail.memberCount }}명)
              </span>
            </h2>
          </div>

          <div class="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
            <table class="w-full min-w-[620px] text-sm">
              <thead class="bg-surface-secondary text-left text-xs text-text-sub">
                <tr>
                  <th class="px-4 py-3 font-semibold">성명</th>
                  <th class="px-4 py-3 font-semibold">권한</th>
                  <th class="px-4 py-3 font-semibold">사번</th>
                  <th class="px-4 py-3 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-if="isMembersLoading">
                  <td colspan="4" class="px-4 py-12 text-center text-text-sub">
                    <RefreshCw class="mr-2 inline animate-spin" :size="18" />
                    부서원을 불러오는 중입니다.
                  </td>
                </tr>
                <tr v-else-if="membersError">
                  <td colspan="4" class="px-4 py-10 text-center">
                    <p class="mb-3 text-danger">{{ membersError }}</p>
                    <Button
                      v-if="departmentStore.selectedDepartmentId !== null"
                      variant="outline"
                      @click="fetchDepartmentMembers(departmentStore.selectedDepartmentId)"
                    >
                      다시 시도
                    </Button>
                  </td>
                </tr>
                <tr v-else-if="departmentStore.selectedDepartmentId === null">
                  <td colspan="4" class="px-4 py-12 text-center text-text-muted">
                    부서를 선택하면 부서원 목록이 표시됩니다.
                  </td>
                </tr>
                <tr v-else-if="members.length === 0">
                  <td colspan="4" class="px-4 py-12 text-center text-text-muted">
                    소속 부서원이 없습니다.
                  </td>
                </tr>
                <template v-else>
                  <tr v-for="member in members" :key="member.memberId">
                    <td class="px-4 py-3 font-semibold text-text-main">{{ member.name }}</td>
                    <td class="px-4 py-3 text-text-sub">{{ ROLE_LABEL[member.role] }}</td>
                    <td class="px-4 py-3 text-text-sub">{{ member.memberNo }}</td>
                    <td class="px-4 py-3">
                      <span
                        :class="member.status === 'ACTIVE'
                          ? 'badge-success'
                          : member.status === 'ON_LEAVE'
                            ? 'badge-warning'
                            : 'badge-danger'"
                      >
                        {{ MEMBER_STATUS_LABEL[member.status] }}
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <BaseDrawer
      :is-open="isCreateDrawerOpen"
      title="부서 추가"
      submit-text="등록하기"
      @close="isCreateDrawerOpen = false"
      @submit="handleCreateDepartment"
    >
      <form class="space-y-5" @submit.prevent="handleCreateDepartment">
        <Input
          id="new-department-name"
          v-model="createForm.name"
          label="부서명"
          placeholder="부서명을 입력해주세요."
          required
          :disabled="isCreating"
          :error="Boolean(createNameError)"
          :error-message="createNameError"
        />

        <div class="flex flex-col gap-1.5">
          <label for="new-parent-department" class="text-sm font-semibold text-text-main">
            상위 부서
          </label>
          <select
            id="new-parent-department"
            v-model="createForm.parentDepartmentId"
            class="input-custom h-11 py-2.5"
            :disabled="isCreating"
          >
            <option
              v-for="department in departmentStore.departments"
              :key="department.departmentId"
              :value="department.departmentId"
            >
              {{ department.name }}
            </option>
          </select>
          <p class="text-xs text-text-sub">
            선택한 부서 아래에 새 하위 부서가 생성됩니다.
          </p>
          <p v-if="createParentError" class="text-xs font-medium text-danger" role="alert">
            {{ createParentError }}
          </p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="isCreating" @click="isCreateDrawerOpen = false">
            취소
          </Button>
          <Button
            :loading="isCreating"
            :disabled="Boolean(createNameError || createParentError)"
            @click="handleCreateDepartment"
          >
            등록하기
          </Button>
        </div>
      </template>
    </BaseDrawer>

    <ConfirmationModal
      :is-open="Boolean(departmentToDelete)"
      title="부서 삭제"
      :message="`'${departmentToDelete?.name ?? ''}' 부서를 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.`"
      confirm-text="삭제"
      :loading="isDeleting"
      @cancel="departmentToDelete = null"
      @confirm="handleDeleteDepartment"
    />
  </div>
</template>
