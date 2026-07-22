# NY Human Resources System — Agent Configuration

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Tech Stack

### Backend

- **Framework**: FastAPI
- **Runtime**: Python 3.12
- **Package manager**: `uv` — NEVER use `pip`, `pip3`, or bare `python`. Always use:
  - `uv run python` to execute Python
  - `uv add <pkg>` to install packages
  - `uv sync` to restore the environment
- **Database**: Microsoft SQL Server via **ODBC Driver 18 for SQL Server**
  - SQLAlchemy dialect: `mssql+pyodbc`
  - Connection string format: `mssql+pyodbc://<user>:<password>@<server>/<db>?driver=ODBC+Driver+18+for+SQL+Server`
  - Driver must be installed on the host machine — NEVER fall back to SQLite or any other DB
  - **Server version: SQL Server 2008 R2** (10.50.1600.1) — avoid features not supported on this version:
    - No `RETURNING` / `OUTPUT INSERTED` in SQLAlchemy ORM `insert()` — use `flush()` + `refresh()` instead
    - No `OFFSET … FETCH` pagination — use `ROW_NUMBER()` workaround if needed
    - No JSON functions (`JSON_VALUE`, `OPENJSON`, etc.)
    - No `SEQUENCE` objects — use `IDENTITY` columns for auto-increment
- **Type safety**: All Python code **must** have full type annotations (function signatures, return types, variables where non-obvious). Use `from __future__ import annotations` where needed. Avoid `Any` unless unavoidable.

### Frontend

- **Framework**: React (with Vite)
- **Language**: TypeScript — strict mode enabled. No `any`, no implicit `any`.
- **CSS**: Tailwind CSS — utility-first, no custom CSS files unless absolutely necessary.
- **Component style**: Functional components + hooks only. No class components.

### General rules

- Backend and frontend live in separate top-level directories: `backend/` and `frontend/`.
- API contracts are defined with Pydantic models on the backend and matching TypeScript interfaces on the frontend.
- Agents must not introduce dependencies outside this stack without explicit user approval.

## Project Structure

The project is organised **by feature**, not by layer. Each feature is a self-contained vertical slice — its own models, routes, services, and UI components live together.

### Features

| Feature slug | Description |
|---|---|
| `hr_foreign` | Quản lý nhân sự nước ngoài |

### Backend layout (`backend/`)

```
backend/
├── pyproject.toml
├── uv.lock
├── main.py                  # FastAPI app factory, router registration
├── core/                    # Shared infra (db, config, deps)
│   ├── config.py
│   └── database.py
└── features/
    └── hr_foreign/
        ├── router.py        # APIRouter
        ├── schemas.py       # Pydantic request/response models
        ├── service.py       # Business logic
        └── models.py        # SQLAlchemy / DB models
```

### Frontend layout (`frontend/`)

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx             # App entry point
    ├── App.tsx              # Root component, routing
    ├── shared/              # Shared UI components, hooks, utils, types
    │   ├── components/
    │   ├── hooks/
    │   └── types/
    └── features/
        └── hr-foreign/
            ├── components/  # React components for this feature
            ├── hooks/       # Feature-specific hooks
            ├── api.ts       # API calls (typed with shared types)
            └── types.ts     # TypeScript interfaces mirroring backend schemas
```

### Rules for agents

- **Never** put feature-specific code in `core/` or `shared/`.
- **Always** add a new feature as a new directory under `features/` on both sides.
- Cross-feature dependencies must go through `shared/` or `core/` — never import directly between feature directories.
- Backend router for each feature must be registered in `main.py` under its own prefix (e.g. `/api/hr-foreign`).

## Git & Commit Conventions

When creating git commits, agents **must** follow **Conventional Commits** and Git Flow rules:

### 1. Commit Message Format
`<type>(<scope>): <description>`

- **Allowed Types**:
  - `feat`: New user-facing feature or enhancement
  - `fix`: Bug fix for existing functionality
  - `docs`: Documentation updates only
  - `style`: Formatting, linting, whitespace changes with no logic change
  - `refactor`: Restructuring code without changing external behavior
  - `test`: Adding or updating test cases
  - `chore`: Maintenance, build scripts, dependency updates
- **Scope**: Lowercase module or feature slug (e.g. `hr_foreign`, `core`, `frontend`, `deps`).
- **Description**: Use imperative, present tense ("add", "fix", "update"), keep short and lowercase.

### 2. Git Flow Rules
- **Branches**:
  - `main` / `master`: Production releases.
  - `develop`: Integration branch for incoming features.
  - `feature/<name>`: New feature work.
  - `fix/<name>` or `hotfix/<name>`: Bug fixes.
- **Commit Guidelines**:
  - Atomic commits: group related changes into logical commits.
  - Never stage or commit temporary files, logs, local data (`*.db`, `uploads/`), or `.env` files.
  - Always run tests (`uv run pytest`) and verify type safety before committing.

