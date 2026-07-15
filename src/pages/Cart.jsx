import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, useCart } from '../App'
import { won } from '../lib/format'

// 견적함: 수량 조절 → 주문 신청(DB) + 발주서 텍스트 복사(카톡용)
export default function Cart() {
  const { items, setQty, clearCart, cartKey } = useCart()
  const { profile, session } = useAuth()
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const priced = items.filter((i) => i.price != null)
  const total = priced.reduce((s, i) => s + i.price * i.qty, 0)

  const orderText = () =>
    [
      '📋 무브모터스 발주서',
      `업체: ${profile?.company_name ?? ''}`,
      `일시: ${new Date().toLocaleString('ko-KR')}`,
      '',
      ...items.map(
        (it, i) =>
          `${i + 1}. ${it.name}${it.label ? ` (${it.label})` : ''}\n   ${it.price != null ? won(it.price) : '단가 문의'} × ${it.qty}${it.price != null ? ` = ${won(it.price * it.qty)}` : ''}`
      ),
      '',
      `합계: ${won(total)} (도매가 기준)`,
      ...(note.trim() ? ['', `요청사항: ${note.trim()}`] : []),
    ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderText())
      setMsg('발주서가 복사됐습니다 — 카톡에 붙여넣어 보내주세요 ✓')
    } catch {
      setMsg('복사 실패 — 길게 눌러 직접 복사해주세요.')
    }
  }

  const submitOrder = async () => {
    setBusy(true)
    setMsg('')
    const { error } = await supabase.from('orders').insert({
      vendor_id: session.user.id,
      items: items.map(({ productId, variantId, name, label, price, qty }) => ({ productId, variantId, name, label, price, qty })),
      total_wholesale: total,
      vendor_note: note.trim() || null,
    })
    setBusy(false)
    if (error) { setMsg('주문 신청 실패: ' + error.message); return }
    clearCart()
    setNote('')
    setMsg('✅ 주문이 접수됐습니다! 무브모터스가 확인 후 수락하면 알림이 옵니다. (주문 내역에서 확인 가능)')
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 fade-up">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-neutral-500 mb-1">장바구니가 비어 있습니다.</p>
        <p className="text-sm text-neutral-400 mb-6">제품 상세에서 「장바구니에 담기」를 눌러보세요.</p>
        {msg && <p className="text-sm bg-white rounded-xl p-4 shadow-sm max-w-md mx-auto mb-4">{msg}</p>}
        <div className="flex gap-2 justify-center">
          <Link to="/" className="px-4 py-3 rounded-xl bg-neutral-900 text-white font-bold min-h-[48px] inline-flex items-center">제품 보러가기</Link>
          <Link to="/orders" className="px-4 py-3 rounded-xl border border-neutral-300 font-bold min-h-[48px] inline-flex items-center">주문 내역</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">장바구니 ({items.length})</h2>
        <div className="flex gap-2">
          <Link to="/orders" className="text-sm text-neutral-500 min-h-[44px] flex items-center">주문 내역 →</Link>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={cartKey(it)} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 fade-up">
            <div className="min-w-0 flex-1">
              <Link to={`/product/${it.productId}`} className="font-semibold text-sm leading-snug line-clamp-1">{it.name}</Link>
              <p className="text-xs text-neutral-500">
                {it.label && <span className="mr-1">{it.label} ·</span>}
                <span className="font-bold text-brand">{it.price != null ? won(it.price) : '단가 문의'}</span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setQty(cartKey(it), it.qty - 1)} className="w-9 h-9 rounded-lg border border-neutral-300 font-bold">−</button>
              <span className="w-8 text-center font-bold">{it.qty}</span>
              <button onClick={() => setQty(cartKey(it), it.qty + 1)} className="w-9 h-9 rounded-lg border border-neutral-300 font-bold">＋</button>
            </div>
            <p className="w-20 text-right font-bold text-sm whitespace-nowrap">{it.price != null ? won(it.price * it.qty) : '-'}</p>
            <button
              onClick={() => setQty(cartKey(it), 0)}
              aria-label="빼기"
              title="장바구니에서 빼기"
              className="w-8 h-8 shrink-0 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-500">합계 (도매가)</span>
          <span className="font-bold text-2xl text-brand">{won(total)}</span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="요청사항 (배송지, 희망 일정 등 — 선택)"
          className="w-full border border-neutral-300 rounded-xl px-4 py-3"
        />
        {msg && <p className="text-sm text-neutral-700">{msg}</p>}
        <button onClick={submitOrder} disabled={busy}
          className="w-full bg-brand text-white rounded-xl py-3.5 font-bold min-h-[52px] text-lg disabled:opacity-40 transition-transform active:scale-[0.99]">
          {busy ? '접수 중…' : '📦 주문 신청하기'}
        </button>
        <div className="flex gap-2">
          <button onClick={copy} className="flex-1 border border-neutral-300 rounded-xl py-3 font-semibold min-h-[48px]">
            발주서 복사 (카톡용)
          </button>
          <button onClick={() => { if (confirm('장바구니를 비울까요?')) clearCart() }} className="px-4 border border-neutral-300 rounded-xl min-h-[48px] text-neutral-500">
            비우기
          </button>
        </div>
      </div>
    </div>
  )
}
