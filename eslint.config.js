import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// 공통 컴포넌트는 배럴 파일을 거쳐서만 import한다 (내부 구조를 바꿔도 사용처에 영향이 없도록)
const barrelImportPatterns = [
  {
    group: ['@/components/Button/*', '**/components/Button/*/*'],
    message: "버튼은 배럴 파일('@/components/Button')에서 import하세요.",
  },
  {
    group: ['@/components/BottomSheet/*', '**/components/BottomSheet/*/*'],
    message: "바텀시트는 배럴 파일('@/components/BottomSheet')에서 import하세요.",
  },
  {
    group: ['@/components/Popup/*', '**/components/Popup/*/*'],
    message: "팝업은 배럴 파일('@/components/Popup')에서 import하세요.",
  },
  {
    // 컴포넌트끼리 공유하는 내부 코드(스타일 상수 등). 컴포넌트 안에서는 상대 경로(../shared)로 사용
    group: ['@/components/shared/*', '**/components/shared/*'],
    message: 'components/shared는 컴포넌트 내부 공통 코드입니다. 화면에서는 각 컴포넌트를 사용하세요.',
  },
  {
    group: ['@/components/ui/button'],
    message: '디자인 시스템 버튼(@/components/Button)을 사용하세요.',
  },
]

// Radix Dialog는 바텀시트 기본 컴포넌트(BottomSheet 폴더 바로 아래 파일)와 Popup 폴더 안에서만 사용한다.
// 바텀시트 구현을 바꿀 때(예: 끌어내려 닫기용 vaul) 교체 지점을 한 곳으로 유지하고,
// 화면에서 Dialog를 직접 써서 BottomSheet의 모바일 대응(키보드·하단 여백)을 건너뛰지 않도록 막는다.
// (BottomSheet/Setting·Content의 개별 시트도 Dialog 대신 BottomSheet 컴포넌트를 사용)
const dialogImportMessage =
  "바텀시트·모달은 '@/components/BottomSheet' 또는 '@/components/Popup'의 컴포넌트를 사용하세요."
const dialogAllowedFiles = [
  'src/components/BottomSheet/*.{ts,tsx}',
  'src/components/Popup/**/*.{ts,tsx}',
]

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
    // shadcn 컴포넌트(src/components/ui)는 내부에서 ui/button·Dialog를 사용할 수 있음
    // Dialog 허용 파일은 아래 설정에서 Dialog 제한 없이 배럴 규칙만 적용
    ignores: ['src/components/ui/**', ...dialogAllowedFiles],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'radix-ui', importNames: ['Dialog'], message: dialogImportMessage }],
          patterns: [
            ...barrelImportPatterns,
            { group: ['@radix-ui/react-dialog'], message: dialogImportMessage },
          ],
        },
      ],
    },
  },
  {
    files: dialogAllowedFiles,
    rules: {
      'no-restricted-imports': ['error', { patterns: barrelImportPatterns }],
    },
  },
])
