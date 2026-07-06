import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { won } from '../lib/format'

const STATUS = {
  pending: { label: '접수 대기', cls: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: '✅ 수락됨', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '거절됨', cls: 'bg-red-100 text-red-700' },
}

// 업체용 주문 내역
export default function Orders() {
  const [orders, setOrders] = useState(null)

  const load = () =>
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))

  useEffect(() => {
    load()
    const ch = supabase
      .channel('orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  if (!orders) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <h2 className="font-bold text-lg">주문 내역</h2>
      {orders.length === 0 && (
        <div className="text-center py-14 fade-up">
          <p className="text-neutral-500 mb-4">주문 내역이 없습니다.</p>
          <Link to="/" className="px-4 py-3 rounded-xl bg-neutral-900 text-white font-bold min-h-[48px] inline-flex items-center">제품 보러가기</Link>
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-500">
              #{o.id} · {new Date(o.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS[o.status]?.cls}`}>
              {STATUS[o.status]?.label ?? o.status}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {o.items.map((it, i) => (
              <p key={i} className="flex justify-between gap-2">
                <span className="text-neutral-700 line-clamp-1">
                  {it.name}{it.label ? ` (${it.label})` : ''} × {it.qty}
                </span>
                <span className="font-semibold whitespace-nowrap">{it.price != null ? won(it.price * it.qty) : '문의'}</span>
              </p>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-100">
            <span className="text-neutral-500 text-sm">합계</span>
            <span className="font-bold text-brand">{won(o.total_wholesale)}</span>
          </div>
          {o.vendor_note && <p className="text-xs text-neutral-500 mt-2">요청사항: {o.vendor_note}</p>}
          {o.admin_note && (
            <p className="text-xs bg-neutral-50 rounded-lg p-2 mt-2">
              <span className="font-semibold">무브모터스:</span> {o.admin_note}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
