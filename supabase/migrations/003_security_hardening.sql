-- Security hardening for both fresh and already-deployed DIMI CLUB databases.
-- This migration is intentionally idempotent where PostgreSQL permits it.

begin;

-- Bound user-controlled data. NOT VALID keeps legacy rows from blocking the
-- rollout while still enforcing each constraint for every new or changed row.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_safe_fields') then
    alter table public.profiles add constraint profiles_safe_fields check (
      char_length(email) between 3 and 320
      and lower(email) ~ '^[^@[:space:]]+@dimigo\.hs\.kr$'
      and char_length(btrim(name)) between 1 and 50
      and (student_number is null or student_number ~ '^\d{4}$')
      and (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://'))
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clubs_safe_fields') then
    alter table public.clubs add constraint clubs_safe_fields check (
      char_length(btrim(name)) between 1 and 100
      and char_length(btrim(category)) between 1 and 50
      and char_length(summary) <= 200
      and char_length(description) <= 20000
      and color ~ '^#[0-9A-Fa-f]{6}$'
      and capacity between 1 and 1000
      and (logo_url is null or (char_length(logo_url) <= 2048 and logo_url ~ '^https://[^/]+/storage/v1/object/public/club-logos/'))
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'questions_safe_fields') then
    alter table public.application_questions add constraint questions_safe_fields check (
      char_length(btrim(label)) between 1 and 500
      and (description is null or char_length(description) <= 2000)
      and display_order between 0 and 100
      and char_length(coalesce(options::text, '')) <= 12000
      and case
        when type in ('single', 'multiple') then case
          when jsonb_typeof(options) = 'array' then jsonb_array_length(options) between 1 and 50
          else false
        end
        else options is null
      end
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'answers_safe_size') then
    alter table public.application_answers add constraint answers_safe_size
      check (pg_column_size(answer) <= 20000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_safe_fields') then
    alter table public.notifications add constraint notifications_safe_fields check (
      char_length(btrim(title)) between 1 and 200 and char_length(message) <= 2000
    ) not valid;
  end if;
end $$;

create unique index if not exists profiles_email_unique_lower
  on public.profiles (lower(email));
create unique index if not exists profiles_student_number_unique
  on public.profiles (student_number)
  where student_number is not null;

-- Ignore untrusted metadata fields that are outside the documented bounds.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_name text;
  safe_student_number text;
begin
  if lower(coalesce(new.email, '')) !~ '^[^@[:space:]]+@dimigo\.hs\.kr$' then
    raise exception '학교 이메일(@dimigo.hs.kr)만 가입할 수 있습니다.';
  end if;
  safe_name := left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, '학생'), '@', 1)), 50);
  safe_student_number := new.raw_user_meta_data ->> 'student_number';
  if safe_student_number is not null and safe_student_number !~ '^\d{4}$' then
    safe_student_number := null;
  end if;

  insert into public.profiles (id, email, name, student_number)
  values (new.id, left(coalesce(new.email, ''), 320), safe_name, safe_student_number)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.validate_profile_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if not public.is_admin() then
      raise exception '프로필을 변경할 권한이 없습니다.';
    end if;
    if new.id <> old.id or new.email <> old.email then
      raise exception '프로필의 계정 식별자와 이메일은 변경할 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile_before_write on public.profiles;
create trigger validate_profile_before_write
  before update on public.profiles
  for each row execute function public.validate_profile_write();

-- Inactive accounts have no application role even when their JWT remains valid.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid()) and is_active;
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

