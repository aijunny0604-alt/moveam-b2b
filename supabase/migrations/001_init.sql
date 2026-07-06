-- moveam-b2b 초기 스키마 + RLS + Storage
-- Supabase SQL Editor에 그대로 붙여넣어 실행

-- ── 테이블 ──────────────────────────────────────

create table brands (
  id serial primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table products (
  id serial primary key,
  brand_id int not null references brands(id),
  name text not null,
  description text,
  wholesale_price int,          -- 원 단위 int. float 금지
  retail_price int,
  search_keywords text,         -- 통용어 검색 보조 (젠쿱, 타각킷 등)
  sort_order int not null default 0,
  is_active boolean not null default true,
  note text,                    -- 관리자 전용 메모
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id serial primary key,
  product_id int not null references products(id) on delete cascade,
  label text not null,          -- "15mm", "직관 타입" 등
  wholesale_price int,
  retail_price int,
  sort_order int not null default 0
);

create table product_images (
  id serial primary key,
  product_id int not null references products(id) on delete cascade,
  storage_path text not null,   -- product-images 버킷 내 경로
  sort_order int not null default 0
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  role text not null default 'vendor' check (role in ('admin', 'vendor')),
  is_active boolean not null default true,
  memo text
);

create index idx_products_brand on products(brand_id);
create index idx_variants_product on product_variants(product_id);
create index idx_images_product on product_images(product_id);

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated
  before update on products
  for each row execute function set_updated_at();

-- ── 권한 헬퍼 (security definer로 profiles RLS 재귀 회피) ──

create or replace function is_active_user() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- ── RLS ─────────────────────────────────────────
-- 원칙: 도매가 노출 방지의 최종 방어선. 프론트 숨김은 보안이 아니다.

alter table brands enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table profiles enable row level security;

-- 활성 계정만 열람
create policy brands_select on brands for select using (is_active_user());
create policy products_select on products for select using (is_active_user());
create policy variants_select on product_variants for select using (is_active_user());
create policy images_select on product_images for select using (is_active_user());

-- 쓰기는 admin만
create policy brands_admin on brands for all using (is_admin()) with check (is_admin());
create policy products_admin on products for all using (is_admin()) with check (is_admin());
create policy variants_admin on product_variants for all using (is_admin()) with check (is_admin());
create policy images_admin on product_images for all using (is_admin()) with check (is_admin());

-- profiles: 본인 행 조회 + admin 전체 관리
create policy profiles_select_own on profiles for select using (id = auth.uid());
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());

-- ── Storage: product-images 버킷 ─────────────────

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false);

create policy storage_images_read on storage.objects
  for select using (bucket_id = 'product-images' and is_active_user());

create policy storage_images_write on storage.objects
  for insert with check (bucket_id = 'product-images' and is_admin());

create policy storage_images_update on storage.objects
  for update using (bucket_id = 'product-images' and is_admin());

create policy storage_images_delete on storage.objects
  for delete using (bucket_id = 'product-images' and is_admin());

-- ── 첫 관리자 계정 만들기 (수동 절차 메모) ─────────
-- 1. Supabase 대시보드 > Authentication > Add user (email/password)
-- 2. 아래 실행 (uuid는 생성된 유저 id):
-- insert into profiles (id, company_name, role) values ('<uuid>', '무브엠 관리자', 'admin');
-- 업체 계정도 동일하게 만들고 role은 기본값(vendor) 유지.
-- 이메일 없는 업체는 '업체명@moveam.local' 형태로 발급.
