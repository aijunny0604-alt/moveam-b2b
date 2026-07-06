import { INQUIRY } from '../lib/config'

// 제품 상세 하단 고정 문의 버튼 (카톡/전화)
export default function InquiryButtons({ productName }) {
  const hasKakao = Boolean(INQUIRY.kakaoChannelUrl)
  const hasPhone = Boolean(INQUIRY.phone)
  if (!hasKakao && !hasPhone) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-neutral-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
        {hasKakao && (
          <a
            href={INQUIRY.kakaoChannelUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center bg-[#FEE500] text-neutral-900 font-bold rounded-xl py-3 min-h-[48px]"
          >
            카톡 문의
          </a>
        )}
        {hasPhone && (
          <a
            href={`tel:${INQUIRY.phone}`}
            className="flex-1 text-center bg-brand text-white font-bold rounded-xl py-3 min-h-[48px]"
          >
            전화 문의
          </a>
        )}
      </div>
    </div>
  )
}
