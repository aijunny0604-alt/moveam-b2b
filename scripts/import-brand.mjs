// 추가 브랜드 시드 임포트 (기존 제품 뒤에 이어붙임)
// 사용법: node scripts/import-brand.mjs seed/jsr-full-260428.json [이미지폴더]
// 제품에 images: ["p02_01.jpeg"] 있으면 이미지폴더에서 업로드
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()

const file = process.argv[2]
if (!file) { console.error('시드 파일 경로를 지정하세요'); process.exit(1) }
const seed = JSON.parse(readFileSync(resolve(__dirname, '..', file), 'utf8'))
const imagesDir = process.argv[3] ? resolve(__dirname, '..', process.argv[3]) : null

const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: brands, error: bErr } = await sb.from('brands').upsert(seed.brands, { onConflict: 'slug' }).select()
if (bErr) { console.error('brands 실패:', bErr); process.exit(1) }
const brandId = Object.fromEntries(brands.map((b) => [b.slug, b.id]))

const { data: maxRow } = await sb.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1)
let sort = (maxRow?.[0]?.sort_order ?? 0) + 1

let ok = 0, imgCount = 0
for (const p of seed.products) {
  const { data: prod, error } = await sb.from('products').insert({
    brand_id: brandId[p.brand],
    name: p.name,
    description: p.description ?? null,
    wholesale_price: p.w ?? null,
    retail_price: p.r ?? null,
    search_keywords: p.keywords ?? null,
    note: p.note ?? null,
    public_note: p.public_note ?? null,
    sort_order: sort++,
  }).select().single()
  if (error) { console.error(`${p.name} 실패:`, error.message); continue }
  if (p.variants?.length) {
    const rows = p.variants.map(([label, w, r], j) => ({
      product_id: prod.id, label, wholesale_price: w, retail_price: r, sort_order: j + 1,
    }))
    const { error: vErr } = await sb.from('product_variants').insert(rows)
    if (vErr) { console.error(`${p.name} variants 실패:`, vErr.message); continue }
  }

  if (imagesDir && p.images?.length) {
    for (const [j, file] of p.images.entries()) {
      const local = resolve(imagesDir, file)
      if (!existsSync(local)) { console.error(`${p.name}: 이미지 없음 ${file}`); continue }
      const buf = readFileSync(local)
      const contentType = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
      const path = `products/${prod.id}/${file}`
      const { error: upErr } = await sb.storage.from('product-images')
        .upload(path, buf, { contentType, upsert: true })
      if (upErr) { console.error(`${p.name}: ${file} 업로드 실패`, upErr.message); continue }
      const { error: imgErr } = await sb.from('product_images')
        .insert({ product_id: prod.id, storage_path: path, sort_order: j + 1 })
      if (imgErr) console.error(`${p.name}: ${file} 등록 실패`, imgErr.message)
      else imgCount++
    }
  }
  ok++
}
console.log(`완료: ${ok}/${seed.products.length}건, 사진 ${imgCount}장`)
