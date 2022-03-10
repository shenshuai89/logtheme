module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended', // eslint
    'plugin:prettier/recommended', // plugin-prettier
  ],
  parserOptions: {
    parser: '@babel/eslint-parser', // 解析器
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'space-before-function-paren': ['error', 'never'],
    semi: 0,
  },
}
