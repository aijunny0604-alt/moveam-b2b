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

## Edge Function 배포 (계정 관리 API)

```bash
$env:SUPABASE_ACCESS_TOKEN='<PAT>'
npx supabase functions deploy admin-accounts --project-ref xzphfatkwkhgerellybf --use-api
```
`src/lib/code.js`의 코드 파생 로직을 바꿨다면 **반드시 함수도 같이 배포** (동일 로직 유지).

## 트러블슈팅: Pages 빌드가 "building"에서 멈출 때

증상: gh-pages 푸시 후 수십 분째 이전 번들 서빙. 대응:
1. `gh api -X POST repos/aijunny0604-alt/moveam-b2b/pages/builds` (강제 재빌드)
2. 그래도 안 되면 `dist/version.txt`에 타임스탬프 넣고 `npx gh-pages -d dist` 재배포 (새 커밋으로 재트리거)
3. 확인: `curl -s https://aijunny0604-alt.github.io/moveam-b2b/ | grep -o "index-[A-Za-z0-9_-]*\.js"` 가 dist의 번들명과 일치할 때까지

## Current Rules

- **변경 모아서 1회 배포.** 실사용 중 잦은 재배포 → 청크 404 흰화면 사고 이력 (2026-06-04).
- 배포 후 폰에서 실제 로그인·열람 1회 확인.
- 초기 데이터 임포트나 RLS 변경은 배포와 별개로 Supabase에서 선반영·검증.
- DB 마이그레이션(`scripts/db-run.mjs`)은 코드 배포 **전에** 적용 (구 스키마에 신 코드 금지).

## Related Docs

- [QUICK_REF.md](QUICK_REF.md), [TEST.md](TEST.md)
