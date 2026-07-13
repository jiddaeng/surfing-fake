-- DIMI CLUB 초기 데이터베이스 스키마
-- Supabase Dashboard > SQL Editor > New query 에서 이 파일 전체를 실행하세요.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('student', 'leader', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.question_type as enum ('short', 'long', 'single', 'multiple', 'link');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.application_status as enum ('draft', 'submitted', 'reviewing', 'accepted', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.decision_result as enum ('accepted', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '이름 미설정',
  student_number text,
  role public.user_role not null default 'student',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_settings (
  id text primary key default 'global' check (id = 'global'),
  recruitment_start_at timestamptz not null,
  recruitment_end_at timestamptz not null,
  result_announcement_at timestamptz not null,
  max_applications integer not null default 3 check (max_applications between 1 and 10),
  updated_at timestamptz not null default now(),
  check (recruitment_start_at < recruitment_end_at),
  check (recruitment_end_at <= result_announcement_at)
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  summary text not null default '',
  description text not null default '',
  logo_url text,
  color text not null default '#155eef',
  capacity integer not null default 10 check (capacity > 0),
  leader_id uuid unique references public.profiles(id) on delete set null,
  leader_name text not null default '담당 동아리장',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_questions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  type public.question_type not null,
  label text not null,
  description text,
  required boolean not null default true,
  options jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type in ('single', 'multiple') and jsonb_typeof(options) = 'array')
    or (type not in ('single', 'multiple') and options is null)
  )
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, user_id),
  check ((status = 'draft' and submitted_at is null) or status <> 'draft')
);

-- 합격 결과를 지원서와 분리해야 발표 전 학생의 직접 API 조회도 차단할 수 있습니다.
create table if not exists public.application_decisions (
  application_id uuid primary key references public.applications(id) on delete cascade,
  result public.decision_result not null,
  decided_by uuid not null references public.profiles(id) on delete restrict,
  decided_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  question_id uuid not null references public.application_questions(id) on delete restrict,
  answer jsonb not null,
  updated_at timestamptz not null default now(),
  unique (application_id, question_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (application_id, title)
);

create index if not exists clubs_category_idx on public.clubs(category);
create index if not exists clubs_name_idx on public.clubs(name);
create index if not exists questions_club_order_idx on public.application_questions(club_id, display_order);
create index if not exists applications_user_idx on public.applications(user_id);
create index if not exists applications_club_status_idx on public.applications(club_id, status);
create index if not exists decisions_result_idx on public.application_decisions(result);
create index if not exists answers_application_idx on public.application_answers(application_id);
create index if not exists notifications_user_available_idx on public.notifications(user_id, available_at desc);

insert into public.recruitment_settings (
  id, recruitment_start_at, recruitment_end_at, result_announcement_at, max_applications
)
values ('global', now() - interval '3 days', now() + interval '7 days', now() + interval '12 days', 3)
on conflict (id) do nothing;

-- 권한 확인 함수는 RLS 재귀를 피하기 위해 security definer로 실행합니다.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin' and is_active from public.profiles where id = (select auth.uid())),
    false
  );
$$;

create or replace function public.is_club_leader(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select c.leader_id = (select auth.uid()) and p.role = 'leader' and p.is_active
      from public.clubs c
      join public.profiles p on p.id = c.leader_id
      where c.id = target_club_id
    ),
    false
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_club_leader(uuid) to authenticated;

-- Auth 사용자가 만들어지면 앱에서 사용할 프로필을 자동 생성합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, student_number)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, '학생'), '@', 1)),
    new.raw_user_meta_data ->> 'student_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 스키마 실행 전에 이미 만든 Auth 사용자도 프로필로 가져옵니다.
insert into public.profiles (id, email, name, student_number)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'name', split_part(coalesce(email, '학생'), '@', 1)),
  raw_user_meta_data ->> 'student_number'
from auth.users
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
drop trigger if exists questions_set_updated_at on public.application_questions;
create trigger questions_set_updated_at before update on public.application_questions
  for each row execute function public.set_updated_at();
drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();
drop trigger if exists decisions_set_updated_at on public.application_decisions;
create trigger decisions_set_updated_at before update on public.application_decisions
  for each row execute function public.set_updated_at();
drop trigger if exists answers_set_updated_at on public.application_answers;
create trigger answers_set_updated_at before update on public.application_answers
  for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.recruitment_settings;
create trigger settings_set_updated_at before update on public.recruitment_settings
  for each row execute function public.set_updated_at();

-- UI를 우회하더라도 최대 지원 수, 기간, 제출 후 수정 금지를 DB에서 강제합니다.
create or replace function public.validate_application_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.recruitment_settings%rowtype;
  submitted_count integer;
  actor_role public.user_role;
