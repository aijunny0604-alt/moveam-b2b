// JSR 카탈로그 치수/도면 페이지(seed/jsr-specs/spec_pNN.jpg)를 제품 추가 사진으로 첨부
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))
const specsDir = resolve(__dirname, '../seed/jsr-specs')

// 제품명 → 카탈로그 페이지 (도면/치수)
const MAP = {
  'XHAUST G1 세트': [2], 'XHAUST G2 세트': [2], 'XHAUST G1+C1 세트': [2], 'XHAUST G2+C1 세트': [2],
  'XHAUST 모듈 단품': [1],
  'BLOWSOME 세트': [3, 4],
  'VOFFEN BMW 가변 모듈': [5],
  '100 ROUND 타공 머플러': [7], '114 ROUND 타공 머플러': [7], '150 ROUND 타공 머플러': [7],
  '100 ROUND 챔버 머플러': [8],
  '가변 머플러 TVB54/64': [9], '가변 머플러 TVB77': [9],
  '모터 가변 머플러 MVB (Y/h)': [10], '모터 가변 세트 MVB_SET': [11], 'MV_KIT (모터 가변 모듈)': [11],
  '밸브 가변 머플러 TVB Y/h': [12],
  'T 머플러 일반 (NEW_T6454)': [13], 'T 머플러 가변 (VT BODY)': [14],
  'VT 가변 머플러 (BMW 전용)': [15, 16, 17, 18],
  'X,H 파이프 머플러': [19],
  '진공 가변 밸브 (Vacuum Valve)': [20], 'FXR 리모컨&컨트롤러': [20], 'FXS 스위치': [20],
  'FXPW 진공밸브 무선 세트': [20], 'FXPS 진공밸브 유선 세트': [20], 'VP_KIT 진공 펌프 세트': [21],
  'SCF 카본 팁 (싱글)': [22], 'SCF 카본 팁 (듀얼)': [22],
  'CFK 카본 팁 (싱글)': [23], 'CFK 카본 팁 (듀얼)': [23],
  'NCF_130 카본 팁': [24], 'NPK_80 팁': [24], 'NPK_89 팁': [25], 'NPK_100 팁': [25], 'NPK_114 팁': [26],
  'SNPK_89 팁': [27], 'SNPK_100 팁': [27], 'SNPK_114 팁': [28], 'SNPK_127 팁 (싱글)': [28], 'SNPK_142 팁 (싱글)': [28],
  'DSQ1 팁': [30], 'DSQ2 팁': [30], 'AMG 커버 팁': [31, 32],
  'Separator 특수형태 (T_6454)': [34],
  '촉매 CATALYST': [35], '자바라 FLEXIBLE': [35],
  '인터쿨러 INTERCOOLER': [36],
  '실리콘 직선 호스 Straight': [37], '실리콘 리듀서 호스 Straight Reducer': [37],
  '실리콘 엘보 호스 (45°/90°)': [38], '실리콘 진공 호스 (5m)': [39],
  '플랜지 FLANGE': [39], '행거 HANGER': [39],
  '스테인리스 직선 파이프 (2m)': [40], '스테인리스 밴딩 파이프': [40], '스텐 단엘보': [40],
  '알루미늄 파이프': [41], '알루미늄 밴딩 파이프 (폴리쉬)': [41],
  '레이저 파이프 90도 분배관': [42], '파이컷 PIE CUT (4PCS 1SET)': [42],
}

const { data: jsrBrand } = await sb.from('brands').select('id').eq('slug', 'jsr').single()
const { data: products } = await sb.from('products')
  .select('id, name, product_images(id)')
  .eq('brand_id', jsrBrand.id)

let ok = 0, miss = 0
for (const [name, pages] of Object.entries(MAP)) {
  const prod = products.find((p) => p.name === name)
  if (!prod) { console.error('제품 못 찾음:', name); miss++; continue }
  let sort = (prod.product_images?.length ?? 0)
  for (const n of pages) {
    const file = `spec_p${String(n).padStart(2, '0')}.jpg`
    const buf = readFileSync(resolve(specsDir, file))
    const path = `products/${prod.id}/${file}`
    const { error: upErr } = await sb.storage.from('product-images')
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true })
    if (upErr) { console.error(name, file, upErr.message); continue }
    const { error } = await sb.from('product_images')
      .insert({ product_id: prod.id, storage_path: path, sort_order: ++sort })
    if (error) console.error(name, file, error.message)
    else ok++
  }
}
console.log(`도면 첨부 완료: ${ok}장, 제품 미매칭 ${miss}건`)
