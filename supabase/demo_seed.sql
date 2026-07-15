-- DIMI CLUB 로컬 면접 시연용 데이터
-- 운영 데이터베이스에서는 절대 실행하지 마세요. 모든 지원 데이터를 삭제합니다.
-- 001/003 migration 실행 및 로컬 시연 계정 4개 생성 후 수동 실행하세요.

update public.profiles set name = '시연 학생', student_number = '1301', role = 'student'
where email = 'student@dimigo.hs.kr';
update public.profiles set name = '시연 동아리장', student_number = '2407', role = 'leader'
where email = 'leader@dimigo.hs.kr';
update public.profiles set name = '신규 동아리장', student_number = '2501', role = 'leader'
where email = 'newleader@dimigo.hs.kr';
update public.profiles set name = '학생회 IT부', student_number = null, role = 'admin'
where email = 'admin@dimigo.hs.kr';

delete from public.application_decisions;
delete from public.application_answers;
delete from public.applications;
delete from public.favorites;
delete from public.application_questions;
delete from public.clubs;

insert into public.clubs (
  id, name, category, summary, description, color, capacity, leader_id, leader_name, is_published
) values
(
  '20000000-0000-0000-0000-000000000001', '저스트', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 저스트\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#155eef', 10,
  (select id from public.profiles where email = 'leader@dimigo.hs.kr' limit 1), '시연 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000002', '루나', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 루나\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#7c3aed', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000003', '임플루드', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 임플루드\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#0e9384', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000004', '모나드', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 모나드\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#dc6803', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000005', '게임즈', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 게임즈\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#d92d20', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000006', '블루프린트', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 블루프린트\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#2563eb', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000007', '무럭무럭', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 무럭무럭\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#039855', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000008', '커맨드', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 커맨드\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#475467', 10, null, '담당 동아리장', true
),
(
  '20000000-0000-0000-0000-000000000009', '토포스', '전공',
  '동아리 소개 준비 중입니다.',
  E'# 토포스\n\n동아리 소개 준비 중입니다.\n\n동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.',
  '#c11574', 10, null, '담당 동아리장', true
);

insert into public.application_questions (
  id, club_id, type, label, description, required, options, display_order
) values
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'long', '저스트에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'long', '루나에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'long', '임플루드에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'long', '모나드에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'long', '게임즈에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 'long', '블루프린트에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007', 'long', '무럭무럭에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000008', 'long', '커맨드에 지원한 이유를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000009', 'long', '토포스에 지원한 이유를 알려주세요.', null, true, null, 0);

insert into public.applications (id, club_id, user_id, status, submitted_at)
select '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', id, 'reviewing', now() - interval '1 day'
from public.profiles where email = 'student@dimigo.hs.kr';

insert into public.application_answers (application_id, question_id, answer)
select '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '"동아리 활동을 통해 프로젝트 경험을 쌓고 싶어 지원했습니다."'::jsonb
where exists (select 1 from public.applications where id = '40000000-0000-0000-0000-000000000001');

insert into public.favorites (user_id, club_id)
select p.id, c.id from public.profiles p cross join public.clubs c
where p.email = 'student@dimigo.hs.kr'
  and c.id in (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000009'
  );

select '시연용 동아리 목록 입력이 완료되었습니다.' as result;