begin
  select * into settings from public.recruitment_settings where id = 'global';
  select role into actor_role from public.profiles where id = (select auth.uid());

  if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.club_id <> old.club_id) then
    raise exception '지원자와 지원 동아리는 변경할 수 없습니다.';
  end if;

  if actor_role = 'leader' and new.status in ('accepted', 'rejected') then
    raise exception '합격 결과는 application_decisions 테이블에 저장해야 합니다.';
  end if;

  if actor_role = 'student' then
    if tg_op = 'UPDATE' and old.status <> 'draft' then
      raise exception '제출한 지원서는 수정하거나 취소할 수 없습니다.';
    end if;

    if now() < settings.recruitment_start_at or now() > settings.recruitment_end_at then
      raise exception '현재는 동아리 지원 기간이 아닙니다.';
    end if;

    if new.status <> 'draft' and (tg_op = 'INSERT' or old.status = 'draft') then
      select count(*) into submitted_count
      from public.applications
      where user_id = new.user_id and status <> 'draft' and id <> new.id;

      if submitted_count >= settings.max_applications then
        raise exception '동아리는 최대 %개까지 지원할 수 있습니다.', settings.max_applications;
      end if;

      new.submitted_at = coalesce(new.submitted_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_application_before_write on public.applications;
create trigger validate_application_before_write
  before insert or update on public.applications
  for each row execute function public.validate_application_write();

-- 합격/불합격 처리 시 발표 시간에 공개되는 인앱 알림을 자동 생성합니다.
create or replace function public.create_result_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  club_name text;
  announcement_at timestamptz;
begin
  select * into target_application from public.applications where id = new.application_id;
  select name into club_name from public.clubs where id = target_application.club_id;
  select result_announcement_at into announcement_at
    from public.recruitment_settings where id = 'global';

  delete from public.notifications
    where application_id = new.application_id and title = '지원 결과가 발표됐어요';

  insert into public.notifications (
    user_id, application_id, title, message, available_at
  ) values (
    target_application.user_id,
    new.application_id,
    '지원 결과가 발표됐어요',
    club_name || ' 지원 결과를 확인해보세요.',
    announcement_at
  );
  return new;
end;
$$;

drop trigger if exists application_result_notification on public.applications;
drop trigger if exists application_result_notification on public.application_decisions;
create trigger application_result_notification
  after insert or update of result on public.application_decisions
  for each row execute function public.create_result_notification();

alter table public.profiles enable row level security;
alter table public.recruitment_settings enable row level security;
alter table public.clubs enable row level security;
alter table public.application_questions enable row level security;
alter table public.applications enable row level security;
alter table public.application_decisions enable row level security;
alter table public.application_answers enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;

-- 기존 정책이 있을 때도 다시 실행할 수 있도록 정책을 먼저 제거합니다.
drop policy if exists "profiles_select_allowed" on public.profiles;
create policy "profiles_select_allowed" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
  or exists (
    select 1 from public.applications a
    where a.user_id = profiles.id and (select public.is_club_leader(a.club_id))
  )
);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "settings_public_read" on public.recruitment_settings;
create policy "settings_public_read" on public.recruitment_settings for select to anon, authenticated
using (true);
drop policy if exists "settings_admin_update" on public.recruitment_settings;
create policy "settings_admin_update" on public.recruitment_settings for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "clubs_public_read" on public.clubs;
create policy "clubs_public_read" on public.clubs for select to anon, authenticated
using (is_published or leader_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "clubs_leader_insert" on public.clubs;
create policy "clubs_leader_insert" on public.clubs for insert to authenticated
with check (
  leader_id = (select auth.uid())
  and (select public.current_user_role()) = 'leader'
  or (select public.is_admin())
);
drop policy if exists "clubs_owner_update" on public.clubs;
create policy "clubs_owner_update" on public.clubs for update to authenticated
using (leader_id = (select auth.uid()) or (select public.is_admin()))
with check (leader_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "clubs_admin_delete" on public.clubs;
create policy "clubs_admin_delete" on public.clubs for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "questions_read_for_visible_club" on public.application_questions;
create policy "questions_read_for_visible_club" on public.application_questions for select to anon, authenticated
using (exists (select 1 from public.clubs c where c.id = club_id and c.is_published));
drop policy if exists "questions_owner_insert" on public.application_questions;
create policy "questions_owner_insert" on public.application_questions for insert to authenticated
with check ((select public.is_club_leader(club_id)) or (select public.is_admin()));
drop policy if exists "questions_owner_update" on public.application_questions;
create policy "questions_owner_update" on public.application_questions for update to authenticated
using ((select public.is_club_leader(club_id)) or (select public.is_admin()))
with check ((select public.is_club_leader(club_id)) or (select public.is_admin()));
drop policy if exists "questions_owner_delete" on public.application_questions;
create policy "questions_owner_delete" on public.application_questions for delete to authenticated
using ((select public.is_club_leader(club_id)) or (select public.is_admin()));

drop policy if exists "applications_read_allowed" on public.applications;
create policy "applications_read_allowed" on public.applications for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_club_leader(club_id))
  or (select public.is_admin())
);
drop policy if exists "students_create_application" on public.applications;
create policy "students_create_application" on public.applications for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.current_user_role()) = 'student'
  and status in ('draft', 'submitted')
);
drop policy if exists "student_or_leader_update_application" on public.applications;
create policy "student_or_leader_update_application" on public.applications for update to authenticated
using (
  (user_id = (select auth.uid()) and status = 'draft' and (select public.current_user_role()) = 'student')
  or (select public.is_club_leader(club_id))
)
with check (
  user_id = (select auth.uid())
  or (select public.is_club_leader(club_id))
);

