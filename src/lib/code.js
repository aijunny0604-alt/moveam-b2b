// 업체 고유 코드 → Supabase 계정(email/password) 결정적 변환
// 코드 자체가 열쇠다: 코드를 아는 사람만 로그인 가능. 대소문자 구분 없음, 한글/영문/숫자 자유.
// ⚠️ Edge Function(admin-accounts)의 동일 로직과 반드시 일치해야 한다.

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function normalizeCode(code) {
  return code.normalize('NFC').trim().toLowerCase()
}

export async function codeCredentials(code) {
  const n = normalizeCode(code)
  const email = `c${(await sha256hex('id:' + n)).slice(0, 24)}@code.moveam.local`
  const password = (await sha256hex('pw:' + n)).slice(0, 32)
  return { email, password }
}
