import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')

const mappings = [
  ['저스트', '창업'],
  ['루나', '창업'],
  ['게임즈', '게임'],
  ['모나드', '창업'],
  ['무럭무럭', '농업'],
  ['블루프린트', '게임'],
  ['임플루드', '창업'],
  ['커맨드', '강의'],
  ['토포스', '창업'],
  ['프레직', 'ai'],
  ['코드베이커리', '피지컬 컴퓨팅'],
  ['크레비스', '창업'],
  ['온', '수학'],
]

test('official club catalog contains the requested categories and mappings', async () => {
  const catalog = await read('src/data/clubs.ts')
  assert.match(catalog, /\['창업', '수학', '경제', 'ai', '농업', '게임', '피지컬 컴퓨팅', '강의'\]/)
  assert.equal((catalog.match(/\{ name:/g) ?? []).length, 13)
  for (const [name, category] of mappings) {
    assert.match(catalog, new RegExp(`name: '${name}', category: '${category}'`))
  }
  assert.match(catalog, /name: '저스트', category: '창업', leaderName: '박초연'/)
})

test('catalog migration is non-destructive and avoids existing demo club ids', async () => {
  const sql = await read('supabase/migrations/005_club_catalog.sql')
  assert.doesNotMatch(sql, /delete\s+from/i)
  assert.match(sql, /on conflict \(name\) do update/i)
  assert.match(sql, /when club\.summary in \('', '동아리 소개 준비 중입니다\.'\) then excluded\.summary/i)
  assert.match(sql, /50000000-0000-0000-0000-000000000003', '임플루드', '창업'/)
  assert.match(sql, /50000000-0000-0000-0000-000000000005', '게임즈', '게임'/)
  assert.match(sql, /50000000-0000-0000-0000-000000000007', '무럭무럭', '농업'/)
  assert.match(sql, /set is_published = false[\s\S]*'플레이스테이션'/i)
  assert.match(sql, /insert into public\.application_questions[\s\S]*where not exists/i)
  assert.match(sql, /clubs_category_allowed[\s\S]*not valid/i)
})

test('club screens use the shared category catalog and refresh demo data', async () => {
  const [leaderPage, clubsPage, dashboard, dataContext] = await Promise.all([
    read('src/pages/LeaderClubPage.tsx'),
    read('src/pages/ClubsPage.tsx'),
    read('src/pages/StudentDashboard.tsx'),
    read('src/context/DataContext.tsx'),
  ])
  assert.match(leaderPage, /CLUB_CATEGORIES\.map/)
  assert.match(clubsPage, /\['전체', \.\.\.CLUB_CATEGORIES\]/)
  assert.match(dashboard, /\['전체', \.\.\.CLUB_CATEGORIES\]/)
  assert.match(dataContext, /demo-store:v2/)
  assert.match(dataContext, /const persistedClubsFromRows = \(rows: any\[\]\): Club\[\] => rows\.map\(mapClub\)/)
  assert.doesNotMatch(dataContext, /createdAt: new Date\(0\)\.toISOString\(\)/)
  assert.match(dataContext, /setQuestions\(mappedQuestions\)/)
  assert.match(dataContext, /\.eq\('leader_id', profile\.id\)\s*\.maybeSingle\(\)/)
})
