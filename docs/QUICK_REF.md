# QUICK_REF

## Purpose

개발/운영 중 자주 찾는 값과 명령어 한 페이지 모음. 값이 바뀌면 이 문서를 즉시 갱신한다.

## Current State

프로젝트 미생성 — 아래 값들은 세팅하면서 채운다.

## 주소

| 항목 | 값 |
|------|-----|
| 로컬 개발 | `npm run dev` → http://localhost:5173/moveam-b2b/ |
| 배포 URL | https://aijunny0604-alt.github.io/moveam-b2b/ ✅ 라이브 |
| GitHub 저장소 | https://github.com/aijunny0604-alt/moveam-b2b (공개, seed 제외) |
| Supabase 프로젝트 | `xzphfatkwkhgerellybf` (서울, Free) — POS(`jubzppndcclhnvgbvrxr`)와 별개 |

## 계정

| 계정 | 로그인 | 역할 | 비고 |
|------|------|------|------|
| 관리자 | 아이디 `admin` + 비번 ("관리자 로그인" 토글) | admin | 비번 변경은 내 계정 탭 |
| 테스트 업체 | 코드 `0000` | vendor | 시연/검증용 |

업체 발급은 **관리자 화면 → 업체 관리 → [+ 계정 발급]** (업체명+코드). CLI 스크립트 불필요.

## 명령어

```bash
npm run dev                          # 로컬 개발
npx vite build && npx gh-pages -d dist   # 빌드 + 배포 (--base 플래그 금지!)
npm run import-seed                  # 번웨이 시드(제품+옵션+사진) 투입
node scripts/import-brand.mjs seed/xxx.json [이미지폴더]  # 추가 브랜드 임포트
node scripts/db-run.mjs supabase/migrations/00N_x.sql    # 마이그레이션 적용 (pg 직결)
node scripts/attach-jsr-specs.mjs    # JSR 치수 도면 재첨부
npx supabase functions deploy admin-accounts --project-ref xzphfatkwkhgerellybf --use-api  # Edge Function 배포 (SUPABASE_ACCESS_TOKEN 필요)
```

## 목업 모드 (백엔드 없이 화면 확인)

`.env.local`에 `VITE_MOCK=1` → 아무 아이디/비번으로 로그인, 샘플 5제품 표시.
DEV 전용 가드 + dev서버 /@fs 이미지라 **프로덕션 빌드엔 절대 포함 안 됨** (빌드 후 grep으로 검증됨).

## 초기 데이터

- 원본 엑셀: `D:\업무\단가표\번웨이\260702 번웨이 신규 단가표.xlsx`
- 임포트 스크립트: `scripts/import-xlsx.mjs` (예정)

## 문의 연결 (1:1 원앤원)

| 채널 | 값 |
|------|-----|
| 카카오톡 채널 | (채널 URL 기입 필요) |
| 전화 | (대표번호 기입 필요) |

## Current Rules

- 비밀키(.env)는 절대 커밋하지 않는다. anon key만 프론트 사용.

## Related Docs

- [DEPLOY.md](DEPLOY.md), [DB.md](DB.md)
