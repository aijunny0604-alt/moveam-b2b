-- 002: 제품 주의사항(업체 공개) + 로그인 아이디 표시용 컬럼

-- 업체에게 보이는 주의사항/특이사항 (note는 관리자 내부 메모로 유지)
alter table products add column if not exists public_note text;

-- 업체 관리 화면에서 아이디 표시용 (auth.users.email의 @ 앞부분)
alter table profiles add column if not exists login_id text;

-- 기존 계정 백필
update profiles p
set login_id = split_part(u.email, '@', 1)
from auth.users u
where u.id = p.id and p.login_id is null;
