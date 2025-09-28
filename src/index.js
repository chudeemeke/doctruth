/**
 * DocTruth - Universal Documentation Truth System
 * Main module that handles truth generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const chalk = require('chalk');
const chokidar = require('chokidar');

class DocTruth {
  constructor(options = {}) {
    this.options = {
      config: '.doctruth.yml',
      output: null,
      format: 'markdown',
      verbose: false,
      silent: false,
      timeout: 10,
      failOnError: false,
      ...options
    };

    // Disable colors if requested
    if (options.noColor) {
      chalk.level = 0;
    }

    this.configPath = this.options.config;
    this.config = null;
    this.results = {};
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
  }

  log(message, level = 'info') {
    if (this.options.silent) return;

    const prefix = {
      info: chalk.blue('ℹ'),
      success: chalk.green('✓'),
      warning: chalk.yellow('⚠'),
      error: chalk.red('✗'),
      debug: chalk.gray('→')
    };

    if (level === 'debug' && !this.options.verbose) return;

    console.log(`${prefix[level] || ''} ${message}`);
  }

  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf8');
        this.config = yaml.load(configContent);

        // Handle preset extension
        if (this.config.extends) {
          await this.extendPreset(this.config.extends);
        }

        // Override output if specified in CLI
        if (this.options.output) {
          this.config.output = this.options.output;
        }

        this.log(`Loaded configuration from ${this.configPath}`, 'success');
      } else {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }
    } catch (error) {
      if (this.options.init) {
        // Will be handled by initConfig
        return;
      }
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  async extendPreset(presetName) {
    const presetPaths = [
      path.join(__dirname, '..', 'presets', `${presetName}.yml`),
      path.join(process.cwd(), 'node_modules', 'doctruth', 'presets', `${presetName}.yml`),
      path.join(process.cwd(), '.doctruth', 'presets', `${presetName}.yml`)
    ];

    for (const presetPath of presetPaths) {
      if (fs.existsSync(presetPath)) {
        const presetContent = fs.readFileSync(presetPath, 'utf8');
        const preset = yaml.load(presetContent);

        // Merge preset with current config (current config takes precedence)
        this.config = this.mergeConfigs(preset, this.config);
        this.log(`Extended preset: ${presetName}`, 'debug');
        return;
      }
    }

    this.log(`Preset not found: ${presetName}`, 'warning');
  }

  mergeConfigs(base, override) {
    const merged = { ...base };

    for (const key in override) {
      if (override[key] === null) continue;

      if (Array.isArray(override[key])) {
        // For arrays, concatenate unless it's a replacement (starts with '!')
        if (override[key][0] === '!replace') {
          merged[key] = override[key].slice(1);
        } else {
          merged[key] = [...(base[key] || []), ...override[key]];
        }
      } else if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
        // Recursively merge objects
        merged[key] = this.mergeConfigs(base[key] || {}, override[key]);
      } else {
        // Simple replacement for primitives
        merged[key] = override[key];
      }
    }

    return merged;
  }

  runCommand(command, timeout = null) {
    const actualTimeout = (timeout || this.options.timeout) * 1000;

    try {
      this.log(`Running: ${command}`, 'debug');

      // Platform-specific handling
      const isWindows = process.platform === 'win32';
      const options = {
        encoding: 'utf8',
        timeout: actualTimeout,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
      };

      // Use appropriate shell
      if (isWindows) {
        options.shell = 'cmd.exe';
      } else {
        options.shell = '/bin/bash';
      }

      const output = execSync(command, options);
      return output.trim();
    } catch (error) {
      const errorInfo = this.formatCommandError(error, command, actualTimeout);

      if (this.options.failOnError) {
        throw new Error(`Command failed: ${command}\n${errorInfo}`);
      }

      return errorInfo;
    }
  }

  formatCommandError(error, command, timeout) {
    if (error.code === 'ETIMEDOUT') {
      return `[TIMEOUT: Command exceeded ${timeout/1000}s]`;
    }

    if (error.signal) {
      return `[KILLED: Signal ${error.signal}]`;
    }

    if (error.status) {
      // Try to get any output
      const stdout = error.stdout ? error.stdout.toString().trim() : '';
      const stderr = error.stderr ? error.stderr.toString().trim() : '';

      if (stdout) return stdout;
      if (stderr) return `[STDERR: ${stderr}]`;
      return `[EXIT CODE: ${error.status}]`;
    }

    return `[ERROR: ${error.message}]`;
  }

  async generate() {
    this.startTime = Date.now();
    this.errors = [];
    this.results = {
      meta: {
        generated: new Date().toISOString(),
        version: this.config.version || 1,
        project: this.config.project || path.basename(process.cwd())
      }
    };

    // Process different sections
    await this.processSources();
    await this.processValidations();
    await this.processExamples();
    await this.processBenchmarks();
    await this.processPlatform();

    this.endTime = Date.now();
    this.results.meta.generationTime = `${(this.endTime - this.startTime) / 1000}s`;

    // Save the output
    await this.save();
  }

  async processSources() {
    if (!this.config.truth_sources) return;

    this.log('Collecting truth sources...', 'info');
    this.results.sources = [];

    for (const source of this.config.truth_sources) {
      this.log(`  ${source.name}`, 'debug');

      const output = this.runCommand(
        source.command,
        source.timeout || this.config.meta?.timeout_seconds
      );

      const result = {
        name: source.name,
        command: source.command,
        output: output,
        essential: source.essential || false,
        category: source.category || 'general'
      };

      this.results.sources.push(result);

      // Check for errors in essential sources
      if (source.essential && this.isError(output)) {
        this.errors.push({
          type: 'essential',
          source: source.name,
          message: output
        });
      }
    }
  }

  async processValidations() {
    if (!this.config.validations) return;

    this.log('Running validations...', 'info');
    this.results.validations = [];

    for (const validation of this.config.validations) {
      const output = this.runCommand(validation.command);
      const passed = this.evaluateValidation(output, validation);

      const result = {
        name: validation.name,
        passed: passed,
        output: output,
        required: validation.required || false
      };

      this.results.validations.push(result);

      if (validation.required && !passed) {
        this.errors.push({
          type: 'validation',
          source: validation.name,
          message: `Required validation failed`
        });
      }
    }
  }

  evaluateValidation(output, validation) {
    // Check for explicit failure indicators
    if (output.includes('✗') || output.includes('✘') || output.includes('FAIL')) {
      return false;
    }

    // Check for error outputs
    if (this.isError(output)) {
      return false;
    }

    // Check for custom success pattern
    if (validation.successPattern) {
      const regex = new RegExp(validation.successPattern);
      return regex.test(output);
    }

    // Default: presence of success indicators or absence of errors
    return output.includes('✓') || output.includes('✔') ||
           output.includes('PASS') || output.includes('OK') ||
           (!this.isError(output) && output.length > 0);
  }

  async processExamples() {
    if (!this.config.working_examples) return;

    this.log('Documenting examples...', 'info');
    this.results.examples = [];

    for (const example of this.config.working_examples) {
      // Examples are usually echo commands or documentation
      const output = this.runCommand(example.command);

      this.results.examples.push({
        name: example.name,
        description: example.description || '',
        command: output.replace(/^echo\s+['"]?|['"]?$/g, '')
      });
    }
  }

  async processBenchmarks() {
    if (!this.config.benchmarks) return;

    this.log('Running benchmarks...', 'info');
    this.results.benchmarks = [];

    for (const benchmark of this.config.benchmarks) {
      const output = this.runCommand(benchmark.command);

      this.results.benchmarks.push({
        name: benchmark.name,
        value: output,
        unit: benchmark.unit || ''
      });
    }
  }

  async processPlatform() {
    if (!this.config.platform) return;

    this.log('Collecting platform info...', 'info');
    this.results.platform = [];

    for (const item of this.config.platform) {
      const output = this.runCommand(item.command);

      this.results.platform.push({
        name: item.name,
        value: output
      });
    }
  }

  isError(output) {
    if (!output) return false;

    const errorPatterns = [
      /^\[ERROR/,
      /^\[TIMEOUT/,
      /^\[KILLED/,
      /^\[EXIT CODE/,
      /^\[STDERR/,
      /command not found/i,
      /no such file/i,
      /permission denied/i,
      /cannot find/i,
      /fatal:/i
    ];

    return errorPatterns.some(pattern => pattern.test(output));
  }

  async save() {
    const outputPath = this.config.output || this.options.output || 'CURRENT_TRUTH.md';

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content;
    switch (this.options.format) {
      case 'json':
        content = this.toJSON();
        break;
      case 'html':
        content = this.toHTML();
        break;
      default:
        content = this.toMarkdown();
    }

    fs.writeFileSync(outputPath, content, 'utf8');

    this.log(`Truth saved to ${outputPath}`, 'success');

    const stats = fs.statSync(outputPath);
    this.log(`File size: ${(stats.size / 1024).toFixed(1)}KB`, 'debug');
  }

  toMarkdown() {
    const md = [];
    const meta = this.results.meta;

    // Header
    md.push(`# ${meta.project} - Current Truth`);
    md.push(`Generated: ${meta.generated}`);
    md.push(`Generation Time: ${meta.generationTime}`);
    md.push('');

    // Errors/Warnings
    if (this.errors.length > 0) {
      md.push('## ⚠️ Warnings');
      for (const error of this.errors) {
        md.push(`- **${error.type}**: ${error.source} - ${error.message}`);
      }
      md.push('');
    }

    // Status Summary
    if (this.results.validations) {
      const passed = this.results.validations.filter(v => v.passed).length;
      const total = this.results.validations.length;
      md.push(`## Status: ${passed}/${total} validations passed`);
      md.push('');
    }

    // Truth Sources
    if (this.results.sources) {
      md.push('## Project State');
      md.push('');

      // Group by category if categories exist
      const categories = {};
      for (const source of this.results.sources) {
        const cat = source.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(source);
      }

      for (const [category, sources] of Object.entries(categories)) {
        if (Object.keys(categories).length > 1) {
          md.push(`### ${category}`);
          md.push('');
        }

        for (const source of sources) {
          md.push(`#### ${source.name}${source.essential ? ' [ESSENTIAL]' : ''}`);
          md.push('```bash');
          md.push(`$ ${source.command}`);

          if (source.output) {
            const lines = source.output.split('\n');
            const maxLines = 100;

            if (lines.length > maxLines) {
              md.push(lines.slice(0, maxLines).join('\n'));
              md.push(`\n... (${lines.length - maxLines} more lines truncated)`);
            } else {
              md.push(source.output);
            }
          }

          md.push('```');
          md.push('');
        }
      }
    }

    // Validations
    if (this.results.validations && this.results.validations.length > 0) {
      md.push('## Validation Results');
      md.push('');
      md.push('| Status | Validation | Result | Required |');
      md.push('|--------|------------|--------|----------|');

      for (const validation of this.results.validations) {
        const status = validation.passed ? '✅' : '❌';
        const required = validation.required ? 'Yes' : 'No';
        const output = validation.output.replace(/\|/g, '\\|').substring(0, 50);
        md.push(`| ${status} | ${validation.name} | ${output} | ${required} |`);
      }
      md.push('');
    }

    // Examples
    if (this.results.examples && this.results.examples.length > 0) {
      md.push('## Working Examples');
      md.push('');
      md.push('```bash');
      for (const example of this.results.examples) {
        md.push(`# ${example.name}`);
        if (example.description) {
          md.push(`# ${example.description}`);
        }
        md.push(example.command);
        md.push('');
      }
      md.push('```');
      md.push('');
    }

    // Benchmarks
    if (this.results.benchmarks && this.results.benchmarks.length > 0) {
      md.push('## Performance Metrics');
      md.push('');
      md.push('| Metric | Value |');
      md.push('|--------|-------|');
      for (const benchmark of this.results.benchmarks) {
        const value = benchmark.value + (benchmark.unit ? ` ${benchmark.unit}` : '');
        md.push(`| ${benchmark.name} | ${value} |`);
      }
      md.push('');
    }

    // Platform
    if (this.results.platform && this.results.platform.length > 0) {
      md.push('## Environment');
      md.push('');
      for (const item of this.results.platform) {
        md.push(`- **${item.name}**: ${item.value}`);
      }
      md.push('');
    }

    // Footer
    md.push('---');
    md.push('*Generated by [DocTruth](https://github.com/yourusername/doctruth) - The Universal Documentation Truth System*');
    md.push(`*Config: ${this.configPath}*`);

    return md.join('\n');
  }

  toJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  toHTML() {
    // Simple HTML output - can be enhanced with templates
    const html = [];

    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push(`  <title>${this.results.meta.project} - Current Truth</title>`);
    html.push('  <style>');
    html.push('    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }');
    html.push('    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }');
    html.push('    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }');
    html.push('    .success { color: #28a745; }');
    html.push('    .error { color: #dc3545; }');
    html.push('    .warning { color: #ffc107; }');
    html.push('    table { width: 100%; border-collapse: collapse; }');
    html.push('    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');
    html.push('  <div class="container">');

    // Convert markdown to HTML (simplified)
    const markdown = this.toMarkdown();
    const lines = markdown.split('\n');
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          html.push('<pre><code>');
        } else {
          html.push('</code></pre>');
        }
      } else if (inCodeBlock) {
        html.push(this.escapeHtml(line));
      } else if (line.startsWith('# ')) {
        html.push(`<h1>${this.escapeHtml(line.substring(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        html.push(`<h2>${this.escapeHtml(line.substring(3))}</h2>`);
      } else if (line.startsWith('### ')) {
        html.push(`<h3>${this.escapeHtml(line.substring(4))}</h3>`);
      } else if (line.startsWith('- ')) {
        html.push(`<li>${this.escapeHtml(line.substring(2))}</li>`);
      } else if (line.trim() === '') {
        html.push('<br>');
      } else {
        html.push(`<p>${this.escapeHtml(line)}</p>`);
      }
    }

    html.push('  </div>');
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  async check(showDiff = false) {
    const outputPath = this.config.output || this.options.output || 'CURRENT_TRUTH.md';

    if (!fs.existsSync(outputPath)) {
      this.log('No previous truth file found', 'warning');
      return true; // Changed (needs generation)
    }

    // Generate new content
    await this.generate();
    const newContent = fs.readFileSync(outputPath, 'utf8');

    // Read old content
    const oldPath = outputPath + '.old';
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, oldPath);
    }

    const oldContent = fs.readFileSync(oldPath, 'utf8');

    // Clean up
    fs.unlinkSync(oldPath);

    if (oldContent === newContent) {
      return false; // No changes
    }

    if (showDiff) {
      this.showDiff(oldContent, newContent);
    }

    return true; // Changed
  }

  showDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    console.log('\nDifferences found:');
    console.log('==================\n');

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i] !== undefined) {
          console.log(chalk.red(`- ${oldLines[i]}`));
        }
        if (newLines[i] !== undefined) {
          console.log(chalk.green(`+ ${newLines[i]}`));
        }
      }
    }
  }

  async watch() {
    this.log('Watching for changes... (Press Ctrl+C to stop)', 'info');

    // Initial generation
    await this.generate();

    // Set up file watcher
    const watchPaths = [
      'lib', 'src', 'bin', 'test', 'tests',
      'package.json', this.configPath,
      ...this.config.watch_paths || []
    ].filter(p => fs.existsSync(p));

    const watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/CURRENT_TRUTH*',
        '**/.doctruth/**'
      ]
    });

    watcher.on('all', async (event, filepath) => {
      this.log(`Change detected: ${event} ${filepath}`, 'info');
      await this.generate();
    });

    // Keep process alive
    process.stdin.resume();
  }

  initConfig(preset = null) {
    const configPath = '.doctruth.yml';

    if (fs.existsSync(configPath)) {
      this.log(`Config already exists: ${configPath}`, 'warning');
      return;
    }

    let config;

    if (preset) {
      // Try to load preset
      const presetPath = path.join(__dirname, '..', 'presets', `${preset}.yml`);
      if (fs.existsSync(presetPath)) {
        const presetContent = fs.readFileSync(presetPath, 'utf8');
        config = yaml.load(presetContent);
        this.log(`Using preset: ${preset}`, 'success');
      } else {
        this.log(`Preset not found: ${preset}`, 'warning');
        config = this.getDefaultConfig();
      }
    } else {
      // Auto-detect project type and generate appropriate config
      config = this.autoDetectConfig();
    }

    // Save config
    const yamlStr = yaml.dump(config, { indent: 2, lineWidth: 120 });
    fs.writeFileSync(configPath, yamlStr, 'utf8');

    this.log(`Created ${configPath}`, 'success');
    this.log('Edit this file to customize your truth sources', 'info');
  }

  autoDetectConfig() {
    const config = this.getDefaultConfig();

    // Detect project type and add appropriate sources
    if (fs.existsSync('package.json')) {
      // Node.js project
      config.truth_sources.push(
        {
          name: 'Node Version',
          command: 'node --version',
          essential: true
        },
        {
          name: 'NPM Scripts',
          command: 'npm run 2>/dev/null | grep "  " || echo "No scripts"'
        },
        {
          name: 'Dependencies',
          command: 'npm list --depth=0 2>/dev/null | head -20'
        }
      );
    }

    if (fs.existsSync('requirements.txt') || fs.existsSync('setup.py')) {
      // Python project
      config.truth_sources.push(
        {
          name: 'Python Version',
          command: 'python --version',
          essential: true
        },
        {
          name: 'Installed Packages',
          command: 'pip list 2>/dev/null | head -20'
        }
      );
    }

    if (fs.existsSync('go.mod')) {
      // Go project
      config.truth_sources.push(
        {
          name: 'Go Version',
          command: 'go version',
          essential: true
        },
        {
          name: 'Go Modules',
          command: 'go list -m all | head -20'
        }
      );
    }

    if (fs.existsSync('Cargo.toml')) {
      // Rust project
      config.truth_sources.push(
        {
          name: 'Rust Version',
          command: 'rustc --version',
          essential: true
        },
        {
          name: 'Cargo Dependencies',
          command: 'cargo tree --depth=1 2>/dev/null | head -20'
        }
      );
    }

    return config;
  }

  getDefaultConfig() {
    return {
      version: 1,
      project: path.basename(process.cwd()),
      output: 'CURRENT_TRUTH.md',
      meta: {
        description: 'Documentation truth for ' + path.basename(process.cwd()),
        fail_on_error: false,
        timeout_seconds: 10
      },
      truth_sources: [
        {
          name: 'Project Files',
          command: 'ls -la | head -20',
          essential: true
        },
        {
          name: 'Git Status',
          command: 'git status --short 2>/dev/null || echo "Not a git repository"'
        },
        {
          name: 'Recent Git Commits',
          command: 'git log --oneline -10 2>/dev/null || echo "No git history"'
        }
      ],
      validations: [
        {
          name: 'Git repository exists',
          command: '[ -d .git ] && echo "✓ Git initialized" || echo "✗ Not a git repo"',
          required: false
        }
      ],
      working_examples: [
        {
          name: 'Generate Truth',
          command: 'echo "doctruth"'
        },
        {
          name: 'Check for Changes',
          command: 'echo "doctruth --check"'
        }
      ],
      platform: [
        {
          name: 'Operating System',
          command: 'uname -s 2>/dev/null || echo "Windows"'
        },
        {
          name: 'Current Directory',
          command: 'pwd || cd'
        }
      ]
    };
  }
}

module.exports = DocTruth;