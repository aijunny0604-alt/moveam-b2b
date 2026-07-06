import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { won } from '../lib/format'

// 단가 변동 대응: 브랜드/검색 범위 → %/정액 일괄 조정 → 미리보기 → 적용 → 이력/되돌리기
const ROUND = {
  none: { label: '반올림 없음', fn: (x) => Math.round(x) },
  r100: { label: '100원 단위', fn: (x) => Math.round(x / 100) * 100 },
  r1000: { label: '1,000원 단위', fn: (x) => Math.round(x / 1000) * 1000 },
}

export default function AdminPricing() {
  const [brands, setBrands] = useState([])
  const [brandId, setBrandId] = useState('all')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState('both') // 'w' | 'r' | 'both'
  const [mode, setMode] = useState('percent') // 'percent' | 'amount'
  const [value, setValue] = useState('')
  const [rounding, setRounding] = useState('r100')
  const [preview, setPreview] = useState(null) // {changes, desc}
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [history, setHistory] = useState([])

  const loadHistory = () =>
    supabase.from('price_adjustments').select('id, description, affected, reverted_at, created_at')
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setHistory(data ?? []))

  useEffect(() => {
    supabase.from('brands').select('*').order('sort_order').then(({ data }) => setBrands(data ?? []))
    loadHistory()
  }, [])

  const calc = (old) => {
    if (old == null) return null
    const v = parseFloat(value)
    if (Number.isNaN(v)) return null
    const raw = mode === 'percent' ? old * (1 + v / 100) : old + v
    const rounded = ROUND[rounding].fn(raw)
    return rounded > 0 ? rounded : null
  }

  const buildPreview = async () => {
    setBusy(true); setMsg(''); setPreview(null)
    let query = supabase.from('products').select('id, name, wholesale_price, retail_price, brand_id, search_keywords, product_variants(id, label, wholesale_price, retail_price)')
    if (brandId !== 'all') query = query.eq('brand_id', parseInt(brandId, 10))
    const { data: prods, error } = await query
    setBusy(false)
    if (error) { setMsg('조회 실패: ' + error.message); return }

    const t = q.trim().toLowerCase()
    const matched = (prods ?? []).filter((p) =>
      !t || [p.name, p.search_keywords].filter(Boolean).join(' ').toLowerCase().includes(t)
    )

    const fields = target === 'both' ? ['w', 'r'] : [target]
    const col = { w: 'wholesale_price', r: 'retail_price' }
    const changes = []
    for (const p of matched) {
      for (const f of fields) {
        const nw = calc(p[col[f]])
        if (nw != null && nw !== p[col[f]]) changes.push({ t: 'p', id: p.id, f, old: p[col[f]], new: nw, name: p.name })
      }
      for (const v of p.product_variants ?? []) {
        for (const f of fields) {
          const nw = calc(v[col[f]])
          if (nw != null && nw !== v[col[f]]) changes.push({ t: 'v', id: v.id, f, old: v[col[f]], new: nw, name: `${p.name} (${v.label})` })
        }
      }
    }

    if (changes.length === 0) { setMsg('변경될 단가가 없습니다. (범위/값 확인)'); return }
    const brandName = brandId === 'all' ? '전체' : brands.find((b) => b.id === parseInt(brandId, 10))?.name
    const desc = `${brandName}${t ? ` "${q.trim()}"` : ''} ${target === 'both' ? '도매+소매' : target === 'w' ? '도매' : '소매'} ${mode === 'percent' ? `${value}%` : `${won(parseFloat(value))}`} (${ROUND[rounding].label})`
    setPreview({ changes, desc })
  }

  const applyChanges = async (changes, useOld = false) => {
    const col = { w: 'wholesale_price', r: 'retail_price' }
    // 같은 행의 w/r 변경을 묶어서 업데이트 (요청 수 절감)
    const byRow = new Map()
    for (const c of changes) {
      const key = `${c.t}:${c.id}`
      if (!byRow.has(key)) byRow.set(key, { t: c.t, id: c.id, patch: {} })
      byRow.get(key).patch[col[c.f]] = useOld ? c.old : c.new
    }
    const rows = [...byRow.values()]
    let fail = 0
    for (let i = 0; i < rows.length; i += 20) {
      const results = await Promise.all(rows.slice(i, i + 20).map((r) =>
        supabase.from(r.t === 'p' ? 'products' : 'product_variants').update(r.patch).eq('id', r.id)
      ))
      fail += results.filter((x) => x.error).length
    }
    return fail
  }

  const apply = async () => {
    if (!preview) return
    if (!confirm(`${preview.changes.length}건의 단가를 변경합니다. 진행할까요?\n${preview.desc}`)) return
    setBusy(true); setMsg('')
    const fail = await applyChanges(preview.changes)
    await supabase.from('price_adjustments').insert({
      description: preview.desc,
      changes: preview.changes,
      affected: preview.changes.length,
    })
    setBusy(false)
    setMsg(fail ? `⚠️ ${fail}건 실패 — 이력 확인 필요` : `✅ ${preview.changes.length}건 적용 완료`)
    setPreview(null)
    loadHistory()
  }

  const revert = async (adj) => {
    if (!confirm(`「${adj.description}」 조정을 되돌립니다.\n이후에 수동으로 고친 단가도 조정 전 값으로 돌아갑니다. 진행할까요?`)) return
    setBusy(true); setMsg('')
    const { data } = await supabase.from('price_adjustments').select('changes').eq('id', adj.id).single()
    const fail = await applyChanges(data.changes, true)
    await supabase.from('price_adjustments').update({ reverted_at: new Date().toISOString() }).eq('id', adj.id)
    setBusy(false)
    setMsg(fail ? `⚠️ 되돌리기 중 ${fail}건 실패` : `↩️ ${data.changes.length}건 되돌림 완료`)
    loadHistory()
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">단가 일괄 조정</h2>

      {/* 조건 */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div>
            <p className="text-xs text-neutral-500 mb-1">브랜드</p>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 min-h-[44px]">
              <option value="all">전체 브랜드</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">제품 필터 (선택)</p>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="예: 머플러" className="w-full border rounded-lg px-3 py-2.5 min-h-[44px]" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">대상</p>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 min-h-[44px]">
              <option value="both">도매 + 소매</option>
              <option value="w">도매만</option>
              <option value="r">소매만</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">반올림</p>
            <select value={rounding} onChange={(e) => setRounding(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 min-h-[44px]">
              {Object.entries(ROUND).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
            <button onClick={() => setMode('percent')} className={`px-4 py-2 rounded-md text-sm font-bold min-h-[40px] ${mode === 'percent' ? 'bg-white shadow' : 'text-neutral-500'}`}>% 조정</button>
            <button onClick={() => setMode('amount')} className={`px-4 py-2 rounded-md text-sm font-bold min-h-[40px] ${mode === 'amount' ? 'bg-white shadow' : 'text-neutral-500'}`}>정액 조정</button>
          </div>
          <div className="flex items-center gap-2">
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal"
              placeholder={mode === 'percent' ? '예: 10 또는 -5' : '예: 5000 또는 -3000'}
              className="w-40 border rounded-lg px-3 py-2.5 min-h-[44px] text-right font-bold" />
            <span className="font-bold text-neutral-600">{mode === 'percent' ? '%' : '원'}</span>
          </div>
          <button onClick={buildPreview} disabled={busy || !value.trim()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold min-h-[44px] disabled:opacity-40">
            {busy ? '계산 중…' : '미리보기'}
          </button>
        </div>
        <p className="text-xs text-neutral-400">인상은 양수(+10), 인하는 음수(-5). 미리보기에서 확인 후 적용됩니다. 가격 없는 항목은 건너뜁니다.</p>
        {msg && <p className="text-sm font-semibold">{msg}</p>}
      </div>

      {/* 미리보기 */}
      {preview && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 fade-up">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="font-bold">{preview.desc} — <span className="text-brand">{preview.changes.length}건</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg border border-neutral-300 min-h-[44px]">취소</button>
              <button onClick={apply} disabled={busy} className="px-5 py-2 rounded-lg bg-brand text-white font-bold min-h-[44px] disabled:opacity-40">
                {busy ? '적용 중…' : '적용하기'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="text-neutral-500">
                  <th className="text-left px-3 py-2 font-medium">제품</th>
                  <th className="text-center px-2 py-2 font-medium">구분</th>
                  <th className="text-right px-3 py-2 font-medium">기존</th>
                  <th className="text-right px-3 py-2 font-medium">변경 후</th>
                </tr>
              </thead>
              <tbody>
                {preview.changes.slice(0, 200).map((c, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="px-3 py-1.5 text-neutral-700">{c.name}</td>
                    <td className="px-2 py-1.5 text-center text-xs">{c.f === 'w' ? '도매' : '소매'}</td>
                    <td className="px-3 py-1.5 text-right text-neutral-400 line-through whitespace-nowrap">{won(c.old)}</td>
                    <td className={`px-3 py-1.5 text-right font-bold whitespace-nowrap ${c.new > c.old ? 'text-brand' : 'text-blue-600'}`}>{won(c.new)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.changes.length > 200 && <p className="text-center text-xs text-neutral-400 py-2">… 외 {preview.changes.length - 200}건</p>}
          </div>
        </div>
      )}

      {/* 이력 */}
      <div className="space-y-2">
        <h3 className="font-bold">조정 이력</h3>
        {history.length === 0 && <p className="text-neutral-400 text-sm">아직 조정 이력이 없습니다.</p>}
        {history.map((h) => (
          <div key={h.id} className={`bg-white rounded-xl p-3 shadow-sm flex items-center justify-between gap-2 flex-wrap ${h.reverted_at ? 'opacity-50' : ''}`}>
            <div>
              <p className="font-semibold text-sm">{h.description} <span className="text-neutral-400 font-normal">· {h.affected}건</span></p>
              <p className="text-xs text-neutral-400">
                {new Date(h.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                {h.reverted_at && ' · ↩️ 되돌려짐'}
              </p>
            </div>
            {!h.reverted_at && (
              <button onClick={() => revert(h)} disabled={busy} className="px-3 py-2 rounded-lg border border-neutral-300 text-xs min-h-[40px]">
                ↩️ 되돌리기
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
