import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { won } from '../lib/format'
import AdminPricing from './AdminPricing'
import ProductEditor from '../components/ProductEditor'

// 관리자: 제품 CRUD + 사진 업로드. 업체 계정 발급은 Supabase 대시보드에서 (Phase 2에서 UI 예정)

function AdminProducts() {
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState(null)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', brand_id: '', wholesale_price: '', retail_price: '' })

  const load = async () => {
    const [{ data: bs }, { data: ps }] = await Promise.all([
      supabase.from('brands').select('*').order('sort_order'),
      supabase.from('products').select('*, product_variants(*), product_images(*)').order('sort_order'),
    ])
    setBrands(bs ?? [])
    setProducts(ps ?? [])
    if (bs?.length && !newForm.brand_id) setNewForm((f) => ({ ...f, brand_id: bs[0].id }))
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!products) return null
    const t = q.trim().toLowerCase()
    if (!t) return products
    return products.filter((p) =>
      [p.name, p.description, p.search_keywords].filter(Boolean).join(' ').toLowerCase().includes(t)
    )
  }, [products, q])

  const addProduct = async () => {
    const { error } = await supabase.from('products').insert({
      name: newForm.name,
      brand_id: newForm.brand_id,
      wholesale_price: newForm.wholesale_price ? parseInt(newForm.wholesale_price, 10) : null,
      retail_price: newForm.retail_price ? parseInt(newForm.retail_price, 10) : null,
      sort_order: (products?.length ?? 0) + 1,
    })
    if (error) { alert('추가 실패: ' + error.message); return }
    setAdding(false)
    setNewForm({ ...newForm, name: '', wholesale_price: '', retail_price: '' })
    load()
  }

  if (!filtered) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">제품 관리 ({products.length})</h2>
        <button onClick={() => setAdding(!adding)} className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-bold min-h-[44px]">
          + 제품 추가
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <input className="w-full border rounded-lg px-3 py-2" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="제품명" />
          <div className="grid grid-cols-3 gap-2">
            <select className="border rounded-lg px-2 py-2" value={newForm.brand_id} onChange={(e) => setNewForm({ ...newForm, brand_id: parseInt(e.target.value, 10) })}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input className="border rounded-lg px-3 py-2" inputMode="numeric" value={newForm.wholesale_price} onChange={(e) => setNewForm({ ...newForm, wholesale_price: e.target.value })} placeholder="도매" />
            <input className="border rounded-lg px-3 py-2" inputMode="numeric" value={newForm.retail_price} onChange={(e) => setNewForm({ ...newForm, retail_price: e.target.value })} placeholder="소매" />
          </div>
          <button onClick={addProduct} disabled={!newForm.name} className="w-full bg-neutral-900 text-white rounded-xl py-2.5 font-bold min-h-[44px] disabled:opacity-40">등록</button>
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="제품 검색"
        className="w-full border border-neutral-300 rounded-xl px-4 py-3 min-h-[44px] bg-white"
      />

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className={`bg-white rounded-xl p-3 shadow-sm ${!p.is_active ? 'opacity-50' : ''}`}>
            <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="w-full text-left min-h-[44px]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug line-clamp-1">
                    {!p.is_active && <span className="text-red-500 mr-1">[숨김]</span>}
                    {!p.in_stock && <span className="text-orange-500 mr-1">[품절]</span>}
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {p.product_variants?.length
                      ? `옵션 ${p.product_variants.length}개`
                      : `도매 ${won(p.wholesale_price)} / 소매 ${won(p.retail_price)}`}
                    {p.note && <span className="text-yellow-600 ml-1">📌</span>}
                  </p>
                </div>
                <span className="text-neutral-300">{openId === p.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {openId === p.id && (
              <div className="mt-2">
                <ProductEditor product={p} brands={brands} onSaved={load} onClose={() => setOpenId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

// ── 업체(고객) 관리 ─────────────────────────────

function VendorManager() {
  const [vendors, setVendors] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ code: '', companyName: '', memo: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('company_name')
    setVendors(data ?? [])
  }
  useEffect(() => { load() }, [])

  const callFn = async (body) => {
    setBusy(true); setMsg('')
    const { data, error } = await supabase.functions.invoke('admin-accounts', { body })
    setBusy(false)
    if (error || data?.error) { setMsg('실패: ' + (data?.error ?? error.message)); return false }
    return true
  }

  const create = async () => {
    if (!(await callFn({ action: 'create-code', ...form }))) return
    setMsg(`발급 완료 — 업체에 전달할 코드: 「${form.code.trim()}」`)
    setForm({ code: '', companyName: '', memo: '' })
    setAdding(false)
    load()
  }

  const changeCode = async (v) => {
    const newCode = prompt(`[${v.company_name}] 새 코드 입력 (한글/영문/숫자 자유):`, v.login_id ?? '')
    if (!newCode?.trim()) return
    if (await callFn({ action: 'change-code', userId: v.id, newCode })) {
      setMsg(`${v.company_name} 코드 변경 완료: 「${newCode.trim()}」`)
      load()
    }
  }

  const resetPassword = async (v) => {
    const pw = prompt(`[${v.company_name}] 새 비밀번호 입력 (8자 이상):`)
    if (!pw) return
    if (await callFn({ action: 'reset-password', userId: v.id, password: pw })) {
      setMsg(`${v.company_name} 비밀번호 변경 완료: ${pw}`)
    }
  }

  const toggleActive = async (v) => {
    await supabase.from('profiles').update({ is_active: !v.is_active }).eq('id', v.id)
    load()
  }

  const saveInfo = async (v) => {
    const name = prompt('업체명 수정:', v.company_name)
    if (name === null) return
    const memo = prompt('메모 수정 (연락처, 담당자 등):', v.memo ?? '')
    if (memo === null) return
    await supabase.from('profiles').update({ company_name: name, memo: memo || null }).eq('id', v.id)
    load()
  }

  if (!vendors) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">업체 관리 ({vendors.length})</h2>
        <button onClick={() => setAdding(!adding)} className="px-3 py-2 rounded-lg bg-brand text-white text-sm font-bold min-h-[44px]">
          + 계정 발급
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-2 fade-up">
          <input className="w-full border rounded-lg px-3 py-2" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="업체명" />
          <input className="w-full border rounded-lg px-3 py-2" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="고유 코드 (한글/영문/숫자 자유 — 예: 태욱모터스77)" autoCapitalize="none" />
          <input className="w-full border rounded-lg px-3 py-2" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="메모 (연락처, 담당자 등 — 선택)" />
          <p className="text-xs text-neutral-400">업체는 이 코드 하나만 입력하면 입장합니다. 대소문자는 구분하지 않습니다.</p>
          <button onClick={create} disabled={busy || !form.code.trim() || !form.companyName}
            className="w-full bg-neutral-900 text-white rounded-xl py-2.5 font-bold min-h-[44px] disabled:opacity-40">
            {busy ? '처리 중…' : '코드 발급'}
          </button>
        </div>
      )}

      {msg && <p className="text-sm bg-white rounded-xl p-3 shadow-sm text-neutral-700">{msg}</p>}

      <div className="space-y-2">
        {vendors.map((v) => (
          <div key={v.id} className={`bg-white rounded-xl p-3 shadow-sm ${!v.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-sm">
                  {v.company_name}
                  {v.role === 'admin' && <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-neutral-900 text-white">관리자</span>}
                  {!v.is_active && <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">차단됨</span>}
                </p>
                <p className="text-xs text-neutral-500">{v.role === 'admin' ? '아이디' : '코드'}: {v.login_id ?? '-'}{v.memo ? ` · ${v.memo}` : ''}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => saveInfo(v)} className="px-2.5 py-2 rounded-lg border border-neutral-300 text-xs min-h-[40px]">정보수정</button>
                {v.role === 'admin' ? (
                  <button onClick={() => resetPassword(v)} disabled={busy} className="px-2.5 py-2 rounded-lg border border-neutral-300 text-xs min-h-[40px]">비번재발급</button>
                ) : (
                  <button onClick={() => changeCode(v)} disabled={busy} className="px-2.5 py-2 rounded-lg border border-neutral-300 text-xs min-h-[40px]">코드변경</button>
                )}
                {v.role !== 'admin' && (
                  <button onClick={() => toggleActive(v)} className={`px-2.5 py-2 rounded-lg text-xs min-h-[40px] ${v.is_active ? 'border border-red-300 text-red-600' : 'bg-neutral-900 text-white'}`}>
                    {v.is_active ? '차단' : '해제'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 주문 관리 ───────────────────────────────────

const ORDER_STATUS = {
  pending: { label: '접수 대기', cls: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: '수락됨', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '거절됨', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: '취소됨', cls: 'bg-neutral-200 text-neutral-600' },
}

function OrderManager() {
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('pending')

  const load = () =>
    supabase.from('orders').select('*, profiles(company_name, login_id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))

  useEffect(() => {
    load()
    const ch = supabase.channel('admin-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const act = async (o, status) => {
    const admin_note = prompt(status === 'accepted' ? '수락 메모 (업체에게 보임, 생략 가능):' : '거절 사유 (업체에게 보임):', '')
    if (admin_note === null) return
    const { error } = await supabase.from('orders').update({ status, admin_note: admin_note || null }).eq('id', o.id)
    if (error) alert('처리 실패: ' + error.message)
    load()
  }

  if (!orders) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>
  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-bold text-lg">주문 관리 {pendingCount > 0 && <span className="text-brand">({pendingCount}건 대기)</span>}</h2>
        <div className="flex gap-1">
          {['pending', 'accepted', 'rejected', 'cancelled', 'all'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold min-h-[40px] ${filter === f ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}>
              {f === 'all' ? '전체' : ORDER_STATUS[f].label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="text-neutral-400 text-center py-10">해당 주문이 없습니다.</p>}
      {shown.map((o) => (
        <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm fade-up">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
            <p className="font-bold">
              {o.profiles?.company_name ?? '?'}
              <span className="text-xs text-neutral-400 font-normal ml-2">#{o.id} · {new Date(o.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ORDER_STATUS[o.status]?.cls}`}>{ORDER_STATUS[o.status]?.label}</span>
          </div>
          <div className="space-y-1 text-sm mb-2">
            {o.items.map((it, i) => (
              <p key={i} className="flex justify-between gap-2">
                <span className="text-neutral-700">{it.name}{it.label ? ` (${it.label})` : ''} × {it.qty}</span>
                <span className="font-semibold whitespace-nowrap">{it.price != null ? won(it.price * it.qty) : '문의'}</span>
              </p>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
            <span className="font-bold text-brand">{won(o.total_wholesale)}</span>
            {o.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => act(o, 'accepted')} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold min-h-[44px]">수락</button>
                <button onClick={() => act(o, 'rejected')} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-bold min-h-[44px]">거절</button>
              </div>
            )}
          </div>
          {o.vendor_note && <p className="text-xs text-neutral-500 mt-2">업체 요청사항: {o.vendor_note}</p>}
          {o.admin_note && <p className="text-xs text-neutral-400 mt-1">내 메모: {o.admin_note}</p>}
        </div>
      ))}
    </div>
  )
}

// ── 내 계정 (비밀번호 변경) ──────────────────────

function MyAccount() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const change = async () => {
    if (pw !== pw2) { setMsg('비밀번호가 서로 다릅니다.'); return }
    setBusy(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) { setMsg('실패: ' + error.message); return }
    setMsg('비밀번호 변경 완료!')
    setPw(''); setPw2('')
  }

  return (
    <div className="max-w-sm space-y-3">
      <h2 className="font-bold text-lg">내 비밀번호 변경</h2>
      <input type="password" className="w-full border rounded-xl px-4 py-3 min-h-[44px]" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" />
      <input type="password" className="w-full border rounded-xl px-4 py-3 min-h-[44px]" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="새 비밀번호 확인" />
      {msg && <p className="text-sm text-neutral-700">{msg}</p>}
      <button onClick={change} disabled={busy || pw.length < 8}
        className="w-full bg-brand text-white rounded-xl py-3 font-bold min-h-[48px] disabled:opacity-40">
        {busy ? '변경 중…' : '비밀번호 변경'}
      </button>
    </div>
  )
}

// ── 탭 셸 ───────────────────────────────────────

const TABS = [
  { key: 'orders', label: '주문' },
  { key: 'products', label: '제품 관리' },
  { key: 'pricing', label: '단가 조정' },
  { key: 'vendors', label: '업체 관리' },
  { key: 'account', label: '내 계정' },
]

export default function Admin() {
  const [tab, setTab] = useState('orders')
  return (
    <div>
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm w-fit overflow-x-auto max-w-full">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] transition-colors ${tab === t.key ? 'bg-neutral-900 text-white' : 'text-neutral-600'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'orders' && <OrderManager />}
      {tab === 'products' && <AdminProducts />}
      {tab === 'pricing' && <AdminPricing />}
      {tab === 'vendors' && <VendorManager />}
      {tab === 'account' && <MyAccount />}
    </div>
  )
}
