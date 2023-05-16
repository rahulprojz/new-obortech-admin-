module.exports = {
    parser: 'babel-eslint',
    extends: ['airbnb', 'plugin:prettier/recommended'],
    env: {
        browser: true,
        jest: true,
    },
    plugins: ['react', 'jsx-a11y', 'import', 'prettier'],
    rules: {
        'react/prop-types': 0,
        'max-len': ['error', 1000],
        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-mixed-operators': 'off',
        'array-callback-return': 'off',
        'prefer-destructuring': [
            'error',
            {
                VariableDeclarator: {
                    array: false,
                    object: true,
                },
                AssignmentExpression: {
                    array: true,
                    object: false,
                },
            },
            {
                enforceForRenamedProperties: false,
            },
        ],
        'import/prefer-default-export': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/jsx-one-expression-per-line': [0],
        'react/jsx-indent': ['error', 4],
        'jsx-a11y/label-has-associated-control': 'off',
        'react/jsx-indent-props': ['error', 4],
        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                trailingComma: 'all',
                arrowParens: 'always',
                printWidth: 300,
                tabWidth: 4,
                semi: false,
                jsxSingleQuote: true,
                endOfLine: 'auto',
            },
        ],
        camelcase: ['error'],
        indent: ['error', 4],
    },
}
