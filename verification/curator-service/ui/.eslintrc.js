const defaultRules = ['react-app', 'eslint:recommended'];

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        browser: true,
        node: true,
        es6: true,
        jest: true,
    },
    extends: defaultRules,
    rules: {
        'no-bitwise': ['error'],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            plugins: ['@typescript-eslint'],
            extends: [
                ...defaultRules,
                'plugin:@typescript-eslint/recommended',
                'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
                'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
                'plugin:cypress/recommended',
            ],
        },
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
};
