import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

// 메인 = 검색 중심 랜딩: 큰 검색창 + 단가표 카테고리 카드. 검색어가 있을 때만 결과 표시.
export default function BrandHome() {
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState(null)
  const [thumbs, setThumbs] = useState({})
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: bs }, { data: prods }] = await Promise.all([
        supabase.from('brands').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products')
          .select('*, product_variants(*), product_images(*)')
          .eq('is_active', true)
          .order('sort_order'),
      ])
      if (cancelled) return
      setBrands(bs ?? [])
      setProducts(prods ?? [])

      const firsts = (prods ?? [])
        .map((p) => {
          const imgs = [...(p.product_images ?? [])].sort((a, z) => a.sort_order - z.sort_order)
          return imgs[0] ? { pid: p.id, path: imgs[0].storage_path } : null
        })
        .filter(Boolean)
      if (firsts.length) {
        const { data: signed } = await supabase.storage
          .from('product-images')
          .createSignedUrls(firsts.map((f) => f.path), 3600)
        if (cancelled || !signed) return
        const map = {}
        signed.forEach((s, i) => { if (s.signedUrl) map[firsts[i].pid] = s.signedUrl })
        setThumbs(map)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const searching = q.trim().length > 0

  const results = useMemo(() => {
    if (!products || !searching) return []
    const t = q.trim().toLowerCase()
    return products.filter((p) =>
      [p.name, p.description, p.search_keywords].filter(Boolean).join(' ').toLowerCase().includes(t)
    )
  }, [products, q, searching])

  const countOf = (id) => (products ?? []).filter((p) => p.brand_id === id).length

  return (
    <div>
      {/* 검색 히어로 */}
      <div className="text-center pt-6 pb-5">
        <h1 className="font-bold text-xl lg:text-2xl mb-1">단가표 검색</h1>
        <p className="text-sm text-neutral-500 mb-4">제품명·차종·부품으로 빠르게 찾아보세요</p>
        <div className="relative max-w-xl mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 타각킷, 젠쿱, 촉매, 행거"
            className="w-full border-2 border-neutral-300 focus:border-brand rounded-2xl pl-11 pr-10 py-4 text-base bg-white shadow-sm outline-none transition-colors"
            autoFocus
          />
          {searching && (
            <button
              onClick={() => setQ('')}
              aria-label="검색 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!products ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      ) : searching ? (
        /* 검색 결과 */
        <div>
          <p className="text-sm text-neutral-500 mb-2">검색 결과 {results.length}개</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} imageUrl={thumbs[p.id]} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} />
            ))}
          </div>
          {results.length === 0 && (
            <p className="text-neutral-400 text-center py-12">「{q.trim()}」 검색 결과가 없습니다.<br />제품명이나 차종을 다르게 입력해보세요.</p>
          )}
        </div>
      ) : (
        /* 단가표 카테고리 */
        <div>
          <p className="text-sm font-semibold text-neutral-700 mb-2 px-1">단가표 카테고리</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {brands.map((b, i) => (
              <Link
                key={b.id}
                to={`/brand/${b.slug}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className="fade-up group bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand/30 transition-all duration-200 flex items-center justify-between gap-2 min-h-[76px]"
              >
                <div className="min-w-0">
                  <p className="font-bold leading-snug line-clamp-2">{b.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">단가표 {countOf(b.id)}개 제품</p>
                </div>
                <span className="text-neutral-300 group-hover:text-brand text-xl shrink-0 transition-colors">›</span>
              </Link>
            ))}
          </div>
          {brands.length === 0 && (
            <p className="text-neutral-400 text-center py-10">등록된 단가표가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  )
}
