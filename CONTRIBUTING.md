# Contributing

Thank you for your interest in contributing to `nestjs-pdf`! This document explains how to get started, how to propose changes, and what we expect from contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branching and Commit Guidelines](#branching-and-commit-guidelines)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Release Process](#release-process)
- [Questions or Issues](#questions-or-issues)

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## How to Contribute

You can contribute in many ways:

- Report bugs
- Suggest improvements
- Fix issues
- Improve documentation
- Add or update tests
- Help review pull requests

Before opening a new issue or pull request, please search existing ones to avoid duplicates.

## Development Setup

This project uses Node.js, npm, TypeScript, and JavaScript.

### Prerequisites

- Node.js LTS
- npm

### Install dependencies

```bash
npm install
```

### Run the test suite

```bash
npm test
```

### Run linting

```bash
npm run lint
```

### Build the project

```bash
npm run build
```

> If your local scripts differ, check `package.json` for the exact commands available in this repository.

## Branching and Commit Guidelines

Please keep changes small and focused.

### Recommended branch names

- `feature/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

### Commit message convention

We recommend [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new functionality`
- `fix: correct a bug`
- `docs: update documentation`
- `test: add or update tests`
- `chore: maintenance tasks`

This helps automated release tooling such as `release-please` determine version bumps and generate changelogs.

## Testing

Any functional change should include tests when practical.

Please make sure that:

- Existing tests pass
- New behavior is covered by tests
- Edge cases are considered
- Documentation is updated when needed

If you add or change behavior, include a brief explanation of the expected outcome in the pull request description.

## Pull Requests

When you open a pull request, please include:

- A clear description of the change
- The reason for the change
- Any related issue number
- Screenshots or examples if the change affects output or behavior
- Notes about any breaking changes

### PR checklist

- [ ] My change follows the project conventions
- [ ] I ran the relevant tests
- [ ] I updated documentation if needed
- [ ] I added or updated tests if needed
- [ ] I verified the change does not introduce regressions

Please keep pull requests focused on a single topic whenever possible.

## Release Process

Releases are automated using `release-please` and GitHub Actions.

Typical flow:

1. Changes are merged into the default branch.
2. `release-please` opens or updates a release pull request.
3. The release pull request updates version metadata and the changelog.
4. Once merged, the release is tagged and published according to the repository workflow.

If you contribute a change that should be included in the next release, make sure your commit message follows the convention above so the correct version bump is detected.

## Questions or Issues

If something is unclear, please open an issue or start a discussion in the repository.

Thank you for helping improve `nestjs-pdf`!

