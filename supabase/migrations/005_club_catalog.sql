-- Synchronize the official club names and categories without deleting live data.

begin;

-- Retire the old interview-demo clubs without deleting applications that may
-- still reference them. Official clubs use a separate UUID namespace so those
-- foreign keys remain intact.
update public.clubs
set is_published = false
where name in ('플레이스테이션', '아라', '인피니티', 'DIMI SOUND', 'MIRROR', '그린웨이브', 'STARTUP D', '제로백');

insert into public.clubs as club (
  id, name, category, summary, description, color, capacity, leader_name, is_published
) values
  ('50000000-0000-0000-0000-000000000001', '저스트', '창업', '창업 분야 동아리입니다.', E'# 저스트\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#155eef', 10, '박초연', true),
  ('50000000-0000-0000-0000-000000000002', '루나', '창업', '창업 분야 동아리입니다.', E'# 루나\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#7c3aed', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000003', '임플루드', '창업', '창업 분야 동아리입니다.', E'# 임플루드\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#0e9384', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000004', '모나드', '창업', '창업 분야 동아리입니다.', E'# 모나드\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#dc6803', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000005', '게임즈', '게임', '게임 분야 동아리입니다.', E'# 게임즈\n\n## 카테고리\n\n게임\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#d92d20', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000006', '블루프린트', '게임', '게임 분야 동아리입니다.', E'# 블루프린트\n\n## 카테고리\n\n게임\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#2563eb', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000007', '무럭무럭', '농업', '농업 분야 동아리입니다.', E'# 무럭무럭\n\n## 카테고리\n\n농업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#039855', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000008', '커맨드', '강의', '강의 분야 동아리입니다.', E'# 커맨드\n\n## 카테고리\n\n강의\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#475467', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000009', '토포스', '창업', '창업 분야 동아리입니다.', E'# 토포스\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#c11574', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000010', '프레직', 'ai', 'ai 분야 동아리입니다.', E'# 프레직\n\n## 카테고리\n\nai\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#9333ea', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000011', '코드베이커리', '피지컬 컴퓨팅', '피지컬 컴퓨팅 분야 동아리입니다.', E'# 코드베이커리\n\n## 카테고리\n\n피지컬 컴퓨팅\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#ea580c', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000012', '크레비스', '창업', '창업 분야 동아리입니다.', E'# 크레비스\n\n## 카테고리\n\n창업\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#0891b2', 10, '담당 동아리장', true),
  ('50000000-0000-0000-0000-000000000013', '온', '수학', '수학 분야 동아리입니다.', E'# 온\n\n## 카테고리\n\n수학\n\n상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.', '#4f46e5', 10, '담당 동아리장', true)
on conflict (name) do update
set category = excluded.category,
    summary = case
      when club.summary in ('', '동아리 소개 준비 중입니다.') then excluded.summary
      else club.summary
    end,
    description = case
      when club.description = '' or club.description like '%동아리 소개 준비 중%' then excluded.description
      else club.description
    end,
    leader_name = case when excluded.name = '저스트' then excluded.leader_name else club.leader_name end;

with catalog(name, question_id) as (
  values
    ('저스트', '51000000-0000-0000-0000-000000000001'::uuid),
    ('루나', '51000000-0000-0000-0000-000000000002'::uuid),
    ('임플루드', '51000000-0000-0000-0000-000000000003'::uuid),
    ('모나드', '51000000-0000-0000-0000-000000000004'::uuid),
    ('게임즈', '51000000-0000-0000-0000-000000000005'::uuid),
    ('블루프린트', '51000000-0000-0000-0000-000000000006'::uuid),
    ('무럭무럭', '51000000-0000-0000-0000-000000000007'::uuid),
    ('커맨드', '51000000-0000-0000-0000-000000000008'::uuid),
    ('토포스', '51000000-0000-0000-0000-000000000009'::uuid),
    ('프레직', '51000000-0000-0000-0000-000000000010'::uuid),
    ('코드베이커리', '51000000-0000-0000-0000-000000000011'::uuid),
    ('크레비스', '51000000-0000-0000-0000-000000000012'::uuid),
    ('온', '51000000-0000-0000-0000-000000000013'::uuid)
)
insert into public.application_questions (
  id, club_id, type, label, required, display_order
)
select catalog.question_id, club.id, 'long', club.name || '에 지원한 이유를 알려주세요.', true, 0
from catalog
join public.clubs as club on club.name = catalog.name
where not exists (
  select 1 from public.application_questions as existing where existing.club_id = club.id
)
on conflict (id) do nothing;

alter table public.clubs drop constraint if exists clubs_category_allowed;
alter table public.clubs add constraint clubs_category_allowed check (
  category in ('창업', '수학', '경제', 'ai', '농업', '게임', '피지컬 컴퓨팅', '강의')
) not valid;

commit;
