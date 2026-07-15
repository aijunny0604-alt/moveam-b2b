import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: b } = await sb.from('brands').select('id').eq('slug', 'jsr').single()
const { data: ps } = await sb
  .from('products')
  .select('id,name,description,wholesale_price,retail_price,note,product_variants(id,label,wholesale_price,retail_price,sort_order)')
  .eq('brand_id', b.id)
  .order('sort_order')

let out = ''
for (const p of ps) {
  out += `\n[#${p.id}] ${p.name}\n`
  if (p.note) out += `   NOTE: ${p.note}\n`
  if (p.wholesale_price != null || p.retail_price != null)
    out += `   단일: 도매 ${p.wholesale_price} / 소매 ${p.retail_price}\n`
  const vs = (p.product_variants || []).sort((a, z) => a.sort_order - z.sort_order)
  for (const v of vs) out += `   - ${v.label}: 도매 ${v.wholesale_price} / 소매 ${v.retail_price}\n`
}
writeFileSync(resolve(__dirname, '../seed/jsr_db_current.txt'), out, 'utf8')
console.log('제품수:', ps.length)
