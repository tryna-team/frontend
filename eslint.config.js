import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 전용 props를 DOM에 전달하지 않으려고 빼내는 `const { size, ...rest } = props` 패턴 허용
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // shadcn 컴포넌트(src/components/ui)는 내부에서 ui/button을 사용할 수 있음
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/Button/*', '**/components/Button/*/*'],
              message: "버튼은 배럴 파일('@/components/Button')에서 import하세요.",
            },
            {
              group: ['@/components/ui/button'],
              message: '디자인 시스템 버튼(@/components/Button)을 사용하세요.',
            },
          ],
        },
      ],
    },
  },
])
