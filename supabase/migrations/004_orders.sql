-- 004: 주문(발주) 시스템 — 업체 주문 신청 → 관리자 수락/거절, 실시간 알림용 publication 포함

create table orders (
  id serial primary key,
  vendor_id uuid not null references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  items jsonb not null,              -- [{productId, variantId, name, label, price, qty}]
  total_wholesale int not null default 0,
  vendor_note text,                  -- 업체 요청사항
  admin_note text,                   -- 수락/거절 메모 (업체에게 보임)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_vendor on orders(vendor_id);
create index idx_orders_status on orders(status);

create trigger trg_orders_updated
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;

-- 업체: 본인 주문 생성/조회
create policy orders_insert_own on orders for insert
  with check (vendor_id = auth.uid() and is_active_user());
create policy orders_select_own on orders for select
  using (vendor_id = auth.uid() or is_admin());
-- 상태 변경은 admin만
create policy orders_admin_update on orders for update
  using (is_admin()) with check (is_admin());

-- 실시간 알림 (관리자: 신규 주문 / 업체: 상태 변경)
alter publication supabase_realtime add table orders;
