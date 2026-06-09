<template>
  <div class="flex flex-col h-full overflow-hidden bg-background text-text-main transition-colors duration-300">
    <!-- 페이지 헤더 -->
    <div class="page-header px-3 pt-3 flex flex-col gap-3 shrink-0 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="page-subtitle mb-1">
          Tangible Asset Item
        </p>
        <h1 class="page-title">
          유형자산 품목 관리
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline">
          <Upload :size="15" />
          CSV 파일 등록
        </Button>

        <Button variant="primary" @click="isCategoryDrawerOpen = true">
          <Edit :size="15" />
          자산 카테고리 수정
        </Button>
        <TangibleItemCategory 
          :is-open="isCategoryDrawerOpen" 
          :initial-categories="localCategories"
          @close="isCategoryDrawerOpen = false" 
          @update-categories="handleCategoryUpdate"
        />
        
        <Button variant="primary" @click="isRegisterDrawerOpen = true">
          <Plus :size="15" />
          자산 품목 등록
        </Button>
        <TangibleItemRegister 
          :is-open="isRegisterDrawerOpen" 
          :initial-categories="localCategories"
          @close="isRegisterDrawerOpen = false" 
          @register-asset="handleRegisterAsset"
        />
      </div>
    </div>

    <!-- 테이블 -->
    <div class="card mb-4 flex-1 min-h-0 flex flex-col border border-border overflow-visible relative z-10">
      <div class="shrink-0 rounded-t-2xl bg-surface border-b border-border px-2 pb-3 flex flex-col gap-3 relative z-30 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-2 text-text-main shrink-0">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
            class="w-36"
          />
          <span class="text-xs text-text-sub whitespace-nowrap">
            총 {{ totalElements }}개 항목 중 {{ itemRangeText }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-text-main">
          <Dropdown
            v-model="searchParams.categoryName"
            :options="cascadingOptions"
            root-option="전체 품목 보기"
            menu-align="right"
            submenu-direction="left"
            class="w-44 text-text-sub"
          >
            <template #icon>
              <Layers :size="16" />
            </template>
          </Dropdown>

          <Button
            variant="primary"
            size="md"
            class="shrink-0"
            @click="handleSearch"
          >
            <Search :size="14" />
            조회하기
          </Button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-surface p-3 relative z-10">
        <Table
          :columns="tableColumns"
          :rows="serverAssetList"
          :is-loading="isLoading"
          row-key="assetName"
          class="min-w-full" 
        >
          <template #cell-isStandard="{ value }">
            <span>
              {{ value === 1 ? '표준 자산' : '비표준 자산' }}
            </span>
          </template>
        </Table>
      </div>

      <div class="shrink-0 rounded-b-2xl border-t border-border bg-surface px-4 pt-3 flex items-center justify-center relative z-20">
        <div class="flex items-center gap-2">
          <button
            :disabled="searchParams.page === 0"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            @click="changePage(searchParams.page - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <button 
            v-for="pageIndex in totalPages" 
            :key="pageIndex" 
            type="button" 
            :class="[
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
              searchParams.page === (pageIndex - 1)
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'text-text-sub hover:bg-surface-secondary'
            ]" 
            @click="changePage(pageIndex - 1)"
          >
            {{ pageIndex }}
          </button>

          <button
            :disabled="searchParams.page >= totalPages - 1"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-sub hover:bg-surface-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            @click="changePage(searchParams.page + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Button from '@/components/common/Button.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import Table, { type Column } from '@/components/common/Table.vue';
