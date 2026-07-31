from __future__ import annotations

from pathlib import Path
import pytest

# Maximum allowed lines of code per source file as defined in AGENTS.md & ADR 0006
MAX_ALLOWED_LINES = 400


def get_source_files() -> list[Path]:
    backend_dir = Path(__file__).resolve().parent.parent
    repo_root = backend_dir.parent
    frontend_src_dir = repo_root / "frontend" / "src"

    source_files: list[Path] = []

    # Backend python files
    for p in backend_dir.rglob("*.py"):
        if any(ignored in p.parts for ignored in [".venv", "__pycache__", "build", "dist", "tests"]):
            continue
        source_files.append(p)

    # Frontend ts/tsx files
    if frontend_src_dir.exists():
        for p in frontend_src_dir.rglob("*"):
            if p.suffix in [".ts", ".tsx"] and not p.name.endswith(".d.ts"):
                if any(ignored in p.parts for ignored in ["node_modules", "dist", "build"]):
                    continue
                source_files.append(p)

    return source_files


def test_no_source_file_exceeds_max_lines() -> None:
    source_files = get_source_files()
    violations: list[str] = []

    for file_path in source_files:
        try:
            line_count = len(file_path.read_text(encoding="utf-8", errors="ignore").splitlines())
            if line_count > MAX_ALLOWED_LINES:
                relative_path = file_path.as_posix()
                violations.append(f"{line_count} lines (> {MAX_ALLOWED_LINES}): {file_path.name} ({relative_path})")
        except Exception as err:
            violations.append(f"Could not read {file_path}: {err}")

    assert not violations, "The following source code files exceed the 400 lines limit:\n" + "\n".join(violations)
