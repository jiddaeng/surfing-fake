-- Make student-to-leader promotion atomic and verifiable.
-- Run this migration on databases that already have 001 and 003 applied.

begin;

create or replace function public.promote_student_to_leader(target_profile_id uuid)
returns setof public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception '관리자만 학생 계정을 동아리장으로 승격할 수 있습니다.' using errcode = '42501';
  end if;

  return query
  update public.profiles as target
  set role = 'leader'
  where target.id = target_profile_id
    and target.role = 'student'
    and target.is_active
  returning target.*;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception '승격할 활성 학생 계정을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.promote_student_to_leader(uuid) from public, anon, authenticated;
grant execute on function public.promote_student_to_leader(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
