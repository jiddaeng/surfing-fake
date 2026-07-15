import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')

test('signup and login screens do not ask for an email address', async () => {
  const [signup, login, auth] = await Promise.all([
    read('src/pages/SignupPage.tsx'),
    read('src/pages/LoginPage.tsx'),
    read('src/context/AuthContext.tsx'),
  ])
  assert.doesNotMatch(signup, /type="email"|form\.email|학교 이메일/)
  assert.doesNotMatch(login, /type="email"|학교 이메일/)
  assert.match(login, /학번 또는 로그인 ID/)
  assert.match(auth, /const toInternalEmail/)
  assert.match(auth, /signUp: \(name: string, studentNumber: string, password: string\)/)
})

test('admin can synchronize the official catalog without a database migration', async () => {
  const [admin, data] = await Promise.all([
    read('src/pages/AdminDashboard.tsx'),
    read('src/context/DataContext.tsx'),
  ])
  assert.match(admin, /공식 목록 적용/)
  assert.match(data, /syncOfficialClubCatalog/)
  assert.match(data, /LEGACY_DEMO_CLUB_NAMES/)
  assert.match(data, /\.upsert\(rows, \{ onConflict: 'name' \}\)/)
})

test('deployed login offers isolated demo accounts with the requested password', async () => {
  const [login, auth, demo, supabaseClient] = await Promise.all([
    read('src/pages/LoginPage.tsx'),
    read('src/context/AuthContext.tsx'),
    read('src/data/demo.ts'),
    read('src/lib/supabase.ts'),
  ])
  assert.match(demo, /DEMO_PASSWORD = 'demo1234'/)
  assert.match(login, /시연 계정 공통 비밀번호/)
  assert.doesNotMatch(login, /isDemoMode &&/)
  assert.match(login, /setPassword\(DEMO_PASSWORD\)/)
  assert.match(auth, /DEMO_MODE_OVERRIDE_KEY/)
  assert.match(auth, /return \{ requiresReload: true \}/)
  assert.match(supabaseClient, /Demo roles never receive a Supabase session/)
})
