import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Cargar datos al montar una pantalla (useEffect -> pedir al API -> setState)
      // es un patron valido de React. Esta regla nueva lo marca como error aunque
      // el setState ocurra despues del await, asi que se desactiva.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
