import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import SearchBar from '../components/SearchBar'
import ProductCard from '../components/ProductCard'
import ProductEditor from '../components/ProductEditor'

export default function ProductList() {
  const { slug } = useParams()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [brand, setBrand] = useState(null)
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState(null)
  const [thumbs, setThumbs] = useState({}) // product_id -> signed url
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState(null)

  // isStale: 브랜드를 빠르게 옮겨다닐 때 늦게 온 이전 브랜드 응답이 화면을 덮어쓰지 않도록 하는 가드.
  // 없으면 헤더는 HKS인데 목록은 BurnWay 단가가 뜰 수 있다.
  const load = async (isStale = () => false) => {
    const { data: b } = await supabase.from('brands').select('*').eq('slug', slug).single()
    if (isStale() || !b) return
    setBrand(b)
    let query = supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('brand_id', b.id)
      .order('sort_order')
    if (!isAdmin) query = query.eq('is_active', true) // 관리자는 숨김 제품도 관리 가능하도록 모두 표시
    const { data: prods } = await query
    if (isStale()) return
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
      if (isStale() || !signed) return
      const map = {}
      signed.forEach((s, i) => { if (s.signedUrl) map[firsts[i].pid] = s.signedUrl })
      setThumbs(map)
    }
  }

  useEffect(() => {
    let cancelled = false
    load(() => cancelled)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAdmin])

  // 관리자 브랜드 목록(편집기 브랜드 선택용)
  useEffect(() => {
    if (!isAdmin) return
    supabase.from('brands').select('*').order('sort_order').then(({ data }) => setBrands(data ?? []))
  }, [isAdmin])

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
        {isAdmin && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-900 text-white font-semibold">관리자 · 카드에서 바로 수정</span>
        )}
      </div>
      <SearchBar value={q} onChange={setQ} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
        {filtered.map((p, i) =>
          isAdmin && editingId === p.id ? (
            <div key={p.id} className="md:col-span-2 xl:col-span-3">
              <ProductEditor
                product={p}
                brands={brands}
                onSaved={load}
                onClose={() => setEditingId(null)}
              />
            </div>
          ) : (
            <ProductCard
              key={p.id}
              product={p}
              imageUrl={thumbs[p.id]}
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
              isAdmin={isAdmin}
              onEdit={() => setEditingId(p.id)}
            />
          )
        )}
      </div>
      {filtered.length === 0 && (
        <p className="text-neutral-400 text-center py-10">검색 결과가 없습니다.</p>
      )}
    </div>
  )
}
