// 시드 JSON → Supabase 임포트
// 사용법: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY를 .env.local에 넣고
//   npm run import-seed
// 같은 시드를 다시 돌리면 중복 생성되므로, 재실행 전 products를 비울 것.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local 간이 로더 (의존성 없이)
try {
  const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* .env.local 없으면 환경변수 직접 사용 */ }

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (.env.local)')
  process.exit(1)
}

const sb = createClient(url, key)
const seed = JSON.parse(readFileSync(resolve(__dirname, '../seed/burnway-260702.json'), 'utf8'))

// 엑셀에서 추출한 제품 사진: seed/images/row{엑셀행}_{순번}.jpg
// 엑셀 3행 = products[0] → 제품 인덱스 = 엑셀행 - 3 (사진 검수 완료 2026-07-03)
const imagesDir = resolve(__dirname, '../seed/images')
const imagesByIndex = {}
if (existsSync(imagesDir)) {
  for (const f of readdirSync(imagesDir).sort()) {
    const m = f.match(/^row(\d{3})_(\d+)\.(jpg|png)$/)
    if (!m) continue
    const idx = parseInt(m[1], 10) - 3
    ;(imagesByIndex[idx] ??= []).push(f)
  }
}

// 1. 브랜드 upsert
const { data: brands, error: brandErr } = await sb
  .from('brands')
  .upsert(seed.brands, { onConflict: 'slug' })
  .select()
if (brandErr) { console.error('brands 실패:', brandErr); process.exit(1) }
const brandId = Object.fromEntries(brands.map(b => [b.slug, b.id]))
console.log(`브랜드 ${brands.length}개 준비 완료`)

// 2. 제품 + variants + 사진
let ok = 0, fail = 0, imgCount = 0
for (const [i, p] of seed.products.entries()) {
  const { data: prod, error } = await sb.from('products').insert({
    brand_id: brandId[p.brand],
    name: p.name,
    description: p.description ?? null,
    wholesale_price: p.w ?? null,
    retail_price: p.r ?? null,
    search_keywords: p.keywords ?? null,
    note: p.note ?? null,
    sort_order: i + 1,
  }).select().single()

  if (error) { console.error(`[${i + 1}] ${p.name} 실패:`, error.message); fail++; continue }

  if (p.variants?.length) {
    const rows = p.variants.map(([label, w, r], j) => ({
      product_id: prod.id,
      label,
      wholesale_price: w,
      retail_price: r,
      sort_order: j + 1,
    }))
    const { error: vErr } = await sb.from('product_variants').insert(rows)
    if (vErr) { console.error(`[${i + 1}] ${p.name} variants 실패:`, vErr.message); fail++; continue }
  }

  // 사진 업로드 + product_images 등록
  for (const [j, file] of (imagesByIndex[i] ?? []).entries()) {
    const buf = readFileSync(resolve(imagesDir, file))
    const contentType = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
    const path = `products/${prod.id}/${file}`
    const { error: upErr } = await sb.storage.from('product-images')
      .upload(path, buf, { contentType, upsert: true })
    if (upErr) { console.error(`[${i + 1}] ${file} 업로드 실패:`, upErr.message); continue }
    const { error: imgErr } = await sb.from('product_images')
      .insert({ product_id: prod.id, storage_path: path, sort_order: j + 1 })
    if (imgErr) console.error(`[${i + 1}] ${file} 등록 실패:`, imgErr.message)
    else imgCount++
  }
  ok++
}

console.log(`완료: 제품 ${ok}건 성공, ${fail}건 실패, 사진 ${imgCount}장 업로드`)
