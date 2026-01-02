# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

DocTruth is a universal documentation truth system that solves the age-old problem of outdated documentation. Instead of manually maintaining docs that inevitably drift from reality, DocTruth runs commands against the actual codebase and captures the output as "truth".

**Current Status**: v1.1.0 - Production ready, bun-powered
**Repository**: https://github.com/chudeemeke/doctruth
**Author**: Chude <chude@emeke.org>
**Package Manager**: bun (migrated from npm 2026-01-02)

## FOR AI ASSISTANTS - CRITICAL

### How to Work with This Project

1. **ALWAYS run DocTruth first**: `bun run truth`
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
bun run truth

# Verify it works
cat CURRENT_TRUTH.md
```

### Test Commands
```bash
# Quick test (fallback mode)
bun test

# Full Jest test suite
bun test

# Test with coverage
bun run test:coverage

# Watch mode for development
bun run test:watch
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
| Test failures with spaces | Use `bun test` instead of `bun test` |

## Critical Development Rules

### When Making Changes
1. **ALWAYS** run `bun run truth` after making changes to see actual state
2. **ALWAYS** run `bun test` before committing
3. **NEVER** commit if tests fail
4. **ALWAYS** use author info: "Chude <chude@emeke.org>" for git commits
5. **NEVER** break backward compatibility without major version bump

### Pre-publish Checklist
- ✓ All tests pass with `bun test`
- ✓ Run `bun run truth` and verify CURRENT_TRUTH.md is up to date
- ✓ Package size reasonable (~13-15KB) - check with `bun pack --dry-run`
- ✓ No sensitive information in package
- ✓ README.md and documentation up to date
- ✓ Git repository clean and commits pushed

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

## Essential Commands

### Development & Testing
```bash
# Generate truth documentation (ALWAYS RUN THIS FIRST)
bun run truth

# Test the tool
bun test        # Full Jest test suite (recommended)
bun test                 # Fallback mode (may have issues with paths containing spaces)
bun run test:coverage    # Run with coverage report
bun run test:watch       # Watch mode for development

# Watch for changes and auto-regenerate
bun run truth:watch

# Check if truth has changed (useful for CI/CD)
bun run truth:check

# Code quality
bun run lint             # Check code style
bun run format           # Format code with Prettier
```

### Local Development & Testing
```bash
# Test CLI locally without publishing
bun link
doctruth --version
doctruth --help

# Test in a different project
cd /path/to/test-project
doctruth --init
doctruth

# Unlink when done
bun unlink -g doctruth
```

### Publishing Workflow
```bash
# 1. Verify tests pass
bun test

# 2. Preview what will be published
bun pack --dry-run

# 3. Create new version and publish
bun run release          # Patches version, publishes, and pushes tags

# OR do it manually:
bun version patch        # or minor/major
bun publish
git push --tags
```

## Remember

- **DocTruth uses DocTruth** - We eat our own dog food
- **Simplicity wins** - Resist adding complex features
- **Commands are truth** - If a command shows it, it's true
- **Documentation lies, code doesn't** - That's why DocTruth exists

## For AI Assistants

When asked about DocTruth:
1. Run `bun run truth` first
2. Read the generated CURRENT_TRUTH.md
3. That's the actual state, regardless of what any docs say
4. If something seems wrong, regenerate and check again

The truth is in the commands, not the documentation.

---

## Session History

### 2026-01-02 - Portfolio Remediation

**Changes Made:**
- Migrated from npm to bun (deleted package-lock.json, created bun.lock)
- Fixed cross-platform test compatibility (echo command behavior on Windows vs Unix)
- Created CHANGELOG.md documenting v1.0.0-1.0.2 history
- Added CI/CD pipeline (.github/workflows/ci.yml) with multi-OS/Node version matrix
- Created docs/plans/ directory for future planning
- Created VERSION file (single source of truth)
- Updated all npm commands to bun throughout documentation
- Version bumped to 1.1.0

**Test Status:**
- All 14 tests passing
- Cross-platform compatible (Windows + Unix)

**Outstanding Items:**
- Consider adding pre-commit hooks
- Full test coverage audit after next feature addition
- Regenerate CURRENT_TRUTH.md after committing these changes

**Next Steps:**
1. Commit all changes with proper commit message
2. Push to remote
3. Verify CI/CD pipeline runs successfully
4. Consider npm publish of v1.1.0