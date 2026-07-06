import { createClient } from '@supabase/supabase-js'
import { mockClient } from './mock'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// 백엔드 없이 화면 확인용 — DEV 전용 가드라 프로덕션 빌드엔 절대 포함되지 않는다
const useMock = import.meta.env.DEV && import.meta.env.VITE_MOCK === '1'

export const isConfigured = useMock || Boolean(url && anonKey)

export const supabase = useMock ? mockClient : isConfigured ? createClient(url, anonKey) : null
