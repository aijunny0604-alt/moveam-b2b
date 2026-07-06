import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BrandHome() {
  const [brands, setBrands] = useState(null)

  useEffect(() => {
    supabase
      .from('brands')
      .select('*, products(count)')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setBrands(data ?? []))
  }, [])

  if (!brands) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg">브랜드</h2>
      {brands.map((b) => (
        <Link
          key={b.id}
          to={`/brand/${b.slug}`}
          className="block bg-white rounded-2xl p-5 shadow-sm active:scale-[0.99] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{b.name}</p>
              <p className="text-sm text-neutral-500">{b.products?.[0]?.count ?? 0}개 제품</p>
            </div>
            <span className="text-brand font-bold">→</span>
          </div>
        </Link>
      ))}
      {brands.length === 0 && <p className="text-neutral-400 text-center py-10">등록된 브랜드가 없습니다.</p>}
    </div>
  )
}
