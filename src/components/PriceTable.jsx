import { useState } from 'react'
import { won } from '../lib/format'

// 옵션(사이즈/색상)형 제품: 스토어 스타일 선택 UI + 접이식 전체 단가표
// onAdd(variant|null) — 장바구니 담기 콜백 (variant 없는 제품은 null)
export default function PriceTable({ product, onAdd }) {
  const variants = [...(product.product_variants ?? [])].sort((a, z) => a.sort_order - z.sort_order)
  const [sel, setSel] = useState(0)
  const [showAll, setShowAll] = useState(variants.length > 1 && variants.length <= 8)

  if (variants.length === 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 fade-up">
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">도매 단가</p>
            <p className="font-bold text-xl text-brand">{won(product.wholesale_price)}</p>
          </div>
          <div className="bg-neutral-50 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">소매 단가</p>
            <p className="font-bold text-xl text-neutral-700">{won(product.retail_price)}</p>
          </div>
        </div>
        {onAdd && (
          <button onClick={() => onAdd(null)}
            className="w-full bg-neutral-900 text-white rounded-xl py-3 font-bold min-h-[48px] transition-transform active:scale-[0.98]">
            🛒 견적함에 담기
          </button>
        )}
      </div>
    )
  }

  const v = variants[Math.min(sel, variants.length - 1)]

  return (
    <div className="space-y-3">
      {/* 옵션 선택 칩 */}
      <div>
        <p className="text-xs text-neutral-500 mb-1.5">옵션 선택 ({variants.length}개)</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 flex-wrap">
          {variants.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setSel(i)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold min-h-[40px] border transition-all duration-200 ${
                i === sel
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* 선택 옵션 가격 */}
      <div key={v.id} className="grid grid-cols-2 gap-3 fade-up">
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{v.label} · 도매</p>
          <p className="font-bold text-xl text-brand">{won(v.wholesale_price)}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">{v.label} · 소매</p>
          <p className="font-bold text-xl text-neutral-700">{won(v.retail_price)}</p>
        </div>
      </div>

      {onAdd && (
        <button onClick={() => onAdd(v)}
          className="w-full bg-neutral-900 text-white rounded-xl py-3 font-bold min-h-[48px] transition-transform active:scale-[0.98]">
          🛒 「{v.label}」 견적함에 담기
        </button>
      )}

      {/* 전체 단가표 (접이식) */}
      <div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-neutral-500 min-h-[44px] transition-colors hover:text-neutral-800"
        >
          {showAll ? '전체 단가표 접기 ▲' : `전체 단가표 펼치기 ▼`}
        </button>
        {showAll && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 fade-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500">
                  <th className="text-left px-3 py-2 font-medium">옵션</th>
                  <th className="text-right px-3 py-2 font-medium">도매</th>
                  <th className="text-right px-3 py-2 font-medium">소매</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((x, i) => (
                  <tr
                    key={x.id}
                    onClick={() => setSel(i)}
                    className={`border-t border-neutral-100 cursor-pointer transition-colors ${i === sel ? 'bg-orange-50/60' : 'hover:bg-neutral-50'}`}
                  >
                    <td className="px-3 py-2.5">{x.label}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-brand whitespace-nowrap">{won(x.wholesale_price)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-neutral-700 whitespace-nowrap">{won(x.retail_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
