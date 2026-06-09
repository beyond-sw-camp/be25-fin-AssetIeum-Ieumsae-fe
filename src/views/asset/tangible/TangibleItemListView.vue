<template>
  <div class="flex flex-col h-full overflow-hidden bg-background">
    <!-- 페이지 헤더 -->
    <div class="page-header p-6 flex items-center justify-between shrink-0">
      <div class="text-primary">
        <p class="text-sm text-text-sub mb-1">
          Tangible Asset Item
        </p>
        <h1 class="text-3xl font-bold">
          유형자산 품목 관리
        </h1>
      </div>

      <div class="flex gap-2">
        <Button variant="outline">
          <Upload :size="16" />
          CSV 파일 등록
        </Button>

        <Button variant="primary">
          <Edit :size="16" />
          자산 카테고리 수정
        </Button>

        <Button variant="primary">
          <Plus :size="16" />
          자산 품목 등록
        </Button>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="card mx-5 mb-5 flex-1 min-h-0 flex flex-col overflow-hidden">
      <!-- 테이블 상단 -->
      <div class="shrink-0 p-4 border-b border-border flex items-center justify-between gap-4">
        <!-- 페이지 행 수 -->
        <div class="flex items-center gap-2">
          <Dropdown
            v-model="rowsPerPageText"
            :options="rowsPerPageOptions"
          />
          <span class="text-xs">
            총 {{ totalElements }}개 항목 중
            {{ itemRangeText }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <!-- 카테고리 드롭다운 -->
          <Dropdown
            v-model="searchParams.categoryName"
            :options="cascadingOptions"
            root-option="전체 품목 보기"
          >
            <template #icon>
              <Layers :size="16" />
            </template>
          </Dropdown>
          <!-- 검색 -->
          <input
            v-model="searchParams.modelName"
            type="text"
            placeholder="모델명 입력"
            class="min-w-[180px] rounded-xl border border-border px-3 py-2"
            @keyup.enter="handleSearch"
          >
          <Button
            variant="primary"
            @click="handleSearch"
          >
            <Search :size="14" />
            조회하기
          </Button>
        </div>
      </div>

      <!-- 테이블 목록 -->
      <div class="flex-1 min-h-0 overflow-hidden bg-white">
        <div class="h-full overflow-auto">
          <Table
            :columns="tableColumns"
            :rows="serverAssetList"
            :is-loading="isLoading"
            row-key="assetName"
            class="min-w-full" 
          >
            <template #cell-isStandard="{ value }">
              <span v-if="value === 1">표준 자산</span>
              <span v-else>비표준 자산</span>
            </template>
          </Table>
        </div>
      </div>

      <!-- 페이징 -->
      <div class="shrink-0 border-t border-border bg-surface px-6 py-4 flex items-center justify-center">
        <div class="flex items-center gap-3">
          <!-- 좌측 버튼 -->
          <button
            :disabled="searchParams.page === 0"
            class="disabled:opacity-40"
            @click="changePage(searchParams.page - 1)"
          >
            <ChevronLeft :size="16" />
          </button>

          <!-- 페이지 버튼 -->
          <button 
            v-for="pageIndex in totalPages" 
            :key="pageIndex" 
            type="button" 
            :class="[
              'px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all',
              searchParams.page === (pageIndex - 1)
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-text-sub hover:bg-surface-secondary'
            ]" 
            @click="changePage(pageIndex - 1)"
          >
            {{ pageIndex }}
          </button>

          <!-- 우측 버튼 -->
          <button
            :disabled="searchParams.page >= totalPages - 1"
            class="disabled:opacity-40"
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

interface CategoryGroup {
  mainCategory: string
  subCategories: string[]
}

const cascadingOptions: CategoryGroup[] = [
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
];

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

const serverAssetList = ref<Asset[]>([]);
const totalElements = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);

interface Asset {
  [key: string]: unknown
  assetName: string
  category: string
  manufacturer: string
  modelName: string
  isStandard: number
}

const tableColumns: Column<Asset>[] = [
  { key: 'assetName', label: '제품명', align: 'center', width: '35%' },
  { key: 'category', label: '카테고리', align: 'center', width: '15%' },
  { key: 'manufacturer', label: '제조사', align: 'center', width: '15%' },
  { key: 'modelName', label: '모델명', align: 'center', width: '20%' },
  { key: 'isStandard', label: '표준 품목 여부', align: 'center', width: '15%' }
];

