import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'

// 메인 = 전체 제품 브라우저: 전체 검색 + 브랜드 칩 필터
export default function BrandHome() {
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState(null)
  const [thumbs, setThumbs] = useState({})
  const [q, setQ] = useState('')
  const [brandFilter, setBrandFilter] = useState(null) // null = 전체

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

  const filtered = useMemo(() => {
    if (!products) return null
    let rows = products
    if (brandFilter) rows = rows.filter((p) => p.brand_id === brandFilter)
    const t = q.trim().toLowerCase()
    if (t) {
      rows = rows.filter((p) =>
        [p.name, p.description, p.search_keywords].filter(Boolean).join(' ').toLowerCase().includes(t)
      )
    }
    return rows
  }, [products, q, brandFilter])

  if (!filtered) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  const countOf = (id) => products.filter((p) => p.brand_id === id).length

  return (
    <div>
      <SearchBar value={q} onChange={setQ} placeholder="전체 제품 검색 (예: 타각킷, 젠쿱, 허브)" />

      {/* 브랜드 칩 */}
      <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4">
        <button
          onClick={() => setBrandFilter(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${!brandFilter ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
        >
          전체 {products.length}
        </button>
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => setBrandFilter(brandFilter === b.id ? null : b.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${brandFilter === b.id ? 'bg-brand text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
          >
            {b.name} {countOf(b.id)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-1">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} imageUrl={thumbs[p.id]} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-neutral-400 text-center py-10">검색 결과가 없습니다.</p>
      )}
    </div>
  )
}
