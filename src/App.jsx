import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase, isConfigured } from './lib/supabase'
import logo from './assets/move-logo.png'
import Login from './pages/Login'
import BrandHome from './pages/BrandHome'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Admin from './pages/Admin'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// 장바구니 (localStorage 유지)
const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)
const cartKey = (i) => `${i.productId}:${i.variantId ?? 0}`

function Header({ pendingOrders }) {
  const { profile, signOut } = useAuth()
  const { items } = useCart()
  const count = items.reduce((s, i) => s + i.qty, 0)
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-200">
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Move Motors Automotive" className="h-8 lg:h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="relative px-3 py-2 rounded-lg bg-neutral-900 text-white">
              관리자
              {pendingOrders > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center fade-in">
                  {pendingOrders}
                </span>
              )}
            </Link>
          )}
          <Link to="/cart" className="relative px-3 py-2 rounded-lg border border-neutral-300 min-h-[44px] flex items-center transition-colors hover:border-neutral-500" aria-label="견적함">
            🛒
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center fade-in">
                {count}
              </span>
            )}
          </Link>
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
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moveam-cart') ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('moveam-cart', JSON.stringify(items))
  }, [items])

  const addItem = (item) =>
    setItems((prev) => {
      const ex = prev.find((x) => cartKey(x) === cartKey(item))
      return ex
        ? prev.map((x) => (cartKey(x) === cartKey(item) ? { ...x, qty: x.qty + item.qty } : x))
        : [...prev, item]
    })
  const setQty = (key, qty) =>
    setItems((prev) => (qty <= 0 ? prev.filter((x) => cartKey(x) !== key) : prev.map((x) => (cartKey(x) === key ? { ...x, qty } : x))))
  const clearCart = () => setItems([])

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

  // 실시간 알림: 관리자 = 신규 주문 / 업체 = 주문 상태 변경
  const [pendingOrders, setPendingOrders] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!session?.user || !profile?.is_active) return
    const refreshPending = () =>
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        .then(({ count }) => setPendingOrders(count ?? 0))

    let ch
    if (profile.role === 'admin') {
      refreshPending()
      ch = supabase.channel('admin-order-alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
          refreshPending()
          setNotice('🔔 새 주문이 들어왔습니다!')
          setTimeout(() => setNotice(''), 5000)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, refreshPending)
        .subscribe()
    } else {
      ch = supabase.channel('vendor-order-alerts')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `vendor_id=eq.${session.user.id}` }, (p) => {
          if (p.new.status === 'accepted') setNotice('✅ 주문이 수락되었습니다!')
          else if (p.new.status === 'rejected') setNotice('주문이 거절되었습니다 — 주문 내역을 확인해주세요.')
          setTimeout(() => setNotice(''), 6000)
        })
        .subscribe()
    }
    return () => { if (ch) supabase.removeChannel(ch) }
  }, [session?.user?.id, profile?.role, profile?.is_active])

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
      <CartContext.Provider value={{ items, addItem, setQty, clearCart, cartKey }}>
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
            <Header pendingOrders={pendingOrders} />
            {notice && (
              <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-neutral-900 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-xl fade-up">
                {notice}
              </div>
            )}
            <main className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-4 pb-24">
              <Routes>
                <Route path="/" element={<BrandHome />} />
                <Route path="/brand/:slug" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/admin" element={profile?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        )}
      </HashRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  )
}