create or replace function public.validate_application_question()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.id <> old.id or new.club_id <> old.club_id) then
    raise exception '질문의 식별자와 동아리는 변경할 수 없습니다.';
  end if;
  if new.type in ('single', 'multiple') then
    if jsonb_typeof(new.options) <> 'array' or jsonb_array_length(new.options) not between 1 and 50 then
      raise exception '선택형 질문에는 1~50개의 선택지가 필요합니다.';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(new.options) as option(value)
      where jsonb_typeof(option.value) <> 'string'
        or char_length(btrim(option.value #>> '{}')) not between 1 and 200
    ) or (
      select count(*) <> count(distinct option.value #>> '{}')
      from jsonb_array_elements(new.options) as option(value)
    ) then
      raise exception '선택지는 1~200자의 중복되지 않은 문자열이어야 합니다.';
    end if;
  elsif new.options is not null then
    raise exception '선택형이 아닌 질문에는 선택지를 저장할 수 없습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_question_before_write on public.application_questions;
create trigger validate_question_before_write
  before insert or update on public.application_questions
  for each row execute function public.validate_application_question();

create or replace function public.validate_club_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role;
  actor_name text;
  accepted_count integer;
begin
  if tg_op = 'UPDATE' and new.id <> old.id then
    raise exception '동아리 식별자는 변경할 수 없습니다.';
  end if;
  if actor_id is not null then
    select role, name into actor_role, actor_name
    from public.profiles
    where id = actor_id and is_active;
    if actor_role = 'leader' then
      new.leader_id := actor_id;
      new.leader_name := actor_name;
      if tg_op = 'UPDATE' then new.created_at := old.created_at; end if;
    elsif actor_role is distinct from 'admin' then
      raise exception '동아리 정보를 변경할 권한이 없습니다.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.capacity < old.capacity then
    select count(*) into accepted_count
    from public.application_decisions d
    join public.applications a on a.id = d.application_id
    where a.club_id = old.id and d.result = 'accepted';
    if new.capacity < accepted_count then
      raise exception '현재 합격 인원보다 모집 정원을 작게 설정할 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_club_before_write on public.clubs;
create trigger validate_club_before_write
  before insert or update on public.clubs
  for each row execute function public.validate_club_write();

-- Enforce the application state machine in the database. UI checks are only a
-- convenience and cannot be trusted for authorization or deadline handling.
create or replace function public.validate_application_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role;
  settings_row public.recruitment_settings%rowtype;
  submitted_count integer;
begin
  -- SQL editor and service-role maintenance are trusted and already bypass RLS.
  if actor_id is null then
    return new;
  end if;

  select role into actor_role
  from public.profiles
  where id = actor_id and is_active;
  if actor_role is null then
    raise exception '비활성화되었거나 권한이 없는 계정입니다.';
  end if;

  if tg_op = 'UPDATE' and (
    new.id <> old.id or new.user_id <> old.user_id or new.club_id <> old.club_id or new.created_at <> old.created_at
  ) then
    raise exception '지원서의 식별자, 지원자, 지원 동아리와 생성 시각은 변경할 수 없습니다.';
  end if;
  if new.status in ('accepted', 'rejected') then
    raise exception '합격 결과는 application_decisions 테이블에만 저장할 수 있습니다.';
  end if;

  if actor_role = 'student' then
    if new.user_id <> actor_id then
      raise exception '다른 학생의 지원서를 작성할 수 없습니다.';
    end if;
    if tg_op = 'UPDATE' and old.status <> 'draft' then
      raise exception '제출한 지원서는 수정하거나 취소할 수 없습니다.';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception '학생이 지정할 수 없는 지원 상태입니다.';
    end if;

    select * into settings_row from public.recruitment_settings where id = 'global';
    if settings_row.id is null or now() < settings_row.recruitment_start_at or now() > settings_row.recruitment_end_at then
      raise exception '현재는 동아리 지원 기간이 아닙니다.';
    end if;

    if new.status = 'draft' then
      new.submitted_at := null;
    else
      -- Serializes concurrent submissions for one student, preventing a race
      -- that could otherwise exceed max_applications.
      perform 1 from public.profiles where id = new.user_id for update;
      select count(*) into submitted_count
      from public.applications
      where user_id = new.user_id and status <> 'draft' and id <> new.id;
      if submitted_count >= settings_row.max_applications then
        raise exception '동아리는 최대 %개까지 지원할 수 있습니다.', settings_row.max_applications;
      end if;

      if exists (
        select 1
        from public.application_questions q
        where q.club_id = new.club_id and q.required
          and not exists (
            select 1
            from public.application_answers ans
            where ans.application_id = new.id and ans.question_id = q.id
              and case jsonb_typeof(ans.answer)
                when 'string' then btrim(ans.answer #>> '{}') <> ''
                when 'array' then jsonb_array_length(ans.answer) > 0
                else false
              end
          )
      ) then
        raise exception '필수 질문에 모두 답변해야 제출할 수 있습니다.';
      end if;
      new.submitted_at := now();
    end if;
  elsif actor_role = 'leader' then
    if tg_op <> 'UPDATE' or not public.is_club_leader(new.club_id) then
      raise exception '담당 동아리 지원서만 검토할 수 있습니다.';
    end if;
    if new.status not in ('submitted', 'reviewing') then
      raise exception '동아리장이 지정할 수 없는 지원 상태입니다.';
    end if;
    new.submitted_at := old.submitted_at;
  elsif actor_role = 'admin' then
    if new.status not in ('submitted', 'reviewing') then
      raise exception '지원서 행에는 제출 또는 검토 상태만 저장할 수 있습니다.';
    end if;
    if tg_op = 'UPDATE' then new.submitted_at := old.submitted_at; end if;
  end if;

  return new;
end;
$$;

-- Every answer must belong to a question from the same club and match the
-- question's declared type and size limits.
create or replace function public.validate_application_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role;
  target_application public.applications%rowtype;
  target_question public.application_questions%rowtype;
  answer_text text;
begin
  if tg_op = 'UPDATE' and (
    new.id <> old.id or new.application_id <> old.application_id or new.question_id <> old.question_id
  ) then
    raise exception '답변의 식별자와 연결 정보는 변경할 수 없습니다.';
  end if;
  select * into target_application from public.applications where id = new.application_id;
  select * into target_question from public.application_questions where id = new.question_id;
  if target_application.id is null or target_question.id is null or target_application.club_id <> target_question.club_id then
    raise exception '지원 동아리와 관계없는 질문에는 답변할 수 없습니다.';
  end if;

  if actor_id is not null then
    select role into actor_role from public.profiles where id = actor_id and is_active;
    if actor_role is distinct from 'student' or target_application.user_id <> actor_id or target_application.status <> 'draft' then
      raise exception '임시 저장 중인 본인 지원서만 수정할 수 있습니다.';
    end if;
  end if;

  if pg_column_size(new.answer) > 20000 then
    raise exception '답변이 너무 깁니다.';
  end if;

  if target_question.type in ('short', 'long', 'link') then
    if jsonb_typeof(new.answer) <> 'string' then raise exception '문자열 답변이 필요합니다.'; end if;
    answer_text := new.answer #>> '{}';
    if target_question.type = 'short' and char_length(answer_text) > 500 then raise exception '짧은 답변은 500자 이하여야 합니다.'; end if;
    if target_question.type = 'long' and char_length(answer_text) > 5000 then raise exception '긴 답변은 5000자 이하여야 합니다.'; end if;
    if target_question.type = 'link' and (
      char_length(answer_text) > 2048 or (answer_text <> '' and answer_text !~ '^https://[^[:space:]]+$')
    ) then raise exception '링크는 올바른 HTTPS 주소여야 합니다.'; end if;
  elsif target_question.type = 'single' then
    if jsonb_typeof(new.answer) <> 'string' or not (target_question.options ? (new.answer #>> '{}')) then
      raise exception '등록된 선택지 하나를 골라야 합니다.';
    end if;
  elsif target_question.type = 'multiple' then
    if jsonb_typeof(new.answer) <> 'array' or jsonb_array_length(new.answer) > 50 then
      raise exception '복수 선택 답변 형식이 올바르지 않습니다.';
    end if;
    if exists (
      select 1 from jsonb_array_elements(new.answer) as selected(value)
      where jsonb_typeof(selected.value) <> 'string'
        or not (target_question.options ? (selected.value #>> '{}'))
    ) or (
      select count(*) <> count(distinct selected.value #>> '{}')
      from jsonb_array_elements(new.answer) as selected(value)
    ) then
      raise exception '등록되지 않았거나 중복된 선택지가 있습니다.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists validate_answer_before_write on public.application_answers;
create trigger validate_answer_before_write
  before insert or update on public.application_answers
  for each row execute function public.validate_application_answer();

-- A leader can decide only submitted applications from their own club. Locking
-- the club row makes the accepted capacity check safe under concurrency.
create or replace function public.validate_application_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.user_role;
  target_application public.applications%rowtype;
  club_capacity integer;
  accepted_count integer;
begin
  if tg_op = 'UPDATE' and new.application_id <> old.application_id then
    raise exception '결정의 지원서는 변경할 수 없습니다.';
  end if;
  select * into target_application from public.applications where id = new.application_id;
  if target_application.id is null or target_application.status not in ('submitted', 'reviewing') then
    raise exception '제출되거나 검토 중인 지원서만 처리할 수 있습니다.';
  end if;

  if actor_id is not null then
    select role into actor_role from public.profiles where id = actor_id and is_active;
    if actor_role is null or not (actor_role = 'admin' or (actor_role = 'leader' and public.is_club_leader(target_application.club_id))) then
      raise exception '지원 결과를 처리할 권한이 없습니다.';
    end if;
    new.decided_by := actor_id;
    if tg_op = 'INSERT' then new.decided_at := now(); end if;
  end if;

  select capacity into club_capacity from public.clubs where id = target_application.club_id for update;
  if new.result = 'accepted' then
    select count(*) into accepted_count
    from public.application_decisions d
    join public.applications a on a.id = d.application_id
    where a.club_id = target_application.club_id
      and d.result = 'accepted'
      and d.application_id <> new.application_id;
    if accepted_count >= club_capacity then
      raise exception '동아리 모집 정원을 초과해 합격 처리할 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_decision_before_write on public.application_decisions;
create trigger validate_decision_before_write
  before insert or update on public.application_decisions
  for each row execute function public.validate_application_decision();

-- Replace policies whose previous WITH CHECK clauses permitted state forgery.
drop policy if exists "applications_read_allowed" on public.applications;
create policy "applications_read_allowed" on public.applications for select to authenticated
using (
  (select public.current_user_role()) is not null
  and (
    user_id = (select auth.uid())
    or (select public.is_club_leader(club_id))
    or (select public.is_admin())
  )
);

drop policy if exists "clubs_owner_update" on public.clubs;
create policy "clubs_owner_update" on public.clubs for update to authenticated
using ((select public.is_club_leader(id)) or (select public.is_admin()))
with check (
  (leader_id = (select auth.uid()) and (select public.current_user_role()) = 'leader')
  or (select public.is_admin())
);

drop policy if exists "students_create_application" on public.applications;
create policy "students_create_application" on public.applications for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.current_user_role()) = 'student'
  and status = 'draft'
);

drop policy if exists "student_or_leader_update_application" on public.applications;
create policy "student_or_leader_update_application" on public.applications for update to authenticated
using (
  (user_id = (select auth.uid()) and status = 'draft' and (select public.current_user_role()) = 'student')
  or (select public.is_club_leader(club_id))
  or (select public.is_admin())
)
with check (
  (
    user_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and (select public.current_user_role()) = 'student'
  )
  or ((select public.is_club_leader(club_id)) and status in ('submitted', 'reviewing'))
  or ((select public.is_admin()) and status in ('submitted', 'reviewing'))
);

drop policy if exists "answers_read_allowed" on public.application_answers;
create policy "answers_read_allowed" on public.application_answers for select to authenticated
using ((select public.current_user_role()) is not null and exists (
  select 1 from public.applications a
  where a.id = application_id
    and (a.user_id = (select auth.uid()) or (select public.is_club_leader(a.club_id)) or (select public.is_admin()))
));

drop policy if exists "decisions_read_allowed" on public.application_decisions;
create policy "decisions_read_allowed" on public.application_decisions for select to authenticated
using (
  (select public.current_user_role()) is not null
  and exists (
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

drop policy if exists "students_insert_draft_answers" on public.application_answers;
create policy "students_insert_draft_answers" on public.application_answers for insert to authenticated
with check (exists (
  select 1
  from public.applications a
  join public.application_questions q on q.id = question_id and q.club_id = a.club_id
  where a.id = application_id
    and a.user_id = (select auth.uid())
    and a.status = 'draft'
    and (select public.current_user_role()) = 'student'
));

drop policy if exists "students_update_draft_answers" on public.application_answers;
create policy "students_update_draft_answers" on public.application_answers for update to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id and a.user_id = (select auth.uid()) and a.status = 'draft'
))
with check (exists (
  select 1
  from public.applications a
  join public.application_questions q on q.id = question_id and q.club_id = a.club_id
  where a.id = application_id
    and a.user_id = (select auth.uid())
    and a.status = 'draft'
    and (select public.current_user_role()) = 'student'
));

drop policy if exists "students_delete_draft_answers" on public.application_answers;
create policy "students_delete_draft_answers" on public.application_answers for delete to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id
    and a.user_id = (select auth.uid())
    and a.status = 'draft'
    and (select public.current_user_role()) = 'student'
));

drop policy if exists "leaders_create_decision" on public.application_decisions;
create policy "leaders_create_decision" on public.application_decisions for insert to authenticated
with check (
  decided_by = (select auth.uid())
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.status in ('submitted', 'reviewing')
      and ((select public.is_club_leader(a.club_id)) or (select public.is_admin()))
  )
);

drop policy if exists "leaders_update_decision" on public.application_decisions;
create policy "leaders_update_decision" on public.application_decisions for update to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id
    and a.status in ('submitted', 'reviewing')
    and ((select public.is_club_leader(a.club_id)) or (select public.is_admin()))
))
with check (
  decided_by = (select auth.uid())
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.status in ('submitted', 'reviewing')
      and ((select public.is_club_leader(a.club_id)) or (select public.is_admin()))
  )
);

