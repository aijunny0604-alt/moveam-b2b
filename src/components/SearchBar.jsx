export default function SearchBar({ value, onChange, placeholder = '제품명 검색 (예: 타각킷, 젠쿱)' }) {
  return (
    <div className="sticky top-14 z-[5] bg-neutral-100 py-2 -mx-4 px-4">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-300 rounded-xl px-4 py-3 min-h-[44px] bg-white"
      />
    </div>
  )
}
