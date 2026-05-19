import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
const now = new Date()
const calver = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(calver),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.worktrees/**'],
    testTimeout: 15000,
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
})