import { Edit, Plus, Upload, Layers, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';

import TangibleItemCategory from './TangibleItemCatergory.vue';
import TangibleItemRegister from './TangibleItemRegister.vue';

interface Asset {
  [key: string]: unknown
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
}

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

// 드로어 열림/닫힘 상태 플래그
const isCategoryDrawerOpen = ref(false);
const isRegisterDrawerOpen = ref(false);

const rowsPerPageOptions = ['5개씩 보기', '10개씩 보기', '20개씩 보기', '50개씩 보기'];
const rowsPerPageText = ref('20개씩 보기');

const searchParams = ref({
  companyId: '1',
  categoryName: '전체 품목 보기',
  categoryId: '',
  modelName: '',
  isStandard: 1,
  page: 0,
  size: 20
});

// 이중 드롭다운 레이아웃용 대분류-소분류 원본 상태 구조
const cascadingOptions = ref<CategoryGroup[]>([
  {
    mainCategory: 'IT / 전자기기',
    subCategories: ['IT / 전자기기 - 전체', '노트북', '모니터', '스마트폰', '태블릿', '주변기기']
  },
  {
    mainCategory: '사무용 가구',
    subCategories: ['사무용 가구 - 전체', '사무가구']
  },
  {
    mainCategory: '사무기기 / 가전',
    subCategories: ['사무기기 / 가전 - 전체', '사무기기']
  }
]);

// 자식 드로어(단일 1차원 리스트 규격)에 내려보내 주기 위한 computed 바인딩 데이터
const localCategories = computed(() => {
  const list: { id: string; name: string }[] = [];
  let index = 1;
  cascadingOptions.value.forEach(group => {
    group.subCategories.forEach(sub => {
      if (!sub.endsWith(' - 전체')) {
        list.push({ id: String(index++), name: sub });
      }
    });
  });
  return list;
});

// [에러 해결 및 데이터 동기화 구현] 
// 자식 컴포넌트(1차원 배열)의 변경사항을 부모의 계층형 대분류 구조(2차원 배열)에 맞게 안전하게 가공 처리합니다.
const handleCategoryUpdate = (updatedList: { id: string; name: string }[]) => {
  const updatedNames = updatedList.map(cat => cat.name);

  cascadingOptions.value = cascadingOptions.value.map(group => {
    // 1. 기존의 소분류 목록 중 자식 쪽에서 삭제되지 않고 살아남은 값들만 필터링
    const fixedSubCategories = group.subCategories.filter(sub => {
      if (sub.endsWith(' - 전체')) return true; // 기본 상단 탭 유지
      return updatedNames.includes(sub);
    });

    return {
      ...group,
      subCategories: fixedSubCategories
    };
  });

  // 2. 만약 자식 화면에서 완전히 새로운 카테고리를 추가했다면, 편의상 첫 번째 대분류('IT / 전자기기') 섹션에 병합
  const allCurrentSubs = cascadingOptions.value.flatMap(g => g.subCategories);
  updatedNames.forEach(name => {
    if (!allCurrentSubs.includes(name)) {
      cascadingOptions.value[0].subCategories.push(name);
    }
  });

  // 3. 현재 선택하여 보고 있던 필터명이 수정 중에 증발했을 때를 대비한 안전 예외 필터링 처리
  const flatCurrentCategories = cascadingOptions.value.flatMap(g => g.subCategories);
  if (searchParams.value.categoryName !== '전체 품목 보기' && !flatCurrentCategories.includes(searchParams.value.categoryName)) {
    searchParams.value.categoryName = '전체 품목 보기';
  }

  handleSearch(); 
};

// 새 품목 데이터 수신 후 배열 맨 앞에 추가
const handleRegisterAsset = (newAsset: Omit<Asset, 'id'>) => {
  mockDatabase.unshift(newAsset as Asset);
  handleSearch(); 
};

const serverAssetList = ref<Asset[]>([]);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);

const tableColumns: Column<Asset>[] = [
  { key: 'assetName', label: '제품명', align: 'center', width: '35%' },
  { key: 'category', label: '카테고리', align: 'center', width: '15%' },
  { key: 'manufacturer', label: '제조사', align: 'center', width: '15%' },
  { key: 'modelName', label: '모델명', align: 'center', width: '20%' },
  { key: 'isStandard', label: '표준 품목 여부', align: 'center', width: '15%' }
];

