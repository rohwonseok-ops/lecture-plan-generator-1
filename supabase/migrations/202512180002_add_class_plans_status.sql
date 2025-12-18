-- 강의계획서 단계(status) 저장용 컬럼 추가
-- 허용 값: draft | teacher-reviewed | admin-reviewed

alter table public.class_plans
  add column if not exists status text;

-- 기존 데이터 백필 + 기본값/NOT NULL 설정
update public.class_plans
set status = 'draft'
where status is null;

alter table public.class_plans
  alter column status set default 'draft',
  alter column status set not null;

-- 허용 값 제한 (중복 생성 방지)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'class_plans_status_check'
  ) then
    alter table public.class_plans
      add constraint class_plans_status_check
      check (status in ('draft', 'teacher-reviewed', 'admin-reviewed'));
  end if;
end $$;


