import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')

test('leader promotion uses an admin-only database function and verifies its result', async () => {
  const [sql, context] = await Promise.all([
    read('supabase/migrations/004_leader_promotion.sql'),
    read('src/context/DataContext.tsx'),
  ])

  assert.match(sql, /security definer/i)
  assert.match(sql, /not public\.is_admin\(\)/i)
  assert.match(sql, /target\.role\s*=\s*'student'/i)
  assert.match(sql, /grant execute on function public\.promote_student_to_leader\(uuid\) to authenticated/i)
  assert.match(context, /\.rpc\('promote_student_to_leader'/)
  assert.match(context, /error\.code !== 'PGRST202'/)
  assert.match(context, /\.from\('profiles'\)[\s\S]*\.update\(\{ role: 'leader' \}\)/)
  assert.match(context, /row\.role !== 'leader'/)
})

test('demo promotion updates the account store used by the next login', async () => {
  const [auth, data, demo] = await Promise.all([
    read('src/context/AuthContext.tsx'),
    read('src/context/DataContext.tsx'),
    read('src/data/demo.ts'),
  ])

  assert.match(auth, /readDemoAccounts\(\)/)
  assert.match(data, /saveDemoAccount\(\{ \.\.\.account, role: 'leader' \}\)/)
  assert.match(demo, /DEMO_ACCOUNTS\.filter\(\(account\) => !overrides\.some/)
})
