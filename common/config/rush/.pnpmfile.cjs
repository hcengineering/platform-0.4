'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.  (This feature is
 * functionally similar to Yarn's "resolutions".)
 *
 * For details, see the PNPM documentation:
 * https://pnpm.js.org/docs/en/hooks.html
 *
 * IMPORTANT: SINCE THIS FILE CONTAINS EXECUTABLE CODE, MODIFYING IT IS LIKELY TO INVALIDATE
 * ANY CACHED DEPENDENCY ANALYSIS.  After any modification to pnpmfile.js, it's recommended to run
 * "rush update --full" so that PNPM will recalculate all version selections.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

/**
 * This hook is invoked during installation before a package's dependencies
 * are selected.
 * The `packageJson` parameter is the deserialized package.json
 * contents for the package that is about to be installed.
 * The `context` parameter provides a log() function.
 * The return value is the updated object.
 */
function readPackage(pkg, context) {

  // // The karma types have a missing dependency on typings from the log4js package.
  // if (pkg.name === '@types/karma') {
  //  context.log('Fixed up dependencies for @types/karma');
  //  pkg.dependencies['log4js'] = '0.6.38';
  // }

  // Installation script of ws 0.4.32 does some weird things as the result other
  // packages could be affected by its output, specifically @babel/types
  // This ws version is kurento-client dependency
  if (pkg.name === 'websocket-stream' && pkg.version.startsWith('0.')) {
    context.log('Fix outdated ws dependency version')
    pkg.dependencies.ws = '1.1.5';
  }

  return pkg;
}
