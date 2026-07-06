export function won(n) {
  if (n === null || n === undefined) return '-'
  return n.toLocaleString('ko-KR') + '원'
}

// 카드용 대표 가격: 단일가면 그대로, 옵션형이면 최저가 기준
export function priceSummary(product) {
  const variants = product.product_variants ?? []
  if (variants.length === 0) {
    return { wholesale: product.wholesale_price, retail: product.retail_price, hasOptions: false }
  }
  const min = (key) => {
    const vals = variants.map((v) => v[key]).filter((x) => x !== null && x !== undefined)
    return vals.length ? Math.min(...vals) : null
  }
  return { wholesale: min('wholesale_price'), retail: min('retail_price'), hasOptions: true }
}