drop policy if exists "leaders_delete_decision" on public.application_decisions;
create policy "leaders_delete_decision" on public.application_decisions for delete to authenticated
using (exists (
  select 1 from public.applications a
  where a.id = application_id
    and a.status in ('submitted', 'reviewing')
    and ((select public.is_club_leader(a.club_id)) or (select public.is_admin()))
));

drop policy if exists "favorites_own_read" on public.favorites;
create policy "favorites_own_read" on public.favorites for select to authenticated
using (user_id = (select auth.uid()) and (select public.current_user_role()) is not null);
drop policy if exists "favorites_own_insert" on public.favorites;
create policy "favorites_own_insert" on public.favorites for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.current_user_role()) = 'student');
drop policy if exists "favorites_own_delete" on public.favorites;
create policy "favorites_own_delete" on public.favorites for delete to authenticated
using (user_id = (select auth.uid()) and (select public.current_user_role()) is not null);

drop policy if exists "notifications_own_read" on public.notifications;
create policy "notifications_own_read" on public.notifications for select to authenticated
using (
  user_id = (select auth.uid())
  and available_at <= now()
  and (select public.current_user_role()) is not null
);
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications for update to authenticated
using (
  user_id = (select auth.uid())
  and available_at <= now()
  and (select public.current_user_role()) is not null
)
with check (user_id = (select auth.uid()) and (select public.current_user_role()) is not null);

