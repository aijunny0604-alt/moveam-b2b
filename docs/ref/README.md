# ref — 참고 자료

## Purpose

외부 자료·원본 데이터 포인터 모음. 코드/문서에 녹이기 애매한 참고 자료는 여기로.

## 자료 목록

| 자료 | 위치 | 비고 |
|------|------|------|
| 번웨이 신규 단가표 (2026-07-02) | `D:\업무\단가표\번웨이\260702 번웨이 신규 단가표.xlsx` | 초기 임포트 원본, 95개 제품 |
| 단가표 폴더 (타 브랜드) | `D:\업무\단가표\` | 브랜드 확장 시 원본 |
| 유사 패턴 프로젝트 | `C:\Users\MOVEAM_PC\pos-calculator-web` | Vite+React+Supabase+gh-pages 동일 스택 |

### 기존 카톡 공유용 구글문서 단가표 (→ 포털로 통합 예정, 2026-07-06 접수)

| 브랜드/자료 | URL | 확인된 내용 |
|------|-----|------|
| 번웨이 (구글독) | https://docs.google.com/document/d/e/2PACX-1vQbwis0GO8q03dNHA6p-G-xD1OOoENk9EP6s0PgjGBXY89ziSnP2yVPFmd4JThokUFLgYSepmL3zyPt/pub | "260702 신형" — 임포트한 엑셀과 동일 버전 |
| JSR 단가표 | https://docs.google.com/document/d/e/2PACX-1vTfbJ0wRV2bW5D-lJ1na9vFLjpjQzofyxh0MF5kcsrhz6KYydBqJRz7IFCvwrAuYhZeUrAHU0DBeCNj/pub | 클램프 반도 17종(규격별) + Y관/h관, 사진 있음 |
| OS지겐 단가표 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRAOwVhIHlxkIT3m25iW3VOQU3HaoYbl6ditEf6kTo7eb3VGHHht5mtBQvGJZroMpia2QbcmrIxZPbq/pubhtml | 44행, 클러치(모델·컬러·도매/소비자가). `pub?output=csv`로 추출 가능 |
| 링롱 타이어 단가표 | https://docs.google.com/spreadsheets/d/e/2PACX-1vS0djYykctxGT9H3ytjTLT4YMsECzXlaoGufKt2A-L5skQgRg0zNp8Y7FOcksmymbK1BDkwD3Md7q4h/pubhtml | 규격별 도매/소매. CSV 추출 가능 |
| JSR CAN 배선 위치 | https://docs.google.com/spreadsheets/d/e/2PACX-1vQnyYA1FLWj3PjkfTIzUk3UU6QXxOAHIh3LgmbWSoLjwKkZOZpiJ-GNqPetVXs8nVGIyqssgfm8-AXi/pubhtml | 참고자료 → 자료실 링크로 |
| 져스트 어플 수동 설치 | https://www.teamxhaust.com/app-download/ | 참고자료 → 자료실 링크로 |

## Current Rules

- 엑셀 원본은 이 저장소에 커밋하지 않는다 (단가는 DB가 원본이 된다. 임포트 후 엑셀은 백업용).
- **`seed/` 폴더는 도매가 포함이라 .gitignore 처리** — 공개 저장소 노출 금지. 로컬(`C:\Users\MOVEAM_PC\moveam-b2b\seed\`)에만 보관, 유실 시 엑셀에서 재추출.
- 제품 사진 107장은 엑셀 임베드에서 추출 (`seed/images/row{엑셀행}_{순번}.jpg`, 1200px 리사이즈, 2026-07-03 육안 검수 완료 — 95개 제품 전부 사진 있음).

## Related Docs

- [../DB.md](../DB.md) — 임포트 규칙
