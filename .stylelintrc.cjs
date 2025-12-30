/** @type {import("stylelint").Config} */
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
  plugins: ['stylelint-order'],
  rules: {
    'comment-empty-line-before': null,
    'at-rule-no-unknown': null,
    'selector-class-pattern': null,
    'import-notation': null,
  },
  allowEmptyInput: true,
  ignoreFiles: ['node_modules/**/*', 'out/**/*', '.next/**/*', 'playwright-report/**/*'],
};
