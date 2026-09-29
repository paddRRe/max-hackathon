import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served under a sub-path (bot static / mini-app container), not domain root.
  base: './',
  plugins: [react()],
})
