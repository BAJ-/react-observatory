import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { plugin: './src/plugin/index.ts' },
  outDir: './dist',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  dts: { build: true },
  clean: true,
  external: ['typescript', 'vite'],
})
