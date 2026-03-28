import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { schemaPlugin } from './src/observatory/plugins/schemaPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), schemaPlugin()],
})
