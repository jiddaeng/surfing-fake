-- 관리자가 앱 안에서 가입 계정의 Auth 이메일 확인 상태를 승인합니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 한 번 실행하세요.

begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.list_pending_accounts()
returns table (
  user_id uuid,
  display_name text,
  student_number text,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 승인 대기 계정을 볼 수 있습니다.';
  end if;

  return query
  select u.id, p.name, p.student_number, u.created_at
  from auth.users as u
  join public.profiles as p on p.id = u.id
  where u.email_confirmed_at is null
    and u.deleted_at is null
    and p.role = 'student'
  order by u.created_at asc;
end;
$$;

create or replace function public.approve_account(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if not public.is_admin() then
    raise exception '관리자만 계정을 승인할 수 있습니다.';
  end if;

  update auth.users as target
  set email_confirmed_at = coalesce(target.email_confirmed_at, clock_timestamp()),
      updated_at = clock_timestamp()
  where target.id = target_user_id
    and target.deleted_at is null;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception '승인할 계정을 찾지 못했습니다.';
  end if;

  update public.profiles
  set is_active = true,
      updated_at = clock_timestamp()
  where id = target_user_id;

  return true;
end;
$$;

revoke all on function public.list_pending_accounts() from public, anon, authenticated;
revoke all on function public.approve_account(uuid) from public, anon, authenticated;
grant execute on function public.list_pending_accounts() to authenticated;
grant execute on function public.approve_account(uuid) to authenticated;

-- 배포용 시연 계정도 실제 Supabase 계정으로 우선 로그인할 수 있게 맞춥니다.
-- pgcrypto가 설치된 실제 스키마를 찾아 호출하므로 프로젝트 설정과 무관하게 동작합니다.
do $password_reset$
declare
  crypto_schema text;
begin
  select namespace.nspname
  into crypto_schema
  from pg_extension as ext
  join pg_namespace as namespace on namespace.oid = ext.extnamespace
  where ext.extname = 'pgcrypto';

  if crypto_schema is null then
    raise exception 'pgcrypto 확장을 찾지 못했습니다.';
  end if;

  execute format(
    'update auth.users
     set encrypted_password = %1$I.crypt(%2$L, %1$I.gen_salt(''bf'')),
         email_confirmed_at = coalesce(email_confirmed_at, clock_timestamp()),
         updated_at = clock_timestamp()
     where lower(email) = any (%3$L::text[])',
    crypto_schema,
    'demo1234',
    array[
      'student@dimigo.hs.kr',
      'leader@dimigo.hs.kr',
      'newleader@dimigo.hs.kr',
      'admin@dimigo.hs.kr'
    ]
  );
end;
$password_reset$;

update public.profiles
set role = 'admin', is_active = true
where lower(email) = 'admin@dimigo.hs.kr';

update public.profiles
set role = 'leader', is_active = true
where lower(email) in ('leader@dimigo.hs.kr', 'newleader@dimigo.hs.kr');

notify pgrst, 'reload schema';

commit;
