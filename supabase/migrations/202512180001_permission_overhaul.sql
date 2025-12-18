-- 권한/RLS 정비 (강의계획서: authenticated 전원 CRUD, 그 외: admin-only)
-- 적용 전 확인:
-- 1) 이 SQL은 "해당 프로젝트에 class_plans/profiles/... 테이블이 존재"한다는 가정입니다.
-- 2) 운영 적용 전, 기존 정책/트리거/함수 충돌 여부를 반드시 점검하세요.

-- 0) enum 준비
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'user');
  end if;
end $$;

-- 1) 역할 헬퍼 함수
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'::public.user_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'admin'::public.user_role;
$$;

-- 2) 강의계획서: authenticated 전원 CRUD
alter table public.class_plans enable row level security;
alter table public.weekly_plan_items enable row level security;
alter table public.fee_rows enable row level security;

-- 기존(소유자/관리자) 정책 제거
drop policy if exists "class_plans_select_owner_or_admin" on public.class_plans;
drop policy if exists "class_plans_insert_owner_or_admin" on public.class_plans;
drop policy if exists "class_plans_update_owner_or_admin" on public.class_plans;
drop policy if exists "class_plans_delete_owner_or_admin" on public.class_plans;

drop policy if exists "class_plans_all_select" on public.class_plans;
drop policy if exists "class_plans_all_insert" on public.class_plans;
drop policy if exists "class_plans_all_update" on public.class_plans;
drop policy if exists "class_plans_all_delete" on public.class_plans;

create policy "class_plans_all_select"
on public.class_plans
for select
to authenticated
using (true);

create policy "class_plans_all_insert"
on public.class_plans
for insert
to authenticated
with check (true);

create policy "class_plans_all_update"
on public.class_plans
for update
to authenticated
using (true)
with check (true);

create policy "class_plans_all_delete"
on public.class_plans
for delete
to authenticated
using (true);

drop policy if exists "weekly_plan_items_all" on public.weekly_plan_items;
drop policy if exists "weekly_plan_select_owner_or_admin" on public.weekly_plan_items;
drop policy if exists "weekly_plan_insert_owner_or_admin" on public.weekly_plan_items;
drop policy if exists "weekly_plan_update_owner_or_admin" on public.weekly_plan_items;
drop policy if exists "weekly_plan_delete_owner_or_admin" on public.weekly_plan_items;
create policy "weekly_plan_items_all"
on public.weekly_plan_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "fee_rows_all" on public.fee_rows;
drop policy if exists "fee_rows_select_owner_or_admin" on public.fee_rows;
drop policy if exists "fee_rows_insert_owner_or_admin" on public.fee_rows;
drop policy if exists "fee_rows_update_owner_or_admin" on public.fee_rows;
drop policy if exists "fee_rows_delete_owner_or_admin" on public.fee_rows;
create policy "fee_rows_all"
on public.fee_rows
for all
to authenticated
using (true)
with check (true);

-- 3) profiles: 최소 권한(일반유저는 본인 조회/비밀번호변경 플래그 업데이트만, 관리자는 전체)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_self_update_must_change_password_only" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_self_select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_admin_select"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- 일반유저: must_change_password만 변경 가능(기타 컬럼 변경 방지)
create policy "profiles_self_update_must_change_password_only"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and active = (select p.active from public.profiles p where p.id = auth.uid())
  and name = (select p.name from public.profiles p where p.id = auth.uid())
  and phone_last4 = (select p.phone_last4 from public.profiles p where p.id = auth.uid())
);

-- 관리자: profiles 전체 관리
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 4) activity_logs: 관리자만 조회/기록 (일반유저는 권한 없음)
alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_select_self_or_admin" on public.activity_logs;
drop policy if exists "activity_logs_insert_authenticated" on public.activity_logs;
drop policy if exists "activity_logs_admin_select" on public.activity_logs;
drop policy if exists "activity_logs_admin_insert" on public.activity_logs;

create policy "activity_logs_admin_select"
on public.activity_logs
for select
to authenticated
using (public.is_admin());

create policy "activity_logs_admin_insert"
on public.activity_logs
for insert
to authenticated
with check (public.is_admin());

-- 5) templates: admin only (일반유저는 강의계획서 외 접근 금지)
alter table public.templates enable row level security;
alter table public.template_blocks enable row level security;

drop policy if exists "Enable all for authenticated users" on public.templates;
drop policy if exists "Enable all for authenticated users" on public.template_blocks;
drop policy if exists "templates_admin_only" on public.templates;
create policy "templates_admin_only"
on public.templates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "template_blocks_admin_only" on public.template_blocks;
create policy "template_blocks_admin_only"
on public.template_blocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


