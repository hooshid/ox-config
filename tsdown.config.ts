import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/lint.ts', 'src/format.ts'],
  format: ['esm'],
  dts: { eager: true },
  clean: true,
  sourcemap: true,
  target: 'es2022',
  treeshake: true,
  publint: true,
  unused: false,
})