-- SVG is active content. Remove existing SVG metadata/links and permit only
-- raster logo uploads in a real club-id folder.
update public.clubs set logo_url = null where logo_url ~* '\.svg(?:$|\?)';
delete from storage.objects
where bucket_id = 'club-logos'
  and (name ~* '\.svg$' or coalesce(metadata ->> 'mimetype', '') = 'image/svg+xml');
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'club-logos';

drop policy if exists "club_logo_owner_insert" on storage.objects;
create policy "club_logo_owner_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'club-logos'
  and lower(name) ~ '^[0-9a-f-]{36}/[^/]+\.(jpg|jpeg|png|webp)$'
  and coalesce(metadata ->> 'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
  and exists (
    select 1 from public.clubs c
    where c.id::text = (storage.foldername(name))[1]
      and ((select public.is_club_leader(c.id)) or (select public.is_admin()))
  )
);

drop policy if exists "club_logo_owner_update" on storage.objects;
create policy "club_logo_owner_update" on storage.objects for update to authenticated
using (
  bucket_id = 'club-logos'
  and exists (
    select 1 from public.clubs c
    where c.id::text = (storage.foldername(name))[1]
      and ((select public.is_club_leader(c.id)) or (select public.is_admin()))
  )
)
with check (
  bucket_id = 'club-logos'
  and lower(name) ~ '^[0-9a-f-]{36}/[^/]+\.(jpg|jpeg|png|webp)$'
  and coalesce(metadata ->> 'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
  and exists (
    select 1 from public.clubs c
    where c.id::text = (storage.foldername(name))[1]
      and ((select public.is_club_leader(c.id)) or (select public.is_admin()))
  )
);

drop policy if exists "club_logo_owner_delete" on storage.objects;
create policy "club_logo_owner_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'club-logos'
  and exists (
    select 1 from public.clubs c
    where c.id::text = (storage.foldername(name))[1]
      and ((select public.is_club_leader(c.id)) or (select public.is_admin()))
  )
);

