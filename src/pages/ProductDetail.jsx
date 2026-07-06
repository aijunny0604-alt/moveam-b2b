import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PriceTable from '../components/PriceTable'
import InquiryButtons from '../components/InquiryButtons'
import { useAuth } from '../App'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [product, setProduct] = useState(null)
  const [images, setImages] = useState([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: p } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*), brands(name, slug)')
        .eq('id', id)
        .single()
      if (cancelled || !p) return
      setProduct(p)
      const imgs = [...(p.product_images ?? [])].sort((a, z) => a.sort_order - z.sort_order)
      if (imgs.length) {
        const { data: signed } = await supabase.storage
          .from('product-images')
          .createSignedUrls(imgs.map((i) => i.storage_path), 3600)
        if (!cancelled && signed) setImages(signed.map((s) => s.signedUrl).filter(Boolean))
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (!product) return <p className="text-neutral-400 py-10 text-center">불러오는 중…</p>

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-neutral-500 min-h-[44px] -mb-2">
        ← 목록으로
      </button>

      {/* 사진 */}
      <div className="rounded-2xl overflow-hidden bg-neutral-200 aspect-square flex items-center justify-center">
        {images.length > 0 ? (
          <img src={images[current]} alt={product.name} className="w-full h-full object-contain bg-white" />
        ) : (
          <span className="text-neutral-400">등록된 사진이 없습니다</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${i === current ? 'border-brand' : 'border-transparent'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 정보 */}
      <div>
        <p className="text-xs text-neutral-400 mb-1">{product.brands?.name}</p>
        <h1 className="font-bold text-xl leading-snug">{product.name}</h1>
        {product.description && (
          <p className="text-sm text-neutral-600 mt-2 whitespace-pre-line">{product.description}</p>
        )}
      </div>

      <PriceTable product={product} />

      {profile?.role === 'admin' && product.note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
          <p className="font-semibold text-yellow-800 mb-0.5">내부 메모 (관리자만 표시)</p>
          <p className="text-yellow-900">{product.note}</p>
        </div>
      )}

      <InquiryButtons productName={product.name} />
    </div>
  )
}
