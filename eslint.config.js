const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', 'backend/node_modules/**', 'backend/dist/**', '.expo/**', 'expo-env.d.ts'],
  },
];
