// 관리자 전용 계정 관리 API (service_role은 서버에만 존재)
// actions: create(계정 발급), reset-password(비번 재발급)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 호출자가 활성 admin인지 확인
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: userData, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !userData?.user) return json({ error: '인증 실패' }, 401)
  const { data: prof } = await admin
    .from('profiles').select('role, is_active').eq('id', userData.user.id).single()
  if (!prof || prof.role !== 'admin' || !prof.is_active) return json({ error: '관리자 전용 기능입니다' }, 403)

  const { action, ...p } = await req.json()

  if (action === 'create') {
    if (!p.loginId || !p.password || !p.companyName) return json({ error: '아이디/비밀번호/업체명 필수' }, 400)
    const email = p.loginId.includes('@') ? p.loginId : `${p.loginId}@moveam.local`
    const { data, error } = await admin.auth.admin.createUser({ email, password: p.password, email_confirm: true })
    if (error) return json({ error: error.message }, 400)
    const { error: pErr } = await admin.from('profiles').insert({
      id: data.user.id, company_name: p.companyName, login_id: p.loginId, role: 'vendor', memo: p.memo ?? null,
    })
    if (pErr) return json({ error: pErr.message }, 400)
    return json({ ok: true, userId: data.user.id })
  }

  if (action === 'reset-password') {
    if (!p.userId || !p.password) return json({ error: 'userId/password 필수' }, 400)
    const { error } = await admin.auth.admin.updateUserById(p.userId, { password: p.password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: '알 수 없는 action' }, 400)
})
