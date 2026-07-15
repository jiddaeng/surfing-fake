import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8')

test('production deployment disables localStorage demo authentication and sets browser defenses', async () => {
  const [render, supabaseClient, index] = await Promise.all([
    read('render.yaml'),
    read('src/lib/supabase.ts'),
    read('index.html'),
  ])
  assert.match(render, /VITE_DEMO_MODE\s*\r?\n\s*value: "false"/)
  assert.match(render, /Content-Security-Policy/)
  assert.match(render, /Cache-Control\s*\r?\n\s*value: "no-store, no-cache, must-revalidate, max-age=0"/)
  assert.match(render, /frame-ancestors 'none'/)
  assert.match(render, /X-Content-Type-Options/)
  assert.match(supabaseClient, /\['localhost', '127\.0\.0\.1', '::1'\]/)
  assert.doesNotMatch(index, /<script>[^]*localStorage/)
})

test('normal migrations cannot run the destructive demo seed', async () => {
  const migrationDirectory = path.join(root, 'supabase', 'migrations')
  const migrationFiles = (await readdir(migrationDirectory)).filter((name) => name.endsWith('.sql'))
  const migrations = (await Promise.all(migrationFiles.map((name) => readFile(path.join(migrationDirectory, name), 'utf8')))).join('\n')
  assert.doesNotMatch(migrations, /delete\s+from\s+public\.applications/i)
  assert.doesNotMatch(migrations, /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+all\s+tables/i)
  assert.match(await read('supabase/demo_seed.sql'), /운영 데이터베이스에서는 절대 실행하지 마세요/)
})

test('database migration contains the critical authorization invariants', async () => {
  const sql = await read('supabase/migrations/003_security_hardening.sql')
  assert.equal((sql.match(/\$\$/g) ?? []).length % 2, 0, 'unbalanced SQL dollar quotes')
  assert.match(sql, /^begin;[^]*commit;\s*$/m)
  for (const definition of sql.split(/create or replace function/i).slice(1)) {
    const body = definition.split(/\$\$/)[0]
    if (/security definer/i.test(body)) assert.match(body, /set\s+search_path\s*=\s*''/i)
  }
  assert.match(sql, /new\.status\s+in\s+\('accepted',\s*'rejected'\)/)
  assert.match(sql, /q\.id\s*=\s*question_id\s+and\s+q\.club_id\s*=\s*a\.club_id/i)
  assert.match(sql, /for\s+update;/i)
  assert.match(sql, /grant\s+update\s*\(read\)\s+on\s+public\.notifications/i)
  assert.match(sql, /allowed_mime_types\s*=\s*array\['image\/jpeg',\s*'image\/png',\s*'image\/webp'\]/i)
  assert.doesNotMatch(sql, /image\/svg\+xml'\]/i)
})
