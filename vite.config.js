import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base는 여기서만 설정한다. 빌드 시 --base 플래그 사용 금지!
export default defineConfig({
  base: '/moveam-b2b/',
  plugins: [react()],
})
