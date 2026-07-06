# DEPLOY

## Purpose

빌드/배포 절차와 사고 방지 규칙.

## Current State

미배포. GitHub 저장소·Supabase 프로젝트 생성 전.

## 배포 절차

```bash
# 1. 로컬 확인
npm run dev

# 2. 빌드 (⚠️ --base 플래그 절대 금지 — vite.config.js에 base 설정됨)
npx vite build

# 3. 배포
npx gh-pages -d dist
```

- `vite.config.js`: `base: '/moveam-b2b/'`
- SPA 라우팅: GitHub Pages 404 우회를 위해 `404.html` 복사 트릭 or HashRouter 사용 (초기엔 HashRouter 권장 — 설정 단순)

## 환경 변수

| 변수 | 용도 | 위치 |
|------|------|------|
| VITE_SUPABASE_URL | Supabase 프로젝트 URL | `.env.local` (커밋 금지) |
| VITE_SUPABASE_ANON_KEY | anon 공개 키 | `.env.local` |

anon key는 공개되어도 RLS가 지키는 전제 — 그래서 RLS를 뚫리게 두면 안 된다.

## Current Rules

- **변경 모아서 1회 배포.** 실사용 중 잦은 재배포 → 청크 404 흰화면 사고 이력 (2026-06-04).
- 배포 후 폰에서 실제 로그인·열람 1회 확인.
- 초기 데이터 임포트나 RLS 변경은 배포와 별개로 Supabase에서 선반영·검증.

## Related Docs

- [QUICK_REF.md](QUICK_REF.md), [TEST.md](TEST.md)
