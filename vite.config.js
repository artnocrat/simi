import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // When running `vercel dev`, API routes run on 3000 too; no proxy needed.
      // When running plain `npm run dev`, use `vercel dev` separately or mock.
    }
  }
})
