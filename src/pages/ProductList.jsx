import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
  const { slug } = useParams()
  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState(null)
  const [thumbs, setThumbs] = useState({}) // product_id -> signed url
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: b } = await supabase.from('brands').select('*').eq('slug', slug).single()
      if (cancelled || !b) return
      setBrand(b)
      const { data: prods } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*)')
        .eq('brand_id', b.id)
        .eq('is_active', true)
        .order('sort_order')
      if (cancelled) return
      setProducts(prods ?? [])

      // 대표 이미지(첫 장)만 서명 URL 발급
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
  }, [slug])

  const filtered = useMemo(() => {
    if (!products) return null
    const t = q.trim().toLowerCase()
    if (!t) return products
    return products.filter((p) =>
      [p.name, p.description, p.search_keywords].filter(Boolean).join(' ').toLowerCase().includes(t)
    )
  }, [products, q])

  if (!products) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/" className="text-neutral-400 text-sm">브랜드</Link>
        <span className="text-neutral-300">/</span>
        <h2 className="font-bold text-lg">{brand?.name}</h2>
        <span className="text-sm text-neutral-500">{filtered.length}개</span>
      </div>
      <SearchBar value={q} onChange={setQ} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
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
