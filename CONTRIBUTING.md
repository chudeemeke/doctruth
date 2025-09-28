# Contributing to DocTruth

Thank you for considering contributing to DocTruth! We welcome contributions from everyone.

## How to Contribute

### 1. Reporting Issues

- Check if the issue already exists
- Include your `.doctruth.yml` configuration
- Include the error message or unexpected output
- Specify your OS and Node.js version

### 2. Suggesting Features

- Open an issue with the "enhancement" label
- Explain the use case
- Provide examples of how it would work

### 3. Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests if applicable
5. Run `npm test` to ensure tests pass
6. Run `npm run truth` to update documentation
7. Commit with a clear message
8. Push to your fork
9. Open a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/doctruth.git
cd doctruth

# Install dependencies
npm install

# Run tests
npm test

# Test the CLI
./bin/doctruth.js --help

# Generate truth for DocTruth itself
npm run truth
```

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Keep it simple and readable

## Adding Presets

1. Create a new file in `presets/yourpreset.yml`
2. Follow the structure of existing presets
3. Test with: `doctruth --init --preset yourpreset`
4. Document in README.md

## Testing

- Add tests for new features in `tests/`
- Ensure existing tests still pass
- Test on different platforms if possible

## Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for implementation details
- Run `npm run truth` to regenerate CURRENT_TRUTH.md

## Philosophy

Remember DocTruth's core principles:
- The code is the truth
- Simplicity over complexity
- Universal over specific
- Fail gracefully

## Questions?

Open an issue or discussion on GitHub.