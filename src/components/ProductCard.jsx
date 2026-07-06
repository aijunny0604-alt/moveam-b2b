import { Link } from 'react-router-dom'
import { won, priceSummary } from '../lib/format'

export default function ProductCard({ product, imageUrl }) {
  const { wholesale, retail, hasOptions } = priceSummary(product)
  return (
    <Link
      to={`/product/${product.id}`}
      className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition"
    >
      <div className="relative w-24 h-24 shrink-0 rounded-xl bg-neutral-200 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className={`w-full h-full object-cover ${!product.in_stock ? 'opacity-40 grayscale' : ''}`} loading="lazy" />
        ) : (
          <span className="text-neutral-400 text-xs">사진 없음</span>
        )}
        {!product.in_stock && (
          <span className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-[11px] font-bold text-center py-0.5">품절</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug line-clamp-2">{product.name}</p>
        {product.description && (
          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{product.description}</p>
        )}
        <div className="mt-1.5 text-sm">
          <p>
            <span className="text-neutral-400 mr-1">도매</span>
            <span className="font-bold text-brand">
              {hasOptions && wholesale !== null ? `${won(wholesale)}~` : won(wholesale)}
            </span>
          </p>
          <p>
            <span className="text-neutral-400 mr-1">소매</span>
            <span className="font-semibold text-neutral-700">
              {hasOptions && retail !== null ? `${won(retail)}~` : won(retail)}
            </span>
          </p>
        </div>
        <div className="flex gap-1 mt-1">
          {!product.in_stock && (
            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
              재고 없음
            </span>
          )}
          {hasOptions && (
            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              옵션별 단가
            </span>
          )}
          {product.public_note && (
            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ⚠️ 주의사항
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
