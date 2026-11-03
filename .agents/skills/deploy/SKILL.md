---
name: deploy
description: Deploy this NY Human Resources System repository to its Windows production server when the user asks to deploy or invokes /deploy.
---

# Deploy NY HR

Use only for this repository and its production server `Admin@192.168.209.62`. A user request to deploy authorizes the release; do not ask again. Do not send test bot messages to real HR.

1. Inspect `git status` and the diff. Finish the requested change, including SQL Server 2008 R2 compatibility. Commit only related files on a `feature/*` or `fix/*` branch using Conventional Commits; leave unrelated local files alone. Fast-forward that branch into `master`. Resolve any upstream divergence before release; never force push.
2. If the release changes existing DB data/schema, prepare its migration and backup plan first. For bot dependency or runtime changes, inspect [the runbook](../../../docs/production-release-runbook.md) before running the script.
3. From the repo root run `powershell -NoProfile -ExecutionPolicy Bypass -File .agents/skills/deploy/deploy.ps1`. The script runs tests and builds, checks local/remote commits, pushes `master`, stages a Git bundle and assets, verifies hashes, backs up production files, deploys and checks services/HTTP. `-CheckOnly` performs local checks without changing production.
4. If the script stops, use its error and the runbook to diagnose. Do not blindly rerun after a partial remote update. Confirm production HEAD, services, backup and staging state first. For a release-specific DB or business flow, run a read-only production smoke check. Report commit SHA, health results and anything not yet observed (for example, a scheduled message that has not fired).

The script preserves `backend/.env`, uploads and bot session data. It may leave local unrelated changes untouched. Production backup and staging live outside its Git repository.
