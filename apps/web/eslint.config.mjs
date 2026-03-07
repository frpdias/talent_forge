import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  // Ignora arquivos JS de config que usam CommonJS (require/module.exports)
  {
    ignores: [
      'jest.config.js',
      'jest.setup.js',
      'scripts/**/*.js',
      'public/**/*.js',
      '*.config.js',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // as any é aceitável até termos tipos gerados do Supabase (supabase gen types)
      '@typescript-eslint/no-explicit-any': 'warn',
      // hooks deps — warnings, não erros de runtime
      'react-hooks/exhaustive-deps': 'warn',
      // prefer-const e entities — downgrade para warn, corrigir progressivamente
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
      // variáveis não utilizadas — downgrade para warn (corrigir progressivamente)
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
    },
  },
];

export default eslintConfig;
