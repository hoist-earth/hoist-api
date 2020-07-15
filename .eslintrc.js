module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    browser: false,
    commonjs: true,
    es6: true,
  },
  plugins: ["@typescript-eslint", "jest"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "never"],
  },
}
