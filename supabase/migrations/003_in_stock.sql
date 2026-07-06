-- 003: 재고 여부 (품절 표시용, 기본 재고 있음)
alter table products add column if not exists in_stock boolean not null default true;
