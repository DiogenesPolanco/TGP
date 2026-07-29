import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import security from 'eslint-plugin-security'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),

  // All source: strict rules
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      security.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Relax react-hooks v7 strict rules (pre-existing violations — future cleanup)
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      // Relax pre-existing eslint:recommended rules
      'no-empty': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-useless-assignment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      // React Refresh: pre-existing violations
      'react-refresh/only-export-components': 'warn',
      // Security hardening: prevent dangerous patterns
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-bidi-characters': 'error',
    },
  },

  // Tests: override with relaxed rules (applied after, so wins for test files)
  {
    files: ['src/**/__tests__/**', 'src/**/*.test.*'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      security.configs.recommended,
    ],
    languageOptions: {
      globals: { ...globals.browser, vi: true },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'no-empty': 'off',
      'no-constant-binary-expression': 'off',
      'no-useless-assignment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Security rules still apply in tests (no bypass for dangerous patterns)
      'security/detect-bidi-characters': 'error',
    },
  },
])
