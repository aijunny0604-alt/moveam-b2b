// VITE_MOCK=1 전용 목업 클라이언트 — 백엔드 없이 화면 확인용 (프로덕션 빌드에선 트리셰이킹으로 제거됨)
// 실제 supabase-js 중 이 앱이 쓰는 표면만 흉내낸다. 관리자 쓰기 동작은 no-op.
// 이미지는 dev 서버의 /@fs/ 경로로만 참조한다 — 정적 import 하면 빌드 에셋에 새어 들어간다.
const fsImg = (f) => `${import.meta.env.BASE_URL}@fs/C:/Users/MOVEAM_PC/moveam-b2b/seed/images/${f}`

const MOCK_URLS = {
  'mock/1.jpg': fsImg('row004_1.jpg'),
  'mock/2.jpg': fsImg('row025_1.jpg'),
  'mock/3.jpg': fsImg('row056_1.jpg'),
  'mock/4.jpg': fsImg('row080_1.jpg'),
  'mock/5.jpg': fsImg('row022_1.jpg'),
  'mock/5b.jpg': fsImg('row022_2.jpg'),
}

const profile = { id: 'mock-user', company_name: '테스트모터스', role: 'admin', is_active: true }

const brands = [
  { id: 1, name: 'BurnWay', slug: 'burnway', sort_order: 1, is_active: true, products: [{ count: 5 }] },
  { id: 2, name: 'HKS', slug: 'hks', sort_order: 2, is_active: true, products: [{ count: 1 }] },
]

const products = [
  {
    id: 1, brand_id: 1, name: '제네시스 쿠페 드리프트 타각킷', description: null,
    wholesale_price: 209000, retail_price: 270000, search_keywords: '젠쿱 타각', is_active: true, in_stock: false, note: null,
    public_note: '장착 시 얼라인먼트 재조정 필수. BK1/BK2 공용.', sort_order: 1,
    product_variants: [], product_images: [{ id: 1, product_id: 1, storage_path: 'mock/1.jpg', sort_order: 1 }],
    brands: { name: 'BurnWay', slug: 'burnway' },
  },
  {
    id: 2, brand_id: 1, name: '현대/기아 허브스페이스 PCD 114.3', description: null,
    wholesale_price: null, retail_price: null, search_keywords: '허브 스페이서', is_active: true, in_stock: true, note: null, sort_order: 2,
    product_variants: [
      { id: 1, product_id: 2, label: '15mm', wholesale_price: 77000, retail_price: 108000, sort_order: 1 },
      { id: 2, product_id: 2, label: '18mm', wholesale_price: 93000, retail_price: 126000, sort_order: 2 },
      { id: 3, product_id: 2, label: '20mm', wholesale_price: 93000, retail_price: 126000, sort_order: 3 },
      { id: 4, product_id: 2, label: '35mm', wholesale_price: 121000, retail_price: 144000, sort_order: 4 },
      { id: 5, product_id: 2, label: '45mm', wholesale_price: 132000, retail_price: 180000, sort_order: 5 },
      { id: 6, product_id: 2, label: '55mm', wholesale_price: 155000, retail_price: 216000, sort_order: 6 },
    ],
    product_images: [{ id: 2, product_id: 2, storage_path: 'mock/2.jpg', sort_order: 1 }],
    brands: { name: 'BurnWay', slug: 'burnway' },
  },
  {
    id: 3, brand_id: 1, name: '벨로스터N/아반떼N 전용 다운 파이프', description: '자바라 라인 포함',
    wholesale_price: null, retail_price: null, search_keywords: '벨엔 아엔 다운파이프', is_active: true,
    note: '내부 메모 테스트 — 업체에겐 안 보임', sort_order: 3,
    product_variants: [
      { id: 7, product_id: 3, label: '직관 타입', wholesale_price: 765000, retail_price: 900000, sort_order: 1 },
      { id: 8, product_id: 3, label: '촉매 타입', wholesale_price: 1062500, retail_price: 1250000, sort_order: 2 },
    ],
    product_images: [{ id: 3, product_id: 3, storage_path: 'mock/3.jpg', sort_order: 1 }],
    brands: { name: 'BurnWay', slug: 'burnway' },
  },
  {
    id: 4, brand_id: 2, name: 'HKS BOV 밸브 SQV 블랙 에디션', description: null,
    wholesale_price: null, retail_price: null, search_keywords: 'BOV 블로우오프', is_active: true, in_stock: true, note: null, sort_order: 4,
    product_variants: [
      { id: 9, product_id: 4, label: '블랙', wholesale_price: 265000, retail_price: 370000, sort_order: 1 },
      { id: 10, product_id: 4, label: '실버', wholesale_price: 265000, retail_price: 350000, sort_order: 2 },
    ],
    product_images: [{ id: 4, product_id: 4, storage_path: 'mock/4.jpg', sort_order: 1 }],
    brands: { name: 'HKS', slug: 'hks' },
  },
  {
    id: 5, brand_id: 1, name: '제네시스 쿠페 드리프트 라스트 킷 아주 긴 제품명 줄바꿈 테스트용', description: '옵션 추가 시 할인',
    wholesale_price: 1700000, retail_price: 1900000, search_keywords: '젠쿱 라스트킷', is_active: true, in_stock: true, note: null, sort_order: 5,
    product_variants: [],
    product_images: [
      { id: 5, product_id: 5, storage_path: 'mock/5.jpg', sort_order: 1 },
      { id: 6, product_id: 5, storage_path: 'mock/5b.jpg', sort_order: 2 },
    ],
    brands: { name: 'BurnWay', slug: 'burnway' },
  },
]

let session = null
let authCb = null
const fakeSession = { user: { id: 'mock-user' } }

function table(name) {
  const filters = {}
  const resolve = () => {
    let rows = name === 'brands' ? brands : name === 'products' ? products : name === 'profiles' ? [profile] : []
    for (const [k, v] of Object.entries(filters)) rows = rows.filter((r) => String(r[k]) === String(v))
    return rows
  }
  const api = {
    select: () => api,
    eq: (k, v) => { filters[k] = v; return api },
    order: () => api,
    insert: () => api,
    update: () => api,
    delete: () => api,
    single: async () => ({ data: resolve()[0] ?? null, error: null }),
    maybeSingle: async () => ({ data: resolve()[0] ?? null, error: null }),
    then: (onOk, onErr) => Promise.resolve({ data: resolve(), error: null }).then(onOk, onErr),
  }
  return api
}

export const mockClient = {
  auth: {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: (cb) => { authCb = cb; return { data: { subscription: { unsubscribe() {} } } } },
    signInWithPassword: async () => { session = fakeSession; authCb?.('SIGNED_IN', session); return { error: null } },
    signOut: async () => { session = null; authCb?.('SIGNED_OUT', null); return { error: null } },
  },
  from: table,
  storage: {
    from: () => ({
      createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ signedUrl: MOCK_URLS[p] ?? null })) }),
      upload: async () => ({ error: { message: '목업 모드에선 업로드 불가' } }),
      remove: async () => ({ error: null }),
    }),
  },
}
