-- DIMI CLUB 면접 시연용 데이터
-- 001_initial_schema.sql 실행 및 시연 계정 3개 생성 후 실행하세요.

update public.profiles set name = '안지호', student_number = '1301', role = 'student'
where email = 'student@dimigo.hs.kr';
update public.profiles set name = '김하늘', student_number = '2407', role = 'leader'
where email = 'leader@dimigo.hs.kr';
update public.profiles set name = '학생회 IT부', student_number = null, role = 'admin'
where email = 'admin@dimigo.hs.kr';

insert into public.clubs (
  id, name, category, summary, description, color, capacity, leader_id, leader_name, is_published
) values
(
  '20000000-0000-0000-0000-000000000001', '플레이스테이션', '전공',
  '아이디어를 실제 서비스로 만드는 웹·앱 개발 동아리',
  E'# 상상을 서비스로, 플레이스테이션\n\n플레이스테이션은 **기획부터 디자인, 개발, 배포까지** 한 팀으로 경험하는 전공 동아리입니다.\n\n## 이런 활동을 해요\n\n- React와 TypeScript를 활용한 웹 서비스 개발\n- Figma로 사용자 중심의 UI/UX 설계\n- 팀 프로젝트와 코드 리뷰\n- 교내 해커톤 및 전시 참여\n\n> 지금 실력이 완벽하지 않아도 괜찮습니다. 끝까지 함께 만들 사람을 기다립니다.\n\n## 모집 분야\n\n| 분야 | 하는 일 |\n| --- | --- |\n| Frontend | 사용자가 만나는 화면 개발 |\n| Backend | API와 데이터베이스 설계 |\n| Design | 서비스 경험과 인터페이스 디자인 |',
  '#155eef', 12,
  (select id from public.profiles where email = 'leader@dimigo.hs.kr' limit 1), '김하늘', true
),
(
  '20000000-0000-0000-0000-000000000002', '아라', '전공',
  '보안의 원리를 배우고 직접 문제를 해결하는 정보보안 동아리',
  E'# ARA Security Lab\n\n공격자의 시선으로 시스템을 이해하고, 더 안전한 세상을 만드는 방법을 공부합니다.\n\n## 주요 활동\n\n- 웹 해킹과 시스템 해킹 기초\n- CTF 문제 제작 및 풀이\n- 교내 보안 캠페인\n- 보안 대회 팀 출전\n\n윤리적인 보안 원칙을 가장 중요하게 생각합니다.',
  '#6941c6', 10, null, '최윤서', true
),
(
  '20000000-0000-0000-0000-000000000003', '인피니티', '전공',
  '데이터에서 의미를 찾고 인공지능으로 가능성을 넓히는 동아리',
  E'# INFINITY AI\n\n수학과 코딩을 연결해 **인공지능 모델을 직접 만들고 실험**합니다.\n\n1. Python 데이터 분석 스터디\n2. 머신러닝·딥러닝 기초\n3. 공공데이터 활용 프로젝트\n4. 결과 발표와 기술 블로그 작성\n\nPython을 처음 시작하는 학생도 기초 스터디부터 참여할 수 있습니다.',
  '#0e9384', 14, null, '정민준', true
),
(
  '20000000-0000-0000-0000-000000000004', 'DIMI SOUND', '문화예술',
  '무대 위에서 하나의 소리를 완성하는 교내 밴드',
  E'# DIMI SOUND 🎸\n\n음악을 좋아하는 학생들이 모여 합주하고 공연하는 밴드 동아리입니다.\n\n- 보컬, 기타, 베이스, 키보드, 드럼 모집\n- 매주 파트 연습 및 정기 합주\n- 학교 축제와 버스킹 공연\n\n지원서에 연주 가능한 악기와 좋아하는 음악을 알려주세요!',
  '#e04f16', 8, null, '한지우', true
),
(
  '20000000-0000-0000-0000-000000000005', 'MIRROR', '문화예술',
  '세상을 프레임 안에 기록하는 사진·영상 제작 동아리',
  E'# MIRROR\n\n우리의 학교생활과 이야기를 사진과 영상으로 기록합니다.\n\n## 프로젝트\n\n- 교내 행사 스케치 영상\n- 인물 및 풍경 사진 출사\n- 단편 영화 제작\n- 프리미어 프로·다빈치 리졸브 편집 스터디\n\n장비가 없어도 참여할 수 있습니다.',
  '#475467', 10, null, '서예준', true
),
(
  '20000000-0000-0000-0000-000000000006', '그린웨이브', '봉사',
  '작은 실천을 모아 학교와 지역사회를 바꾸는 환경 봉사 동아리',
  E'# GREEN WAVE 🌱\n\n지속 가능한 학교를 만들기 위한 프로젝트를 직접 기획하고 실행합니다.\n\n- 교내 분리배출 개선 캠페인\n- 지역 환경 정화 봉사\n- 업사이클링 워크숍\n- 환경 데이터 조사 및 카드뉴스 제작',
  '#039855', 16, null, '윤채원', true
),
(
  '20000000-0000-0000-0000-000000000007', 'STARTUP D', '창업',
  '문제를 발견하고 비즈니스로 해결하는 청소년 창업 동아리',
  E'# STARTUP D\n\n좋은 아이디어를 **고객이 원하는 제품**으로 발전시키는 과정을 배웁니다.\n\n## 한 학기 로드맵\n\n아이디어 발굴 → 사용자 인터뷰 → MVP 제작 → 피칭 데이\n\n개발자뿐 아니라 기획, 디자인, 마케팅에 관심 있는 학생 모두 환영합니다.',
  '#dc6803', 12, null, '오현우', true
),
(
  '20000000-0000-0000-0000-000000000008', '제로백', '체육',
  '기초 체력부터 팀워크까지 함께 성장하는 농구 동아리',
  E'# ZERO100 Basketball 🏀\n\n경기 실력보다 **성실함과 팀워크**를 중요하게 생각합니다.\n\n- 주 1회 정기 훈련\n- 포지션별 기본기 연습\n- 교내 리그 및 타 학교 교류전\n\n농구를 처음 시작하는 학생도 지원할 수 있습니다.',
  '#d92d20', 15, null, '임도현', true
)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, summary = excluded.summary,
  description = excluded.description, color = excluded.color, capacity = excluded.capacity,
  leader_id = coalesce(excluded.leader_id, public.clubs.leader_id),
  leader_name = excluded.leader_name, is_published = excluded.is_published;

