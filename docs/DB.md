# DB

## Purpose

Supabase Postgres 스키마 설계와 데이터 규칙. 테이블을 만들거나 바꾸기 전에 이 문서 전체를 읽고, 변경 후 반드시 갱신한다.

## Current State

라이브 운영 중 — 프로젝트 `xzphfatkwkhgerellybf`, 마이그레이션 001~004 적용 완료.
데이터: 브랜드 5개(BurnWay/IRP/HKS/EDEL/JSR), 제품 163, 옵션 241, 사진 237장(제품컷+JSR 치수 도면 66).
마이그레이션 적용: `node scripts/db-run.mjs supabase/migrations/00N_xxx.sql` (풀러 직결, pg)

## 테이블 설계

### brands — 브랜드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int PK | |
| name | text | BurnWay, HKS, IRP … |
| slug | text unique | URL용 (burnway) |
| logo_url | text null | 브랜드 로고 |
| sort_order | int | 목록 정렬 |
| is_active | bool | 숨김 처리용 |

### products — 제품

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int PK | |
| brand_id | int FK→brands | |
| name | text | 제품명 (통용어 우선) |
| description | text null | 적용 차종·비고 |
| wholesale_price | int null | 도매 단가 (단일가 제품) |
| retail_price | int null | 소매 단가 (단일가 제품) |
| search_keywords | text null | 검색 보조 (젠쿱, 타각킷 등 통용어) |
| sort_order | int | |
| is_active | bool | 단종/숨김 (업체 화면에서 제외) |
| in_stock | bool | 재고 여부 — false면 품절 표시 (마이그 003) |
| public_note | text null | ⚠️ 주의사항/특이사항 — **업체에게 보임** (마이그 002) |
| note | text null | 내부 메모 (관리자만 표시) |
| created_at / updated_at | timestamptz | |

### product_variants — 옵션/규격별 단가

허브스페이스 15~55mm, 다운파이프 직관/촉매처럼 한 제품에 여러 가격이 있는 경우 사용.
variants가 있으면 products의 단가 컬럼은 비워둔다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int PK | |
| product_id | int FK→products | |
| label | text | "15mm", "직관 타입", "촉매 타입" |
| wholesale_price | int | |
| retail_price | int | |
| sort_order | int | |

### product_images — 제품 사진

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int PK | |
| product_id | int FK→products | |
| storage_path | text | Supabase Storage 경로 |
| sort_order | int | 첫 장이 대표 이미지 |

### profiles — 계정 (업체/관리자)

Supabase `auth.users` 1:1. 상세 규칙은 [AUTH.md](AUTH.md).

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK = auth.users.id | |
| company_name | text | 업체명 |
| login_id | text null | 표시용 코드(업체)/아이디(admin) (마이그 002) |
| role | text | 'admin' \| 'vendor' |
| is_active | bool | 차단 시 false |
| memo | text null | 관리자 메모 |

### orders — 주문 (마이그 004)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial PK | |
| vendor_id | uuid FK→profiles | 주문 업체 |
| status | text | 'pending' \| 'accepted' \| 'rejected' |
| items | jsonb | [{productId, variantId, name, label, price, qty}] 스냅샷 |
| total_wholesale | int | 도매가 합계 (원) |
| vendor_note | text null | 업체 요청사항 |
| admin_note | text null | 수락/거절 메모 — **업체에게 보임** |
| created_at / updated_at | timestamptz | |

- RLS: 업체는 본인 주문 insert/select만, 상태 변경(update)은 admin만
- **Realtime publication 등록됨** — 관리자(신규 주문)·업체(상태 변경) 실시간 알림용

## RLS 정책 (핵심)

- `brands / products / product_variants / product_images`:
  - SELECT — `authenticated` + `profiles.is_active = true`인 사용자만
  - INSERT/UPDATE/DELETE — `role = 'admin'`만
- `profiles`: 본인 행 SELECT 가능, 전체 관리는 admin만
- Storage 버킷 `product-images`: 읽기는 authenticated, 쓰기는 admin

⚠️ **도매가 노출 방지의 최종 방어선은 RLS다.** 프론트 조건부 렌더링만 믿지 않는다.

## 엑셀 임포트 규칙

- 원본: `D:\업무\단가표\번웨이\260702 번웨이 신규 단가표.xlsx` (95행)
- 단일가 행 → products에 바로
- 한 셀에 여러 가격(허브스페이스·폴리카보네이트·라스트킷 옵션 등) → product_variants로 분리
- 제품명 줄바꿈은 공백으로 합치고, 차종/타입은 description·search_keywords로 분배
- 금액 문자열("770,000", "990,000원")은 숫자로 정규화

## Current Rules

- 금액 컬럼은 **int(원 단위)**. float 금지 (external_orders 22P02 사고 교훈).
- 마이그레이션은 `supabase/migrations/` 에 번호순 SQL로 남긴다.

## Related Docs

- [AUTH.md](AUTH.md), [QUICK_REF.md](QUICK_REF.md)
