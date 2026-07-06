# AUTH

## Purpose

로그인/권한 규칙. 도매 단가 접근 통제가 이 서비스의 핵심 보안 요구사항이다.

## Current State

v0.4 (2026-07-06) 코드 로그인 체계로 개편, 라이브 검증 완료.

## 계정 모델

| 역할 | 로그인 방식 | 할 수 있는 것 |
|------|------------|---------------|
| vendor (업체) | **고유 코드 1개** (한글/영문/숫자 자유, 대소문자 무시) | 제품/단가/사진/도면 열람, 검색, 견적함, 주문 신청, 주문 내역 |
| admin (우리) | 아이디 + 비밀번호 (로그인 화면 하단 "관리자 로그인") | vendor 전부 + 주문 수락/거절, 제품/재고/사진 관리, 업체 코드 발급·변경·차단 |

## 코드 로그인 동작 원리

- 코드를 SHA-256으로 파생시켜 Supabase Auth 계정(email/password)으로 변환:
  - email = `c{sha256("id:"+정규화코드)[:24]}@code.moveam.local`
  - password = `sha256("pw:"+정규화코드)[:32]`
  - 정규화 = NFC + trim + lowercase
- 구현: [src/lib/code.js](../src/lib/code.js) (클라이언트) ↔ `supabase/functions/admin-accounts/index.ts` (발급/변경)
- 🚨 **두 파일의 파생 로직은 반드시 동일하게 유지** — 한쪽만 바꾸면 전 업체 로그인 불가
- 코드 자체가 열쇠: 코드를 아는 사람만 입장. 유출 시 관리자 화면 [코드변경]으로 교체

## 계정 발급/관리 (관리자 화면 → 업체 관리 탭)

- **발급**: 업체명 + 고유 코드 + 메모 → Edge Function `create-code`
- **코드 변경**: [코드변경] 버튼 → `change-code` (email/password 재파생 + login_id 갱신)
- **차단/해제**: profiles.is_active 토글 (RLS로 즉시 열람 불가)
- **admin 비번 변경**: 내 계정 탭 (`supabase.auth.updateUser`)
- 레거시(아이디/비번 발급, admin 비번 재발급)는 Edge Function `create`/`reset-password`로 유지

## Edge Function: admin-accounts

service_role 키가 필요한 작업 전용 (프론트에 절대 노출 금지). 호출자의 JWT로 admin 여부 검증 후 실행.

| action | 용도 |
|--------|------|
| create-code | 코드 계정 발급 |
| change-code | 코드 변경 |
| create | (레거시) 아이디/비번 계정 |
| reset-password | 비밀번호 재발급 (admin 계정용) |

배포: `npx supabase functions deploy admin-accounts --project-ref xzphfatkwkhgerellybf --use-api` (SUPABASE_ACCESS_TOKEN 필요)

## Current Rules

- 도매가는 서버(RLS)에서 차단하는 것이 원칙. 프론트 숨김은 UX일 뿐 보안이 아니다.
- 세션은 Supabase 기본 (localStorage persist).
- profiles.login_id = 표시용 원본 코드(업체) 또는 아이디(admin).

## Related Docs

- [DB.md](DB.md) — profiles/orders 테이블, RLS 정책
