import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { codeCredentials } from '../lib/code'
import logo from '../assets/move-logo.png'

// 업체: 고유 코드 1개 입력 / 관리자: 아이디+비밀번호
export default function Login() {
  const [mode, setMode] = useState('code') // 'code' | 'admin'
  const [code, setCode] = useState('')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submitCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { email, password } = await codeCredentials(code)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('등록되지 않은 코드입니다. 코드를 다시 확인해주세요.')
  }

  const submitAdmin = async (e) => {
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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 fade-up">
        <div className="text-center mb-5">
          <img src={logo} alt="Move Motors Automotive" className="h-12 mx-auto" />
          <p className="text-sm text-neutral-500 mt-3">거래처 전용 제품 단가표</p>
        </div>

        {mode === 'code' ? (
          <form onSubmit={submitCode} className="space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="업체 코드 입력"
              autoCapitalize="none"
              className="w-full border border-neutral-300 rounded-xl px-4 py-3.5 min-h-[48px] text-center text-lg tracking-wide"
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              disabled={loading || !code.trim()}
              className="w-full bg-brand text-white rounded-xl py-3 font-bold min-h-[48px] disabled:opacity-40 transition-opacity"
            >
              {loading ? '확인 중…' : '입장하기'}
            </button>
            <p className="text-xs text-neutral-400 text-center">코드가 없으신가요? 무브모터스에 문의해주세요.</p>
          </form>
        ) : (
          <form onSubmit={submitAdmin} className="space-y-4">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="관리자 아이디"
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
              className="w-full bg-neutral-900 text-white rounded-xl py-3 font-bold min-h-[48px] disabled:opacity-40"
            >
              {loading ? '로그인 중…' : '관리자 로그인'}
            </button>
          </form>
        )}

        <button
          onClick={() => { setMode(mode === 'code' ? 'admin' : 'code'); setError('') }}
          className="w-full text-xs text-neutral-400 text-center mt-5 min-h-[44px] hover:text-neutral-600 transition-colors"
        >
          {mode === 'code' ? '관리자 로그인' : '← 업체 코드로 입장'}
        </button>
      </div>
    </div>
  )
}
