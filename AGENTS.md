# AGENTS

Guidelines for contributors and automated assistants working in this repository.

## Scope
These instructions apply to the entire repo unless a deeper `AGENTS.md` file specifies otherwise.

## Development environment
- Target Node.js **18+**.
- Keep dependencies minimal; verify any new package is necessary.
- Build with `vite`; tests run with `jest`.

## Code style
- JavaScript only; 2-space indentation, semicolons, and single quotes.
- Favor small, pure functions and module-level exports.
- Avoid frameworks—UI is built with vanilla DOM helpers in `src/`.

## Testing & build checks
- ✅ `npm test` — run before committing.
- ✅ `npm run build` — ensure bundling succeeds for front-end changes.
- Add or update tests for any feature/bugfix touching `src/` or `utils.js`.

## Commit & PR guidelines
- Use clear, descriptive commit messages (Conventional Commit style encouraged).
- One logical change per commit; include tests and docs as needed.
- PR description should summarize the change, testing performed, and any follow-up work.

## File-specific notes
- **src/**: avoid direct DOM mutations outside the helper utilities.
- **tests/**: prefer Jest; DOM interactions should rely on the minimal stubbed DOM pattern already in use.
- **utils.js**: keep pure utilities—no side effects or DOM access.

## Misc
- Respect existing naming and folder conventions.
- Document new configuration options in `README.md`.
