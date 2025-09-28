#!/usr/bin/env node

/**
 * DocTruth CLI - Universal Documentation Truth System
 *
 * Never lie about your documentation again
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const DocTruth = require('../src/index');
const { version } = require('../package.json');

// CLI Configuration
program
  .name('doctruth')
  .description('Universal Documentation Truth System')
  .version(version)
  .option('-c, --config <path>', 'Path to config file', '.doctruth.yml')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <type>', 'Output format (markdown|json|html)', 'markdown')
  .option('--check', 'Check if truth has changed (exit 1 if changed)')
  .option('--watch', 'Watch for changes and regenerate')
  .option('--init', 'Initialize a new .doctruth.yml config')
  .option('--preset <name>', 'Use a preset configuration')
  .option('--verbose', 'Verbose output')
  .option('--silent', 'Silent mode - no console output')
  .option('--no-color', 'Disable colored output')
  .option('--timeout <seconds>', 'Command timeout in seconds', '10')
  .option('--fail-on-error', 'Exit with error if any command fails')
  .option('--diff', 'Show diff when checking changes')
  .parse(process.argv);

const options = program.opts();

// Handle --init flag
if (options.init) {
  const doctruth = new DocTruth();
  doctruth.initConfig(options.preset);
  process.exit(0);
}

// Main execution
async function main() {
  try {
    const doctruth = new DocTruth(options);

    // Load configuration
    await doctruth.loadConfig();

    if (options.check) {
      // Check mode - compare with existing
      const hasChanged = await doctruth.check(options.diff);
      if (!options.silent) {
        if (hasChanged) {
          console.log('⚠️  Truth has changed - documentation may be outdated');
        } else {
          console.log('✅ Truth unchanged - documentation is up to date');
        }
      }
      process.exit(hasChanged ? 1 : 0);
    } else if (options.watch) {
      // Watch mode - regenerate on changes
      await doctruth.watch();
    } else {
      // Normal mode - generate truth
      await doctruth.generate();

      if (!options.silent) {
        console.log(`✅ Truth generated successfully`);
        if (doctruth.errors.length > 0) {
          console.log(`⚠️  ${doctruth.errors.length} warnings encountered`);
        }
      }

      if (options.failOnError && doctruth.errors.length > 0) {
        process.exit(1);
      }
    }
  } catch (error) {
    if (!options.silent) {
      console.error(`❌ Error: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

// Run the CLI
main();