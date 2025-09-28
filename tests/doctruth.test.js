/**
 * Basic tests for DocTruth
 * These tests verify core functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DocTruth = require('../src/index');

describe('DocTruth', () => {
  const testConfigPath = path.join(__dirname, 'test.doctruth.yml');
  const testOutputPath = path.join(__dirname, 'test-output.md');

  beforeEach(() => {
    // Clean up any previous test files
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  test('should create instance', () => {
    const doctruth = new DocTruth();
    expect(doctruth).toBeDefined();
    expect(doctruth.options.format).toBe('markdown');
  });

  test('should run simple command', () => {
    const doctruth = new DocTruth();
    const output = doctruth.runCommand('echo "test"');
    expect(output).toBe('test');
  });

  test('should handle command timeout', () => {
    const doctruth = new DocTruth({ timeout: 1 });
    // Use a command that works on both Windows and Unix
    // Pass timeout in seconds (will be converted to ms internally)
    const output = doctruth.runCommand('node -e "setTimeout(() => {}, 5000)"', 1);
    expect(output).toContain('[TIMEOUT');
  });

  test('should handle command failure', () => {
    const doctruth = new DocTruth();
    const output = doctruth.runCommand('exit 42');
    expect(output).toContain('[EXIT CODE: 42]');
  });

  test('should generate default config', () => {
    const doctruth = new DocTruth();
    const config = doctruth.getDefaultConfig();

    expect(config.version).toBe(1);
    expect(config.truth_sources).toBeDefined();
    expect(config.truth_sources.length).toBeGreaterThan(0);
  });

  test('should auto-detect Node.js project', () => {
    // Create a fake package.json
    const fakePackageJson = path.join(__dirname, 'package.json');
    fs.writeFileSync(fakePackageJson, '{"name": "test"}');

    const doctruth = new DocTruth();
    const config = doctruth.autoDetectConfig();

    // Should have Node.js specific sources
    const nodeSource = config.truth_sources.find(s => s.name === 'Node Version');
    expect(nodeSource).toBeDefined();

    // Clean up
    fs.unlinkSync(fakePackageJson);
  });

  test('should generate markdown output', () => {
    const doctruth = new DocTruth();
    doctruth.results = {
      meta: {
        project: 'Test',
        generated: new Date().toISOString(),
        generationTime: '1s'
      },
      sources: [
        {
          name: 'Test Source',
          command: 'echo test',
          output: 'test output',
          essential: false
        }
      ]
    };

    const markdown = doctruth.toMarkdown();
    expect(markdown).toContain('# Test - Current Truth');
    expect(markdown).toContain('Test Source');
    expect(markdown).toContain('test output');
  });

  test('should generate JSON output', () => {
    const doctruth = new DocTruth();
    doctruth.results = {
      meta: {
        project: 'Test',
        generated: new Date().toISOString()
      }
    };

    const json = doctruth.toJSON();
    const parsed = JSON.parse(json);
    expect(parsed.meta.project).toBe('Test');
  });

  test('should escape HTML properly', () => {
    const doctruth = new DocTruth();
    const escaped = doctruth.escapeHtml('<script>alert("xss")</script>');
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('should evaluate validation correctly', () => {
    const doctruth = new DocTruth();

    // Test pass conditions
    expect(doctruth.evaluateValidation('✓ Success', {})).toBe(true);
    expect(doctruth.evaluateValidation('✔ OK', {})).toBe(true);
    expect(doctruth.evaluateValidation('PASS', {})).toBe(true);

    // Test fail conditions
    expect(doctruth.evaluateValidation('✗ Failed', {})).toBe(false);
    expect(doctruth.evaluateValidation('FAIL', {})).toBe(false);
    expect(doctruth.evaluateValidation('[ERROR: Something]', {})).toBe(false);
  });

  test('should detect errors in output', () => {
    const doctruth = new DocTruth();

    expect(doctruth.isError('[ERROR: test]')).toBe(true);
    expect(doctruth.isError('[TIMEOUT: test]')).toBe(true);
    expect(doctruth.isError('command not found')).toBe(true);
    expect(doctruth.isError('Permission denied')).toBe(true);
    expect(doctruth.isError('Fatal: error')).toBe(true);

    expect(doctruth.isError('Normal output')).toBe(false);
    expect(doctruth.isError('Success')).toBe(false);
  });

  test('should merge configs correctly', () => {
    const doctruth = new DocTruth();

    const base = {
      version: 1,
      sources: ['a', 'b'],
      meta: { timeout: 10 }
    };

    const override = {
      version: 2,
      sources: ['c'],
      meta: { timeout: 20, new: true }
    };

    const merged = doctruth.mergeConfigs(base, override);

    expect(merged.version).toBe(2);
    expect(merged.sources).toEqual(['a', 'b', 'c']);
    expect(merged.meta.timeout).toBe(20);
    expect(merged.meta.new).toBe(true);
  });
});

// Integration test
describe('DocTruth CLI', () => {
  const cliPath = path.join(__dirname, '..', 'bin', 'doctruth.js');

  test('should show version', () => {
    // Use quotes to handle spaces in path
    const output = execSync(`node "${cliPath}" --version`, { encoding: 'utf8' });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  test('should show help', () => {
    // Use quotes to handle spaces in path
    const output = execSync(`node "${cliPath}" --help`, { encoding: 'utf8' });
    expect(output).toContain('Universal Documentation Truth System');
    expect(output).toContain('--init');
    expect(output).toContain('--check');
    expect(output).toContain('--watch');
  });
});