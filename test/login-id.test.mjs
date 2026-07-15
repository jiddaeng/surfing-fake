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

test('configured login uses real Supabase sessions for demo credentials', async () => {
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
  assert.doesNotMatch(auth, /localStorage\.setItem\(DEMO_MODE_OVERRIDE_KEY/)
  assert.doesNotMatch(auth, /password === DEMO_PASSWORD/)
  assert.match(auth, /supabase\.auth\.signInWithPassword\(\{ email, password \}\)/)
  assert.match(supabaseClient, /!isSupabaseConfigured && legacyDemoSessionEnabled/)
})

test('admin can list and approve pending Supabase accounts', async () => {
  const [admin, data, auth, sql] = await Promise.all([
    read('src/pages/AdminDashboard.tsx'),
    read('src/context/DataContext.tsx'),
    read('src/context/AuthContext.tsx'),
    read('supabase/migrations/006_account_approval.sql'),
  ])
  assert.match(admin, /계정 승인/)
  assert.match(admin, /승인 대기/)
  assert.match(data, /\.rpc\('list_pending_accounts'/)
  assert.match(data, /\.rpc\('approve_account'/)
  assert.match(auth, /supabase\.auth\.signInWithPassword/)
  assert.match(sql, /security definer/i)
  assert.match(sql, /if not public\.is_admin\(\)/i)
  assert.match(sql, /update auth\.users as target/i)
  assert.match(sql, /email_confirmed_at/i)
  assert.match(sql, /revoke all on function public\.approve_account\(uuid\)/i)
  assert.match(sql, /where ext\.extname = 'pgcrypto'/i)
  assert.match(sql, /encrypted_password = %1\$I\.crypt\(%2\$L/i)
  assert.match(sql, /'demo1234'/i)
})
