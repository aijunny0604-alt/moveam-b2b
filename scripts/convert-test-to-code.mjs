// 테스트 업체 계정 코드 변경: node scripts/convert-test-to-code.mjs [새코드] (기본 0000)
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
const code = process.argv[2] ?? '0000'
const n = code.normalize('NFC').trim().toLowerCase()
const email = `c${hex('id:' + n).slice(0, 24)}@code.moveam.local`
const password = hex('pw:' + n).slice(0, 32)

const { data: prof } = await sb.from('profiles').select('id').eq('company_name', '테스트업체').single()
if (!prof) { console.error('테스트업체 계정 없음'); process.exit(1) }

const { error } = await sb.auth.admin.updateUserById(prof.id, { email, password, email_confirm: true })
if (error) { console.error('전환 실패:', error.message); process.exit(1) }
await sb.from('profiles').update({ login_id: code }).eq('id', prof.id)
console.log(`전환 완료 — 테스트업체 코드: 「${code}」`)
