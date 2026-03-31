import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '#web': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
