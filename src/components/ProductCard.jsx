import { Link } from 'react-router-dom'
import { won, priceSummary } from '../lib/format'

export default function ProductCard({ product, imageUrl }) {
  const { wholesale, retail, hasOptions } = priceSummary(product)
  return (
    <Link
      to={`/product/${product.id}`}
      className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition"
    >
      <div className="w-24 h-24 shrink-0 rounded-xl bg-neutral-200 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-neutral-400 text-xs">사진 없음</span>
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
        {hasOptions && (
          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
            옵션별 단가
          </span>
        )}
      </div>
    </Link>
  )
}
