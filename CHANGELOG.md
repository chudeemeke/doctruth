# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-02

### Changed
- Migrated from npm to bun for package management
- Fixed cross-platform test compatibility (echo command behavior)

### Added
- CI/CD pipeline with GitHub Actions
- CHANGELOG.md for version history tracking
- docs/plans/ directory for future planning

### Fixed
- Test suite now passes on Windows (cmd.exe vs bash echo behavior)

## [1.0.2] - 2025-09-28

### Changed
- Updated author information to `Chude <chude@emeke.org>`
- Updated GitHub repository URLs to correct location

## [1.0.1] - 2025-09-28

### Fixed
- Corrected bin path format in package.json for proper CLI installation

## [1.0.0] - 2025-09-28

### Added
- Initial release of DocTruth - Universal Documentation Truth System
- CLI with commands: `--init`, `--check`, `--watch`, `--format`
- Support for YAML configuration (`.doctruth.yml`)
- Preset system with nodejs, python, and generic presets
- Markdown, JSON, and HTML output formats
- Command timeout handling with graceful failure
- Self-documenting capability (uses itself for its own docs)
- Comprehensive documentation (README.md, CLAUDE.md, CONTRIBUTING.md)

[Unreleased]: https://github.com/chudeemeke/doctruth/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/chudeemeke/doctruth/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/chudeemeke/doctruth/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/chudeemeke/doctruth/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/chudeemeke/doctruth/releases/tag/v1.0.0
