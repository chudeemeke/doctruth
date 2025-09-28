# DocTruth Development Notes

## Project Context

DocTruth is a universal documentation truth system that solves the age-old problem of outdated documentation. Instead of manually maintaining docs that inevitably drift from reality, DocTruth runs commands against the actual codebase and captures the output as "truth".

**Current Status**: v1.0.0 - Production ready, npm-publishable

## FOR AI ASSISTANTS - CRITICAL

### How to Work with This Project

1. **ALWAYS run DocTruth first**: `npm run truth`
2. **Check the generated timestamp** in CURRENT_TRUTH.md
3. **Trust the output** - it's generated from actual commands
4. **When in doubt, regenerate** - the code never lies

### Understanding DocTruth

DocTruth is both:
1. **A tool** - Can be used by any project
2. **Self-documenting** - Uses itself to document itself

This means:
- `.doctruth.yml` in this project documents DocTruth itself
- `CURRENT_TRUTH.md` shows DocTruth's actual state
- The tool can be tested by running it on itself

## Architecture

### Core Components

```
src/
└── index.js         # Main DocTruth class - all logic here

bin/
└── doctruth.js      # CLI wrapper using commander

presets/
├── nodejs.yml       # Preset for Node.js projects
├── python.yml       # Preset for Python projects
└── generic.yml      # Works with any project
```

### Key Design Decisions

1. **Single file core** - All logic in src/index.js for simplicity
2. **No complex dependencies** - Just yaml, chalk, chokidar, commander
3. **Shell agnostic** - Works on Windows, Mac, Linux
4. **Fail-safe** - Commands can fail without breaking generation
5. **Extensible** - Presets and inheritance system

## How DocTruth Works

### 1. Configuration Loading
```javascript
loadConfig() -> reads .doctruth.yml
  -> handles 'extends' for presets
  -> merges configurations
```

### 2. Command Execution
```javascript
runCommand(cmd) -> execSync with timeout
  -> captures stdout/stderr
  -> handles errors gracefully
  -> returns output or error message
```

### 3. Truth Generation
```javascript
generate() -> processes all sections
  -> truth_sources (actual commands)
  -> validations (pass/fail checks)
  -> examples (documentation)
  -> benchmarks (performance)
  -> platform (environment)
```

### 4. Output Generation
```javascript
toMarkdown() -> human-readable format
toJSON() -> machine-readable format
toHTML() -> standalone web page
```

## Edge Cases Handled

### Platform Differences
- Windows: Uses cmd.exe
- Unix: Uses /bin/bash
- Commands work on both

### Command Failures
- Timeout: Shows [TIMEOUT after Xs]
- Exit codes: Shows [EXIT CODE: N]
- Stderr: Captures and shows
- Missing commands: Shows [command not found]

### Large Outputs
- Truncates at 100 lines in Markdown
- Full output in JSON format
- 10MB max buffer size

### File System
- Creates directories if missing
- Handles relative and absolute paths
- Works with symlinks

## Testing Strategy

### Self-Testing
```bash
# DocTruth documents itself
npm run truth

# Verify it works
cat CURRENT_TRUTH.md
```

### Test Commands
```bash
# Quick test (fallback mode)
npm test

# Full Jest test suite
npm run test:jest

# Test with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Manual Tests
```bash
# Different formats
doctruth --format json
doctruth --format html

# Check mode
doctruth --check

# Watch mode
doctruth --watch

# With presets
doctruth --init --preset nodejs
```

### Edge Case Tests
```bash
# Slow command
echo "truth_sources: [{name: 'Slow', command: 'sleep 15'}]" > .doctruth.yml
doctruth --timeout 20

# Failing command
echo "truth_sources: [{name: 'Fail', command: 'exit 1'}]" > .doctruth.yml
doctruth

# Missing command
echo "truth_sources: [{name: 'Missing', command: 'nonexistentcommand'}]" > .doctruth.yml
doctruth
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Command not found" | Check command works in terminal first |
| Timeout errors | Increase timeout in config |
| Windows path issues | Use forward slashes or escape backslashes |
| Permission denied | Check file permissions |
| Spaces in path | DocTruth handles this automatically with quotes |
| Test failures with spaces | Use `npm run test:jest` instead of `npm test` |

## Publishing to NPM

```bash
# 1. Test locally
npm link
doctruth --version

# 2. Run tests (use Jest for full test suite)
npm run test:jest

# 3. Test package creation
npm pack --dry-run  # Verify what will be published

# 4. Update version
npm version patch  # or minor/major

# 5. Publish
npm publish

# 6. Test installation
npm install -g doctruth
```

### Pre-publish Checklist
- ✓ All tests pass with `npm run test:jest`
- ✓ Package size reasonable (~13-15KB)
- ✓ `npm pack --dry-run` shows correct files
- ✓ No sensitive information in package
- ✓ Documentation up to date

## Extending DocTruth

### Adding a New Preset

1. Create `presets/newtype.yml`
2. Add appropriate truth sources
3. Test with `doctruth --init --preset newtype`

### Adding Output Formats

In src/index.js:
1. Add new method like `toNewFormat()`
2. Handle in `save()` method
3. Add CLI option in bin/doctruth.js

### Adding Features

Keep it simple:
- One feature = one configuration option
- Maintain backward compatibility
- Document in README.md

## Philosophy

### Why DocTruth Exists

Traditional documentation:
- Written by humans
- Updated manually (or not)
- Drifts from reality
- Causes confusion

DocTruth documentation:
- Generated from code
- Updated automatically
- Always accurate
- Prevents confusion

### Core Principles

1. **The code is the truth** - Commands show reality
2. **Fail gracefully** - One failed command shouldn't break everything
3. **Universal** - Should work with any project type
4. **Simple** - Easy to understand and modify
5. **Fast** - Should complete in seconds, not minutes

## Future Ideas (Not Implemented)

These could be added but aren't needed for v1:
- Web UI for viewing truth
- Diff visualization
- Historical truth tracking
- Cloud storage integration
- API for programmatic access
- Plugins system
- IDE extensions

## Quick Commands

```bash
# Development
npm run truth         # Generate truth
npm run truth:check   # Check for changes
npm run truth:watch   # Auto-regenerate

# Testing
npm test              # Run test suite
npm run lint          # Check code style
npm run format        # Format code
```

## Remember

- **DocTruth uses DocTruth** - We eat our own dog food
- **Simplicity wins** - Resist adding complex features
- **Commands are truth** - If a command shows it, it's true
- **Documentation lies, code doesn't** - That's why DocTruth exists

## For AI Assistants

When asked about DocTruth:
1. Run `npm run truth` first
2. Read the generated CURRENT_TRUTH.md
3. That's the actual state, regardless of what any docs say
4. If something seems wrong, regenerate and check again

The truth is in the commands, not the documentation.