insert into public.application_questions (
  id, club_id, type, label, description, required, options, display_order
) values
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'long', '플레이스테이션에 지원한 이유를 알려주세요.', '관심을 갖게 된 계기와 기대하는 활동을 함께 적어주세요.', true, null, 0),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'single', '가장 관심 있는 분야는 무엇인가요?', null, true, '["Frontend", "Backend", "Design", "아직 정하지 못함"]'::jsonb, 1),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'long', '만들어 보고 싶은 서비스를 자유롭게 소개해주세요.', null, true, null, 2),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'link', '관련 프로젝트나 포트폴리오가 있다면 링크를 남겨주세요.', null, false, null, 3),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'long', '정보보안에 관심을 갖게 된 계기를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 'long', '인공지능으로 해결해보고 싶은 문제를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', 'multiple', '연주할 수 있는 파트를 모두 선택해주세요.', null, true, '["보컬", "기타", "베이스", "키보드", "드럼"]'::jsonb, 0),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000005', 'long', '만들고 싶은 사진 또는 영상 프로젝트를 소개해주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006', 'long', '학교에서 실천하고 싶은 환경 활동을 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000007', 'long', '해결해보고 싶은 일상의 문제를 알려주세요.', null, true, null, 0),
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000008', 'long', '농구 동아리에서 이루고 싶은 목표를 알려주세요.', null, true, null, 0)
on conflict (id) do update set
  club_id = excluded.club_id, type = excluded.type, label = excluded.label,
  description = excluded.description, required = excluded.required,
  options = excluded.options, display_order = excluded.display_order;

-- 학생 계정이 존재하면 동아리장 화면용 예시 지원서 1개를 만듭니다.
insert into public.applications (id, club_id, user_id, status, submitted_at)
select '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', id, 'reviewing', now() - interval '1 day'
from public.profiles where email = 'student@dimigo.hs.kr'
on conflict (id) do nothing;

insert into public.application_answers (application_id, question_id, answer)
select '40000000-0000-0000-0000-000000000001', question_id, answer
from (values
  ('30000000-0000-0000-0000-000000000001'::uuid, '"웹 서비스를 직접 기획하고 완성하는 경험을 쌓고 싶어 지원했습니다."'::jsonb),
  ('30000000-0000-0000-0000-000000000002'::uuid, '"Frontend"'::jsonb),
  ('30000000-0000-0000-0000-000000000003'::uuid, '"기숙사에서 물건을 빌리고 돌려주는 과정을 관리하는 서비스를 만들고 싶습니다."'::jsonb)
) as seed_answers(question_id, answer)
where exists (select 1 from public.applications where id = '40000000-0000-0000-0000-000000000001')
on conflict (application_id, question_id) do update set answer = excluded.answer;

insert into public.favorites (user_id, club_id)
select p.id, c.id from public.profiles p cross join public.clubs c
where p.email = 'student@dimigo.hs.kr'
  and c.id in (
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000007'
  )
on conflict do nothing;

select '시연용 계정 역할과 예시 데이터 입력이 완료되었습니다.' as result;
