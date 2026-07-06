// sb-keys.json(임시) → .env.local 생성. 1회용 세팅 스크립트.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const raw = readFileSync(join(process.env.TEMP, 'sb-keys.json'), 'utf8').replace(/^﻿/, '')
const keys = JSON.parse(raw)
const anon = keys.find((k) => k.name === 'anon').api_key
const service = keys.find((k) => k.name === 'service_role').api_key
const url = 'https://xzphfatkwkhgerellybf.supabase.co'

writeFileSync('.env.local', [
  `VITE_SUPABASE_URL=${url}`,
  `VITE_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_URL=${url}`,
  `SUPABASE_SERVICE_ROLE_KEY=${service}`,
  '',
].join('\n'))
console.log('.env.local 작성 완료')
