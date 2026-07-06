# QUICK_REF

## Purpose

개발/운영 중 자주 찾는 값과 명령어 한 페이지 모음. 값이 바뀌면 이 문서를 즉시 갱신한다.

## Current State

프로젝트 미생성 — 아래 값들은 세팅하면서 채운다.

## 주소

| 항목 | 값 |
|------|-----|
| 로컬 개발 | `npm run dev` → http://localhost:5173 |
| 배포 URL | https://aijunny0604-alt.github.io/moveam-b2b/ (예정) |
| GitHub 저장소 | (생성 후 기입) |
| Supabase 프로젝트 | (생성 후 ref 기입) — ⚠️ 기존 POS Supabase와 별개 프로젝트 권장 |

## 명령어

```bash
npm run dev                          # 로컬 개발
npx vite build && npx gh-pages -d dist   # 빌드 + 배포 (--base 플래그 금지!)
```

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
