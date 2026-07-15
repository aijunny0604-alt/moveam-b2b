import { useState } from 'react'
import { supabase } from '../lib/supabase'

// 제품 인라인 편집기 — 관리자 페이지와 제품 목록(관리자)에서 공용으로 사용

async function resizeImage(file, maxSize = 1200) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
}

export default function ProductEditor({ product, brands, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: product.name,
    description: product.description ?? '',
    search_keywords: product.search_keywords ?? '',
    wholesale_price: product.wholesale_price ?? '',
    retail_price: product.retail_price ?? '',
    public_note: product.public_note ?? '',
    note: product.note ?? '',
    brand_id: product.brand_id,
    is_active: product.is_active,
    in_stock: product.in_stock,
  })
  const [variants, setVariants] = useState(
    [...(product.product_variants ?? [])].sort((a, z) => a.sort_order - z.sort_order)
  )
  const [images, setImages] = useState(
    [...(product.product_images ?? [])].sort((a, z) => a.sort_order - z.sort_order)
  )
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toInt = (v) => (v === '' || v === null ? null : parseInt(v, 10))

  const save = async () => {
    setBusy(true); setMsg('')
    const { error } = await supabase.from('products').update({
      name: form.name,
      description: form.description || null,
      search_keywords: form.search_keywords || null,
      wholesale_price: toInt(form.wholesale_price),
      retail_price: toInt(form.retail_price),
      public_note: form.public_note || null,
      note: form.note || null,
      brand_id: form.brand_id,
      is_active: form.is_active,
      in_stock: form.in_stock,
    }).eq('id', product.id)

    if (!error && variants.length) {
      for (const v of variants) {
        await supabase.from('product_variants').update({
          label: v.label,
          wholesale_price: toInt(v.wholesale_price),
          retail_price: toInt(v.retail_price),
        }).eq('id', v.id)
      }
    }
    setBusy(false)
    if (error) { setMsg('저장 실패: ' + error.message); return }
    setMsg('저장 완료')
    onSaved?.()
  }

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setMsg('')
    const blob = await resizeImage(file)
    const path = `products/${product.id}/${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg' })
    if (upErr) { setBusy(false); setMsg('업로드 실패: ' + upErr.message); return }
    const { data, error } = await supabase.from('product_images')
      .insert({ product_id: product.id, storage_path: path, sort_order: images.length + 1 })
      .select().single()
    setBusy(false)
    if (error) { setMsg('이미지 등록 실패: ' + error.message); return }
    setImages([...images, data])
    setMsg('사진 업로드 완료')
    onSaved?.()
  }

  const removeImage = async (img) => {
    await supabase.storage.from('product-images').remove([img.storage_path])
    await supabase.from('product_images').delete().eq('id', img.id)
    setImages(images.filter((i) => i.id !== img.id))
    onSaved?.()
  }

  return (
    <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200">
      <div className="grid grid-cols-1 gap-2">
        <input className="border rounded-lg px-3 py-2" value={form.name} onChange={set('name')} placeholder="제품명" />
        <textarea className="border rounded-lg px-3 py-2" rows={2} value={form.description} onChange={set('description')} placeholder="설명 (적용 차종 등)" />
        <input className="border rounded-lg px-3 py-2" value={form.search_keywords} onChange={set('search_keywords')} placeholder="검색 키워드 (통용어: 젠쿱, 데후 …)" />
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-lg px-3 py-2" inputMode="numeric" value={form.wholesale_price} onChange={set('wholesale_price')} placeholder="도매 단가(원)" />
          <input className="border rounded-lg px-3 py-2" inputMode="numeric" value={form.retail_price} onChange={set('retail_price')} placeholder="소매 단가(원)" />
        </div>
        <select className="border rounded-lg px-3 py-2" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: parseInt(e.target.value, 10) })}>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <textarea className="border rounded-lg px-3 py-2 border-amber-300 bg-amber-50" rows={2} value={form.public_note} onChange={set('public_note')} placeholder="⚠️ 주의사항/특이사항 (업체에게 보임)" />
        <textarea className="border rounded-lg px-3 py-2" rows={2} value={form.note} onChange={set('note')} placeholder="내부 메모 (업체에겐 안 보임)" />
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm min-h-[44px]">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            판매 중 (끄면 업체 화면에서 숨김)
          </label>
          <label className="flex items-center gap-2 text-sm min-h-[44px]">
            <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
            재고 있음 (끄면 <span className="text-red-600 font-semibold">품절</span> 표시)
          </label>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-semibold">옵션별 단가</p>
          {variants.map((v, i) => (
            <div key={v.id} className="grid grid-cols-3 gap-1">
              <input className="border rounded-lg px-2 py-1.5 text-sm" value={v.label}
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              <input className="border rounded-lg px-2 py-1.5 text-sm" inputMode="numeric" value={v.wholesale_price ?? ''} placeholder="도매"
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, wholesale_price: e.target.value } : x))} />
              <input className="border rounded-lg px-2 py-1.5 text-sm" inputMode="numeric" value={v.retail_price ?? ''} placeholder="소매"
                onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, retail_price: e.target.value } : x))} />
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold mb-1">사진 ({images.length})</p>
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 overflow-hidden">
                {img.storage_path.split('/').pop()}
              </div>
              <button onClick={() => removeImage(img)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none">×</button>
            </div>
          ))}
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 cursor-pointer">
            +
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
        </div>
      </div>

      {msg && <p className="text-sm text-neutral-600">{msg}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="flex-1 bg-neutral-900 text-white rounded-xl py-2.5 font-bold min-h-[44px] disabled:opacity-40">
          {busy ? '처리 중…' : '저장'}
        </button>
        <button onClick={onClose} className="px-4 rounded-xl border border-neutral-300 min-h-[44px]">닫기</button>
      </div>
    </div>
  )
}
