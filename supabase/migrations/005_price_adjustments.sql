-- 005: 단가 일괄 조정 이력 (되돌리기 지원)

create table price_adjustments (
  id serial primary key,
  description text not null,      -- 예: "JSR 전체 도매 +10% (100원 반올림)"
  changes jsonb not null,         -- [{t:'p'|'v', id, f:'w'|'r', old, new, name}]
  affected int not null default 0,
  reverted_at timestamptz,        -- 되돌린 시각 (null = 유효)
  created_at timestamptz not null default now()
);

alter table price_adjustments enable row level security;
create policy pa_admin on price_adjustments for all using (is_admin()) with check (is_admin());
