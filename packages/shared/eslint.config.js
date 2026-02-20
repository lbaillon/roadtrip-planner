import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import { dirname } from 'path'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(globalIgnores(['dist']), {
  files: ['**/*.{ts}'],
  extends: [js.configs.recommended, tseslint.configs.recommended],
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: __dirname,
      project: './tsconfig.json',
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