// 품목 목록 (55개)
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
  { assetName: '가산 지사 복사기 렌탈 장비', category: '사무기기', manufacturer: 'Sindoh', modelName: 'D450-RENT', isStandard: 0 },
  { assetName: 'UltraSharp 32 4K 비디오 에디션', category: '모니터', manufacturer: 'DELL', modelName: 'U3224KB', isStandard: 1 },
  { assetName: '레이저젯 프로 MFP 고속 복합기', category: '사무기기', manufacturer: 'HP', modelName: 'M428fdw', isStandard: 1 },
  { assetName: 'LG 그램 Pro AI 16인치', category: '노트북', manufacturer: 'LG전자', modelName: '16Z90SP', isStandard: 0 },
  { assetName: '앤커 PowerConf 4K 웹캠', category: '주변기기', manufacturer: 'Anker', modelName: 'C300-4K', isStandard: 0 },
  { assetName: 'Dell XPS 15 9530 크리에이터', category: '노트북', manufacturer: 'DELL', modelName: 'XPS9530', isStandard: 1 },
  { assetName: 'HP EliteBook 840 G10 비즈니스', category: '노트북', manufacturer: 'HP', modelName: 'EB840G10', isStandard: 1 },
  { assetName: 'MacBook Air 13인치 M3', category: '노트북', manufacturer: 'Apple', modelName: 'A3113', isStandard: 1 },
  { assetName: 'ASUS ROG Zephyrus G16', category: '노트북', manufacturer: 'ASUS', modelName: 'GU605V', isStandard: 0 },
  { assetName: 'LG UltraFine 32인치 4K 모니터', category: '모니터', manufacturer: 'LG전자', modelName: '32UN880', isStandard: 1 },
  { assetName: 'Dell UltraSharp 27 4K Hub', category: '모니터', manufacturer: 'DELL', modelName: 'U2723QE', isStandard: 1 },
  { assetName: '한성컴퓨터 TFG32F16V 커브드', category: '모니터', manufacturer: '한성컴퓨터', modelName: 'TFG32F16V', isStandard: 0 },
  { assetName: 'BenQ PD3220U 디자이너 모니터', category: '모니터', manufacturer: 'BenQ', modelName: 'PD3220U', isStandard: 0 },
  { assetName: 'iPhone 15 128GB 업무용폰', category: '스마트폰', manufacturer: 'Apple', modelName: 'A3090', isStandard: 1 },
  { assetName: 'Galaxy S24 기본형 자급제', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-S921N', isStandard: 1 },
  { assetName: 'Galaxy A35 가성비 법인폰', category: '스마트폰', manufacturer: '삼성전자', modelName: 'SM-A356N', isStandard: 1 },
  { assetName: 'iPad Air 11인치 M2 Wi-Fi', category: '태블릿', manufacturer: 'Apple', modelName: 'A2898', isStandard: 1 },
  { assetName: 'Galaxy Tab S9 플러스 5G', category: '태블릿', manufacturer: '삼성전자', modelName: 'SM-X816N', isStandard: 1 },
  { assetName: '리얼포스 R3 키보드 저소음적축', category: '주변기기', manufacturer: 'Topre', modelName: 'R3HA11', isStandard: 0 },
  { assetName: '로지텍 Pebble 2 키보드 마우스 세트', category: '주변기기', manufacturer: 'Logitech', modelName: 'MK470', isStandard: 1 },
  { assetName: '커세어 K70 PRO 기계식 키보드', category: '주변기기', manufacturer: 'Corsair', modelName: 'K70-PRO', isStandard: 0 },
  { assetName: '앱코 HACKER K660 축교환 키보드', category: '주변기기', manufacturer: 'ABKO', modelName: 'K660', isStandard: 1 },
  { assetName: '시디즈 T50 화이트쉘 메쉬의자', category: '사무가구', manufacturer: '시디즈', modelName: 'TN500HLDA', isStandard: 1 },
  { assetName: '허먼밀러 뉴 에어론 라이트 엔트리', category: '사무가구', manufacturer: 'Herman Miller', modelName: 'AERON-LITE', isStandard: 0 },
  { assetName: '데스커 베이직 컴퓨터 데스크 1400', category: '사무가구', manufacturer: '데스커', modelName: 'DSBD1407', isStandard: 1 },
  { assetName: '퍼시스 인에이블 모션데스크 1400', category: '사무가구', manufacturer: '퍼시스', modelName: 'FDD014M', isStandard: 1 },
  { assetName: '루나랩 전동 모션데스크 커스텀', category: '사무가구', manufacturer: '루나랩', modelName: 'LUNA-MOTION', isStandard: 0 },
  { assetName: '이케아 마르쿠스 오피스 체어', category: '사무가구', manufacturer: 'IKEA', modelName: 'MARKUS', isStandard: 1 },
  { assetName: '신도리코 A4 컬러 레이저 프린터', category: '사무기기', manufacturer: 'Sindoh', modelName: 'C310', isStandard: 1 },
  { assetName: '캐논 MAXIFY 고속 무한잉크 복합기', category: '사무기기', manufacturer: 'Canon', modelName: 'GX7092', isStandard: 1 },
  { assetName: '삼성전자 스마트 복사기 SL-K4300LX', category: '사무기기', manufacturer: '삼성전자', modelName: 'SL-K4300LX', isStandard: 1 },
  { assetName: '후지제록스 ApeosPort 컬러 복합기', category: '사무기기', manufacturer: 'Fuji Xerox', modelName: 'C3060', isStandard: 0 },
  { assetName: '현대오피스 문서파쇄기 저소음용', category: '사무기기', manufacturer: '현대오피스', modelName: 'PK-815x', isStandard: 1 },
  { assetName: '시스코 비즈니스 24포트 스위칭허브', category: '주변기기', manufacturer: 'Cisco', modelName: 'CBS250', isStandard: 1 },
  { assetName: '아이피타임 Wi-Fi 6E 유무선공유기', category: '주변기기', manufacturer: 'EFM네트웍스', modelName: 'AX11000', isStandard: 1 },
  { assetName: '소니 WH-1000XM5 화상회의 헤드셋', category: '주변기기', manufacturer: 'SONY', modelName: 'WH-1000XM5', isStandard: 0 },
  { assetName: '브리츠 컴팩트 사운드바 스피커', category: '주변기기', manufacturer: 'Britz', modelName: 'BA-R9', isStandard: 1 },
  { assetName: '삼성전자 포터블 SSD T7 1TB', category: '주변기기', manufacturer: '삼성전자', modelName: 'MU-PC1T0', isStandard: 1 },
  { assetName: '샌디스크 CZ74 Ultra Luxe 64GB', category: '주변기기', manufacturer: 'SanDisk', modelName: 'SDCZ74', isStandard: 1 },
  { assetName: '벨킨 USB-C 11-in-1 멀티 허브 독', category: '주변기기', manufacturer: 'Belkin', modelName: 'INC006', isStandard: 1 }
];

const loadServerData = async () => {
  isLoading.value = true;

  setTimeout(() => {
    let filtered = [...mockDatabase];
    const categoryFilter = searchParams.value.categoryName;
    const modelFilter = searchParams.value.modelName.trim().toLowerCase();

    if (categoryFilter !== '전체 품목 보기') {
      if (categoryFilter.endsWith(' - 전체')) {
        const mainCat = categoryFilter.replace(' - 전체', '');
        const group = cascadingOptions.find(g => g.mainCategory === mainCat);
        if (group) {
          filtered = filtered.filter(item => group.subCategories.includes(item.category));
        }
      } else {
        filtered = filtered.filter(item => item.category === categoryFilter);
      }
    }

    if (modelFilter) {
      filtered = filtered.filter(item => item.modelName.toLowerCase().includes(modelFilter));
    }

    const start = searchParams.value.page * searchParams.value.size;
    const end = start + searchParams.value.size;

    serverAssetList.value = filtered.slice(start, end);
    totalElements.value = filtered.length;
    totalPages.value = Math.ceil(totalElements.value / searchParams.value.size);

    isLoading.value = false;
  }, 100);
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
  const end = Math.min(start + searchParams.value.size - 1, totalElements.value);
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