const pkg = require('./package.json')
const { default: build } = require('@anticrm/ui-build')

build(pkg, {
  entryPoints: ['./src/index.ts'],
  outfile: './lib/index.js'
})
