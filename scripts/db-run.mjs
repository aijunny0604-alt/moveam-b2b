// SQL 파일을 DB에 직접 실행 (풀러 세션 경유)
// 사용법: node scripts/db-run.mjs supabase/migrations/002_xxx.sql
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()

const file = process.argv[2]
if (!file) { console.error('SQL 파일 경로를 지정하세요'); process.exit(1) }
const sql = readFileSync(resolve(__dirname, '..', file), 'utf8')

const client = new pg.Client({
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.xzphfatkwkhgerellybf',
  password: get('SUPABASE_DB_PASSWORD'),
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})
await client.connect()
try {
  await client.query(sql)
  console.log('SQL 실행 완료:', file)
} finally {
  await client.end()
}
