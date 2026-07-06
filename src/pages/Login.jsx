import { useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/move-logo.png'

// 사장님들 계정은 '업체명@moveam.local' 형태로 발급 — 화면엔 '아이디'로만 노출
export default function Login() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const email = id.includes('@') ? id : `${id}@moveam.local`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('아이디 또는 비밀번호가 올바르지 않습니다.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-100">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="text-center mb-2">
          <img src={logo} alt="Move Motors Automotive" className="h-12 mx-auto" />
          <p className="text-sm text-neutral-500 mt-3">거래처 전용 제품 단가표</p>
        </div>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="아이디"
          autoCapitalize="none"
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 min-h-[44px]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 min-h-[44px]"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading || !id || !password}
          className="w-full bg-brand text-white rounded-xl py-3 font-bold min-h-[48px] disabled:opacity-40"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
        <p className="text-xs text-neutral-400 text-center">계정 발급은 담당자에게 문의해주세요.</p>
      </form>
    </div>
  )
}
