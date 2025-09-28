# DocTruth - Universal Documentation Truth System

> Never lie about your documentation again

[![npm version](https://img.shields.io/npm/v/doctruth.svg)](https://www.npmjs.com/package/doctruth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/doctruth.svg)](https://nodejs.org)

## What is DocTruth?

DocTruth is a universal tool that generates a "truth file" showing the **actual current state** of your project. Instead of maintaining documentation manually (which gets outdated), DocTruth runs commands against your actual codebase and captures the results.

**The code never lies. DocTruth proves it.**

## Quick Example

```yaml
# .doctruth.yml
truth_sources:
  - name: "Installed Dependencies"
    command: "npm list --depth=0"
    essential: true
```

Run `doctruth` and get:

```markdown
# Project Truth
Generated: 2025-09-28

## Installed Dependencies [ESSENTIAL]
```bash
$ npm list --depth=0
├── express@4.18.2
├── jest@29.6.2
└── typescript@5.2.0
```

## Why DocTruth?

### The Problem
- Documentation says: "We support Node 14+"
- Reality: Code uses Node 18 features
- **Result**: Confused developers, wasted time

### The Solution
- DocTruth runs: `node --version`
- Shows: `v18.17.0`
- **Result**: Truth, automatically captured

## Installation

### Global (Recommended)
```bash
npm install -g doctruth
```

### Local Project
```bash
npm install --save-dev doctruth
```

## Quick Start

### 1. Initialize
```bash
doctruth --init
```

This creates a `.doctruth.yml` with auto-detected configuration for your project type.

### 2. Generate Truth
```bash
doctruth
```

Creates `CURRENT_TRUTH.md` with your project's actual state.

### 3. Keep it Updated
```bash
# Check if truth has changed
doctruth --check

# Watch mode - auto-regenerate
doctruth --watch

# Add to package.json
{
  "scripts": {
    "truth": "doctruth"
  }
}
```

## Configuration

DocTruth uses `.doctruth.yml` for configuration:

```yaml
version: 1
project: my-app
output: docs/CURRENT_TRUTH.md

truth_sources:
  - name: "Version"
    command: "cat package.json | grep version"
    essential: true

  - name: "Dependencies"
    command: "npm list --depth=0"
    category: "Dependencies"

validations:
  - name: "Tests Pass"
    command: "npm test"
    required: true

working_examples:
  - name: "Run Application"
    command: "echo 'npm start'"

benchmarks:
  - name: "Build Time"
    command: "time npm run build"
    unit: "seconds"
```

## Presets

DocTruth includes presets for common project types:

### Node.js Projects
```bash
doctruth --init --preset nodejs
```

### Python Projects
```bash
doctruth --init --preset python
```

### Generic Projects
```bash
doctruth --init --preset generic
```

### Extending Presets
```yaml
# .doctruth.yml
extends: nodejs

# Add your custom sources
truth_sources:
  - name: "Custom Check"
    command: "my-custom-command"
```

## Command Line Options

```bash
doctruth [options]

Options:
  -c, --config <path>     Path to config file (default: ".doctruth.yml")
  -o, --output <path>     Output file path
  -f, --format <type>     Output format: markdown|json|html (default: "markdown")
  --check                 Check if truth has changed (exit 1 if changed)
  --watch                 Watch for changes and regenerate
  --init                  Initialize a new .doctruth.yml config
  --preset <name>         Use a preset configuration
  --verbose               Verbose output
  --silent                Silent mode - no console output
  --no-color              Disable colored output
  --timeout <seconds>     Command timeout in seconds (default: "10")
  --fail-on-error         Exit with error if any command fails
  --diff                  Show diff when checking changes
  -v, --version           Show version
  -h, --help              Show help
```

## Use Cases

### 1. CI/CD Pipeline
```yaml
# .github/workflows/truth.yml
on: [push]
jobs:
  truth:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g doctruth
      - run: doctruth --check
```

### 2. Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "doctruth --check"
    }
  }
}
```

### 3. Documentation Site
```javascript
// Auto-include truth in your docs
const truth = require('./CURRENT_TRUTH.json');
```

### 4. Project Onboarding
```bash
# New developer runs:
doctruth

# Sees exactly:
# - What versions are needed
# - What commands work
# - What the project structure is
```

## Output Formats

### Markdown (Default)
Perfect for README files, documentation sites, and human reading.

### JSON
```bash
doctruth --format json
```
Machine-readable for integration with other tools.

### HTML
```bash
doctruth --format html
```
Standalone HTML page with styling.

## Advanced Features

### Categories
Group related truth sources:

```yaml
truth_sources:
  - name: "Node Version"
    category: "Environment"
    command: "node --version"

  - name: "NPM Version"
    category: "Environment"
    command: "npm --version"

  - name: "Main File"
    category: "Structure"
    command: "ls -la index.js"
```

### Essential Checks
Mark critical truth sources:

```yaml
truth_sources:
  - name: "Database Connection"
    command: "psql -c 'SELECT 1'"
    essential: true  # Will warn if this fails
```

### Timeout Control
Set timeouts for slow commands:

```yaml
truth_sources:
  - name: "Full Test Suite"
    command: "npm test"
    timeout: 60  # seconds
```

### Success Patterns
Custom validation logic:

```yaml
validations:
  - name: "Coverage Above 80%"
    command: "npm run coverage"
    successPattern: "Coverage: [8-9][0-9]%|100%"
```

## Platform Support

DocTruth works on:
- macOS
- Linux
- Windows (with WSL or Git Bash)
- Docker containers
- CI/CD environments

## How It Works

1. **Read Config**: DocTruth reads `.doctruth.yml`
2. **Run Commands**: Executes each command in a shell
3. **Capture Output**: Records stdout, stderr, exit codes
4. **Generate Report**: Creates formatted output
5. **Save Truth**: Writes to `CURRENT_TRUTH.md`

## Philosophy

- **Truth over Documentation**: The code is the truth, docs should reflect it
- **Automation over Manual**: Humans forget to update, machines don't
- **Simplicity over Complexity**: Just run commands and show output
- **Universal over Specific**: Works with any project, any language

## Common Patterns

### Show What's Implemented
```yaml
truth_sources:
  - name: "API Endpoints"
    command: "grep -r '@app.route' . | cut -d'(' -f2 | cut -d')' -f1"
```

### Show What's Deployed
```yaml
truth_sources:
  - name: "Production Version"
    command: "curl -s https://api.myapp.com/version"
```

### Show What Works
```yaml
validations:
  - name: "Build Succeeds"
    command: "npm run build && echo '✓ Build works'"
```

## Troubleshooting

### Command Not Found
DocTruth runs commands in a shell. Ensure commands work in your terminal first.

### Timeouts
Increase timeout for slow commands:
```yaml
meta:
  timeout_seconds: 30
```

### Windows Issues
Use Git Bash or WSL for better command compatibility.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © 2025

## Credits

Created by developers tired of outdated documentation.

---

**Remember**: The code never lies. Let DocTruth prove it.

## Links

- [GitHub Repository](https://github.com/yourusername/doctruth)
- [NPM Package](https://www.npmjs.com/package/doctruth)
- [Documentation](https://doctruth.dev)
- [Examples](https://github.com/yourusername/doctruth/tree/main/examples)