const mockDatabase: Asset[] = [
  { assetName: 'MacBook Pro 16인치 M3 Max', category: '노트북', manufacturer: 'Apple', modelName: 'A2992', isStandard: 1 },
  { assetName: 'ThinkPad X1 Carbon Gen 12', category: '노트북', manufacturer: 'Lenovo', modelName: '21KC', isStandard: 0 },
  { assetName: '시디즈 T80 하이엔드 의자', category: '사무가구', manufacturer: '시디즈', modelName: 'TN800HLDA', isStandard: 1 },
  { assetName: 'MX Keys S 무선 팬터그래프', category: '주변기기', manufacturer: 'Logitech', modelName: 'KX800S', isStandard: 1 },
  { assetName: '퍼시스 6인용 모듈러 회의 테이블', category: '사무가구', manufacturer: '퍼시스', modelName: 'CRN016', isStandard: 1 },
  { assetName: 'iPhone 15 Pro Max 512GB', category: '스마트폰', manufacturer: 'Apple', modelName: 'A3106', isStandard: 1 },
  { assetName: 'Galaxy S24 Ultra 자급제', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-S928N', isStandard: 1 },
  { assetName: 'iPad Pro 13인치 M4 셀룰러', category: '태블릿', manufacturer: 'Apple', modelName: 'A3007', isStandard: 0 },
  { assetName: 'MX Master 3S 무소음 마우스', category: '주변기기', manufacturer: 'Logitech', modelName: 'MX-M3S', isStandard: 1 },
  { assetName: 'LG 27인치 QHD 에르고 모니터', category: '모니터', manufacturer: 'LG전자', modelName: '27QN880', isStandard: 1 },
  { assetName: 'Galaxy Tab S9 Ultra 256GB', category: '태블릿', manufacturer: '삼성전자', modelName: 'SM-X910', isStandard: 1 },
  { assetName: '에어론 체어 풀 스펙 B사이즈', category: '사무가구', manufacturer: 'Herman Miller', modelName: 'AERON-B', isStandard: 1 },
  { assetName: 'Galaxy Book4 Ultra 코어Ultra9', category: '노트북', manufacturer: '삼성전자', modelName: 'NT960XGK', isStandard: 1 },
  { assetName: '모션데스크 E0 스마트 1600', category: '사무가구', manufacturer: '데스커', modelName: 'DSMD1607', isStandard: 0 },
  { assetName: '오디세이 OLED G9 게이밍 모니터', category: '모니터', manufacturer: '삼성전자', modelName: 'G95SC', isStandard: 0 },
  { assetName: '가산 지사 복사기 렌탈 장비', category: '사무기기', manufacturer: 'Sindoh', modelName: 'D450-RENT', isStandard: 0 }
];

const loadServerData = async () => {
  isLoading.value = true;

  setTimeout(() => {
    let filtered = [...mockDatabase];
    const categoryFilter = searchParams.value.categoryName;
    const modelFilter = searchParams.value.modelName.trim().toLowerCase();

    // 이중 계층 검색 엔진 필터 조건식 구현
    if (categoryFilter !== '전체 품목 보기') {
      if (categoryFilter.endsWith(' - 전체')) {
        const mainCat = categoryFilter.replace(' - 전체', '');
        const group = cascadingOptions.value.find(g => g.mainCategory === mainCat);
        if (group) {
          filtered = filtered.filter(item => group.subCategories.includes(item.category));
        }
      } else {
        filtered = filtered.filter(item => item.category === categoryFilter);
      }
    }

    if (modelFilter) {
      filtered = filtered.filter(
        item => 
          item.modelName.toLowerCase().includes(modelFilter) || 
          item.assetName.toLowerCase().includes(modelFilter)
      );
    }

    const start = searchParams.value.page * searchParams.value.size;
    const end = start + searchParams.value.size;

    serverAssetList.value = filtered.slice(start, end);
    totalElements.value = filtered.length;
    totalPages.value = Math.ceil(totalElements.value / searchParams.value.size);

    isLoading.value = false;
  }, 120);
};

const handleSearch = () => {
  searchParams.value.page = 0;
  loadServerData();
};

const changePage = (targetPage: number) => {
  searchParams.value.page = targetPage;
  loadServerData();
};

const itemRangeText = computed(() => {
  if (totalElements.value === 0) return '0-0';
  const start = searchParams.value.page * searchParams.value.size + 1;
  const end = Math.min(start + searchParams.value.size, totalElements.value);
  return `${start}-${end}`;
});

watch(rowsPerPageText, (newVal) => {
  const matches = newVal.match(/\d+/);
  searchParams.value.size = matches ? parseInt(matches[0], 10) : 10;
  searchParams.value.page = 0;
  loadServerData();
});

onMounted(() => {
  loadServerData();
});
</script>
