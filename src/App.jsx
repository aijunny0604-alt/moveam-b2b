import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase, isConfigured } from './lib/supabase'
import Login from './pages/Login'
import BrandHome from './pages/BrandHome'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Admin from './pages/Admin'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function Header() {
  const { profile, signOut } = useAuth()
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-200">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">
          MOVEAM <span className="text-brand">B2B</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="px-3 py-2 rounded-lg bg-neutral-900 text-white">
              관리자
            </Link>
          )}
          <span className="text-neutral-500 hidden sm:inline">{profile?.company_name}</span>
          <button onClick={signOut} className="px-3 py-2 rounded-lg border border-neutral-300 min-h-[44px]">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = 확인 중
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!isConfigured) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [session])

  const signOut = () => supabase.auth.signOut()

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="font-bold text-lg mb-2">환경 설정 필요</p>
          <p className="text-neutral-600">.env.local에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정하세요.</p>
        </div>
      </div>
    )
  }

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">불러오는 중…</div>
  }

  return (
    <AuthContext.Provider value={{ session, profile, signOut }}>
      <HashRouter>
        {!session ? (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        ) : profile && !profile.is_active ? (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-bold">이용이 중지된 계정입니다.</p>
            <p className="text-neutral-600 text-sm">거래처 담당자에게 문의해주세요.</p>
            <button onClick={signOut} className="px-4 py-2 rounded-lg border border-neutral-300 min-h-[44px]">로그아웃</button>
          </div>
        ) : (
          <>
            <Header />
            <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
              <Routes>
                <Route path="/" element={<BrandHome />} />
                <Route path="/brand/:slug" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/admin" element={profile?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        )}
      </HashRouter>
    </AuthContext.Provider>
  )
}
