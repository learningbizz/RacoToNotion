module.exports = {
    root: true,
    env: {
        browser: false,
        node: true
    },
    extends: ['prettier', 'plugin:prettier/recommended'],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 2018
    },
    rules: {
        'prettier/prettier': [
            'error',
            {
                endOfLine: 'auto'
            }
        ]
    }
};
