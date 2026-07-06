# CLAUDE.md — moveam-b2b

## Purpose

B2B 제품 단가 포털. 업체 사장님 열람용 + 관리자 단가 관리용. AI 코딩 도구(Claude Code)로 개발한다.

## Current State

- 2026-07-03: Phase 1 코드 작성 + 빌드 검증 완료. Supabase 프로젝트/GitHub 저장소 생성 대기.
- 초기 데이터: 엑셀 95개 제품 → `seed/burnway-260702.json` 정제 완료 (`npm run import-seed`로 투입)

## Current Rules

- **스택 고정**: Vite + React + Tailwind CSS v3 + Supabase. 다른 프레임워크 제안 금지.
- **배포**: GitHub Pages. `vite.config.js`에 `base: '/moveam-b2b/'` 설정. **빌드 시 `--base` 플래그 절대 금지.**
- **배포 명령**: `npx vite build && npx gh-pages -d dist`
- **도매 단가는 절대 비로그인 노출 금지.** RLS로 서버단에서 막고, 프론트는 보조일 뿐.
- 모바일 우선(사장님들은 폰으로 봄). 최소 터치 영역 44px.
- 잦은 재배포 금지 — 변경 모아서 1회 배포 (청크 404 흰화면 사고 이력 있음).
- 파일 구조: `src/pages/`, `src/components/`, `src/lib/` 분리. 단일 거대 파일 금지.
- 한국어 UI.

## 개발 시 참조 순서

1. [docs/QUICK_REF.md](docs/QUICK_REF.md) — 자주 쓰는 명령/값
2. [docs/DB.md](docs/DB.md) — 스키마 (테이블 변경 전 반드시 전체 읽기)
3. [docs/AUTH.md](docs/AUTH.md) — 계정/권한 규칙
4. [docs/DESIGN.md](docs/DESIGN.md) — 화면/컴포넌트 규칙

## Related Docs

- [docs/INDEX.md](docs/INDEX.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