-- PostgreSQL grants EXECUTE to PUBLIC by default. Security-definer helpers and
-- trigger functions must expose only the minimum explicit surface.
revoke all on function public.current_user_role() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.is_club_leader(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_profile_write() from public, anon, authenticated;
revoke all on function public.validate_application_question() from public, anon, authenticated;
revoke all on function public.validate_club_write() from public, anon, authenticated;
revoke all on function public.validate_application_write() from public, anon, authenticated;
revoke all on function public.validate_application_answer() from public, anon, authenticated;
revoke all on function public.validate_application_decision() from public, anon, authenticated;
revoke all on function public.create_result_notification() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_club_leader(uuid) to authenticated;

-- Replace the previous blanket authenticated CRUD grant. In particular, users
-- may update only notifications.read and cannot forge notification contents.
revoke all privileges on table
  public.profiles,
  public.recruitment_settings,
  public.clubs,
  public.application_questions,
  public.applications,
  public.application_decisions,
  public.application_answers,
  public.favorites,
  public.notifications
from anon, authenticated;

grant select on public.recruitment_settings, public.clubs, public.application_questions to anon;
grant select on
  public.profiles,
  public.recruitment_settings,
  public.clubs,
  public.application_questions,
  public.applications,
  public.application_decisions,
  public.application_answers,
  public.favorites,
  public.notifications
to authenticated;
grant update on public.profiles, public.recruitment_settings to authenticated;
grant insert, update, delete on public.clubs, public.application_questions to authenticated;
grant insert, update on public.applications to authenticated;
grant insert, update, delete on public.application_decisions, public.application_answers to authenticated;
grant insert, delete on public.favorites to authenticated;
grant update (read) on public.notifications to authenticated;

commit;
