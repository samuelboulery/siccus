import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', '_legacy', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      /* PRD §10, piège n°1 — le déterminisme casse SILENCIEUSEMENT.
         L'instance rng est passée en paramètre, jamais tirée du global. */
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            "Math.random() est interdit dans Siccus. Utiliser l'instance rng passée en paramètre (voir src/generator/rng.ts).",
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'crypto', message: 'Source non déterministe. Utiliser rng.' },
      ],
    },
  },
)
