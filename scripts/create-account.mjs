// 계정 발급 스크립트 (admin API)
// 사용법: node scripts/create-account.mjs <아이디> <비밀번호> <업체명> [admin]
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()

const [id, password, companyName, roleArg] = process.argv.slice(2)
if (!id || !password || !companyName) {
  console.error('사용법: node scripts/create-account.mjs <아이디> <비밀번호> <업체명> [admin]')
  process.exit(1)
}
const email = id.includes('@') ? id : `${id}@moveam.local`
const role = roleArg === 'admin' ? 'admin' : 'vendor'

const sb = createClient(get('SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data, error } = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (error) { console.error('유저 생성 실패:', error.message); process.exit(1) }

const { error: pErr } = await sb.from('profiles').insert({
  id: data.user.id,
  company_name: companyName,
  role,
})
if (pErr) { console.error('프로필 등록 실패:', pErr.message); process.exit(1) }

console.log(`계정 발급 완료: 아이디 ${id} / ${companyName} (${role})`)
