module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks',
    'unused-imports',
    'prettier'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  globals: {
    React: true,
    google: true,
    mount: true,
    mountWithRouter: true,
    shallow: true,
    shallowWithRouter: true,
    context: true,
    expect: true,
    jsdom: true,
    JSX: true
  },
  rules: {
    'react/jsx-filename-extension': [2, {extensions: ['.jsx', '.tsx']}],
    'react/jsx-props-no-spreading': ['off'],
    'jsx-a11y/label-has-associated-control': ['error', {assert: 'either'}],
    'react/jsx-indent': 'off',
    'react/jsx-indent-props': 'off',
    'react/jsx-curly-newline': 'off',
    'react/prop-types': 'off',
    'import/no-unresolved': 'off',
    'no-param-reassign': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto'
      }
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    'react-hooks/rules-of-hooks': 'error',
    'import/prefer-default-export': 'off',
    'react/function-component-definition': 'off',
    'import/extensions': 'off',
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    'react/require-default-props': 'off',
    'no-underscore-dangle': ['error', {allowAfterThis: true}],
    'no-plusplus': 'off',
    'react/jsx-no-bind': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ]
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off'
      }
    }
  ]
};
