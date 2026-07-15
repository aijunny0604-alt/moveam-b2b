-- 006: 업체 주문 취소 — 본인의 '접수 대기(pending)' 주문만 스스로 취소 가능 (이력 보존)

-- 'cancelled' 상태 추가
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled'));

-- 업체: 본인 pending 주문 → cancelled 로만 전환 허용
drop policy if exists orders_cancel_own on orders;
create policy orders_cancel_own on orders for update
  using (vendor_id = auth.uid() and status = 'pending')
  with check (vendor_id = auth.uid() and status = 'cancelled');
