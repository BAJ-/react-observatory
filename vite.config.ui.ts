import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Build config for the Observatory UI.
 * Produces static assets in dist/client/ that the plugin serves at /__observatory.
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
})
