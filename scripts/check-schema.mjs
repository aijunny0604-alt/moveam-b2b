// 스키마 적용 상태 점검 (테이블 존재 + 버킷 + RLS 차단 확인)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()

const url = get('SUPABASE_URL')
const service = get('SUPABASE_SERVICE_ROLE_KEY')
const anon = get('VITE_SUPABASE_ANON_KEY')

const admin = createClient(url, service)
for (const t of ['brands', 'products', 'product_variants', 'product_images', 'profiles']) {
  const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true })
  console.log(t.padEnd(18), error ? 'ERROR: ' + error.message : `OK (${count}행)`)
}
const { data: buckets } = await admin.storage.listBuckets()
console.log('storage bucket    ', buckets?.some((b) => b.id === 'product-images') ? 'OK (product-images)' : '❌ 버킷 없음')

// RLS: 비로그인(anon)으로 products 조회 → 0행이어야 정상
const anonClient = createClient(url, anon)
const { data: leak } = await anonClient.from('products').select('id').limit(1)
console.log('RLS 비로그인 차단  ', (leak ?? []).length === 0 ? 'OK (0행)' : '❌ 데이터 노출!')
