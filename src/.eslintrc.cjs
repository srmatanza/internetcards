module.exports = {
    "env": {
        "browser": true,
        "es2020": true
    },
    "extends": "plugin:vue/essential",
    "parserOptions": {
        "ecmaVersion": 11,
        "sourceType": "module"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
        "keyword-spacing": "off",
        "space-infix-ops": "off",
        "space-before-function-paren": ["error", "never"]
    }
};
