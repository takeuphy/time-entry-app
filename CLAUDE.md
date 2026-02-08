# CLAUDE.md — time-entry-app

This file provides context for AI assistants working on this repository.

## Project Overview

**time-entry-app** is a time entry/tracking application. The repository is currently in its initial state with no source code yet committed.

## Repository Status

- **State**: New / empty repository — no code, dependencies, or configuration files have been added yet.
- **Remote**: `takeuphy/time-entry-app`

## Development Guidelines

### Git Workflow

- Default branch: `main` (to be created with the first commit)
- Feature branches should use descriptive names (e.g., `feature/add-timer`, `fix/entry-validation`)
- Write clear, concise commit messages focused on *why*, not *what*
- Keep commits atomic — one logical change per commit

### Code Conventions (to adopt once code is added)

- Prefer TypeScript over JavaScript for type safety
- Use consistent formatting (Prettier or equivalent)
- Use a linter (ESLint or equivalent) and fix all warnings before committing
- Write tests alongside new features
- Keep functions small and focused on a single responsibility

### Commands

No build/test/lint commands are configured yet. Update this section as tooling is added:

```
# Install dependencies
# npm install

# Run development server
# npm run dev

# Run tests
# npm test

# Lint
# npm run lint

# Build for production
# npm run build
```

### Project Structure

No directory structure has been established yet. Update this section as the project takes shape. A typical structure might look like:

```
time-entry-app/
├── CLAUDE.md          # This file — AI assistant context
├── README.md          # Project documentation
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── src/               # Application source code
│   ├── components/    # UI components
│   ├── pages/         # Page/route components
│   ├── services/      # API and business logic
│   ├── utils/         # Shared utilities
│   └── types/         # TypeScript type definitions
├── tests/             # Test files
└── public/            # Static assets
```

### Key Decisions Log

Track important architectural and technology decisions here as they are made.

| Decision | Date | Rationale |
|----------|------|-----------|
| Repository created | 2026-02-08 | Initial project setup |

## Notes for AI Assistants

- This is a greenfield project. When adding initial code, ensure you also set up the corresponding configuration (package.json, tsconfig, linting, etc.).
- Always read existing files before modifying them — do not overwrite work already done.
- Keep this CLAUDE.md file up to date as the project evolves: add new commands, update the structure diagram, and record key decisions.
- When establishing new patterns (component structure, API conventions, state management), document them here so future sessions stay consistent.
