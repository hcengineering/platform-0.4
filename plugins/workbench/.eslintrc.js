module.exports = {
  extends: ['./node_modules/@anticrm/platform-rig/profiles/default/config/eslint.config.json'],
  parserOptions: { tsconfigRootDir: __dirname },
  settings: {
    'svelte3/ignore-styles': () => true
  }
}