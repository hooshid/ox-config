import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [
    // توجه: از خود پکیج import نمی‌کنیم چون پکیج در حال develop است
    // از oxlint خام استفاده می‌کنیم
  ],
  ignorePatterns: ['dist/**', 'node_modules/**', '.changeset/**'],
  rules: {
    'typescript/consistent-type-imports': 'error',
    'no-unused-vars': 'off',
    'typescript/no-unused-vars': 'error',
  },
})