import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: { port: 3000 },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