drop policy if exists "decisions_read_allowed" on public.application_decisions;
create policy "decisions_read_allowed" on public.application_decisions for select to authenticated
using (
  exists (
    select 1 from public.applications a
    where a.id = application_id
      and (
        (select public.is_club_leader(a.club_id))
        or (select public.is_admin())
        or (
          a.user_id = (select auth.uid())
          and now() >= (select result_announcement_at from public.recruitment_settings where id = 'global')
        )
      )
  )
);
drop policy if exists "leaders_create_decision" on public.application_decisions;
create policy "leaders_create_decision" on public.application_decisions for insert to authenticated
with check (
  decided_by = (select auth.uid())
  and exists (
    select 1 from public.applications a
    where a.id = application_id and (select public.is_club_leader(a.club_id))
  )
);
drop policy if exists "leaders_update_decision" on public.application_decisions;
create policy "leaders_update_decision" on public.application_decisions for update to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id and (select public.is_club_leader(a.club_id))
))
with check (
  decided_by = (select auth.uid())
  and exists (
    select 1 from public.applications a
    where a.id = application_id and (select public.is_club_leader(a.club_id))
  )
);
drop policy if exists "leaders_delete_decision" on public.application_decisions;
create policy "leaders_delete_decision" on public.application_decisions for delete to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id and (select public.is_club_leader(a.club_id))
));

drop policy if exists "answers_read_allowed" on public.application_answers;
create policy "answers_read_allowed" on public.application_answers for select to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id
    and (a.user_id = (select auth.uid()) or (select public.is_club_leader(a.club_id)))
));
drop policy if exists "students_insert_draft_answers" on public.application_answers;
create policy "students_insert_draft_answers" on public.application_answers for insert to authenticated
with check (exists (
  select 1 from public.applications a
  where a.id = application_id and a.user_id = (select auth.uid()) and a.status = 'draft'
));
drop policy if exists "students_update_draft_answers" on public.application_answers;
create policy "students_update_draft_answers" on public.application_answers for update to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id and a.user_id = (select auth.uid()) and a.status = 'draft'
))
with check (exists (
  select 1 from public.applications a
  where a.id = application_id and a.user_id = (select auth.uid()) and a.status = 'draft'
));

drop policy if exists "favorites_own_read" on public.favorites;
create policy "favorites_own_read" on public.favorites for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "favorites_own_insert" on public.favorites;
create policy "favorites_own_insert" on public.favorites for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.current_user_role()) = 'student');
drop policy if exists "favorites_own_delete" on public.favorites;
create policy "favorites_own_delete" on public.favorites for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "notifications_own_read" on public.notifications;
create policy "notifications_own_read" on public.notifications for select to authenticated
using (user_id = (select auth.uid()) and available_at <= now());
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications for update to authenticated
using (user_id = (select auth.uid()) and available_at <= now())
with check (user_id = (select auth.uid()));

-- 공개 동아리 로고 버킷. 파일 경로는 {club_id}/{filename} 형식입니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-logos',
  'club-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "club_logo_owner_insert" on storage.objects;
create policy "club_logo_owner_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'club-logos'
  and (
    exists (
      select 1 from public.clubs c
      where c.id::text = (storage.foldername(name))[1]
        and c.leader_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);
drop policy if exists "club_logo_owner_update" on storage.objects;
create policy "club_logo_owner_update" on storage.objects for update to authenticated
using (
  bucket_id = 'club-logos'
  and (
    exists (
      select 1 from public.clubs c
      where c.id::text = (storage.foldername(name))[1]
        and c.leader_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);
drop policy if exists "club_logo_owner_delete" on storage.objects;
create policy "club_logo_owner_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'club-logos'
  and (
    exists (
      select 1 from public.clubs c
      where c.id::text = (storage.foldername(name))[1]
        and c.leader_id = (select auth.uid())
    )
    or (select public.is_admin())
  )
);

-- 테이블 권한. 실제 접근 가능 행은 위 RLS 정책이 한 번 더 제한합니다.
grant select on public.recruitment_settings, public.clubs, public.application_questions to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

select 'DIMI CLUB 데이터베이스 초기 설정이 완료되었습니다.' as result;
