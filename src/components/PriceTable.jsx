import { won } from '../lib/format'

export default function PriceTable({ product }) {
  const variants = [...(product.product_variants ?? [])].sort((a, z) => a.sort_order - z.sort_order)

  if (variants.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">도매 단가</p>
          <p className="font-bold text-xl text-brand">{won(product.wholesale_price)}</p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">소매 단가</p>
          <p className="font-bold text-xl text-neutral-700">{won(product.retail_price)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 text-neutral-500">
            <th className="text-left px-3 py-2 font-medium">옵션</th>
            <th className="text-right px-3 py-2 font-medium">도매</th>
            <th className="text-right px-3 py-2 font-medium">소매</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.id} className="border-t border-neutral-100">
              <td className="px-3 py-2.5">{v.label}</td>
              <td className="px-3 py-2.5 text-right font-bold text-brand whitespace-nowrap">{won(v.wholesale_price)}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-neutral-700 whitespace-nowrap">{won(v.retail_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
