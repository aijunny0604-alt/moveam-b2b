# ROADMAP

## Purpose

단계별 개발 계획. 각 단계는 "배포해서 실제로 쓸 수 있는 상태"를 목표로 끊는다.

## Current State

Phase 0 완료 (2026-07-02). 다음: Phase 1.

## Phase 0 — 기획/문서 ✅

- 인터뷰로 요구사항 확정, 문서 구조 생성

## Phase 1 — MVP (열람 최소 기능)

- [x] Vite + React + Tailwind 프로젝트 세팅 (2026-07-03, 빌드 검증 완료)
- [ ] GitHub 저장소 생성 + 첫 커밋
- [ ] Supabase 프로젝트 생성 (신규, POS와 분리) → `supabase/migrations/001_init.sql` 실행
- [x] 엑셀 95개 제품 정제 시드 (`seed/burnway-260702.json`) + 임포트 스크립트 (`npm run import-seed`)
- [ ] 시드 임포트 실행 (Supabase 생성 후)
- [x] 로그인 / 브랜드 홈 / 제품 목록+검색 / 제품 상세 (코드 완료, 실서버 검증 전)
- [x] 카톡·전화 문의 버튼 (`src/lib/config.js`에 카톡 URL·전화번호 기입 필요)
- [x] 관리자 화면 초안 (제품 수정·사진 업로드·숨김 — Phase 2 앞당겨 구현)
- [ ] 관리자 + 테스트 업체 계정 발급 → 폰 검증 → 배포

### 남은 수동 절차 (사용자 작업)
1. Supabase 신규 프로젝트 생성 → SQL Editor에 `001_init.sql` 실행
2. `.env.example` → `.env.local` 복사 후 URL/키 기입
3. `npm run import-seed` (95개 제품 투입)
4. 대시보드에서 관리자 계정 생성 + profiles에 admin 등록 (001_init.sql 하단 주석 참고)
5. `src/lib/config.js`에 카톡 채널 URL·전화번호 기입

## Phase 2 — 관리자

- [ ] 관리자 페이지: 제품 CRUD, variants 편집, 사진 업로드(리사이즈)
- [ ] 업체 계정 발급/차단 UI
- [ ] 내부 메모(note) 표시

## Phase 3 — 운영 편의

- [ ] 브랜드 추가 (HKS, IRP 등) + 브랜드 관리 UI
- [ ] 엑셀 일괄 업로드(선택) — 대량 단가 개정용
- [ ] 신제품/단가변경 표시 (NEW/변경 뱃지)

## 하지 않기로 한 것

- 결제/주문 기능 — 문의는 카톡·전화로
- 앱스토어 배포 — 웹 링크 공유로 충분
- 업체별 차등 단가 — 필요해지면 AUTH.md 확장 여지 참고

## Related Docs

- [INDEX.md](INDEX.md)
