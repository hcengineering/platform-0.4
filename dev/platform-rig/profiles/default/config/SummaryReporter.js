// @ts-check
const { SummaryReporter } = require('@jest/reporters');

class FixedSummaryReporter extends SummaryReporter {
  log(message) {
    process.stdout.write(`${message}\n`);
  }

  /**
   * @param { import('@jest/reporters').AggregatedResult } results
   */
  onRunComplete(contexts, results) {
    const origLog = this.log;
    try {
      if (results.numFailedTests + results.numRuntimeErrorTestSuites > 0) {
        this.log = (message) => process.stderr.write(`${message}\n`);
      }
      return super.onRunComplete(...arguments);
    } finally {
      this.log = origLog;
    }
  }
}

module.exports = FixedSummaryReporter;