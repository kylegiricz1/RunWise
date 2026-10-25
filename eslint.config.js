const expoConfig = require('eslint-config-expo/flat');

const tsPlugin = expoConfig.find((c) => c.plugins && c.plugins['@typescript-eslint'])?.plugins['@typescript-eslint'];
const reactPlugin = expoConfig.find((c) => c.plugins && c.plugins.react)?.plugins.react;
const reactHooksPlugin = expoConfig.find((c) => c.plugins && c.plugins['react-hooks'])?.plugins['react-hooks'];

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/**', 'scripts/**', 'node_modules/**', '.expo/**', '__tests__/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    plugins: {
      ...(tsPlugin ? { '@typescript-eslint': tsPlugin } : {}),
      ...(reactPlugin ? { react: reactPlugin } : {}),
      ...(reactHooksPlugin ? { 'react-hooks': reactHooksPlugin } : {}),
    },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },
];
