---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
description: Create a commit following Conventional Commits and GitHub best practices
argument-hint: "[optional message] or leave empty to auto-generate one"
---

# 🔍 Repository Context

- **Current branch:** !`git branch --show-current`
- **Working tree status:**
```
!`git status --short`
```
- **Staged changes diff:**
```diff
!`git diff --cached`
```
- **Unstaged changes diff:**
```diff
!`git diff`
```
- **Last 5 commits (for style consistency):**
```
!`git log --oneline -5`
```

---

# 📋 Task

$ARGUMENTS

Analyze the changes above and create a commit strictly following these rules:

## Required Format (Conventional Commits)

```
<type>(<optional scope>): <short description in imperative mood>

<optional body — explain the WHAT and WHY, not the HOW>

<optional footer — issue references, breaking changes>
```

## Valid Types

| Type       | When to use |
|------------|-------------|
| `feat`     | A new feature for the user |
| `fix`      | A bug fix |
| `docs`     | Documentation changes only |
| `style`    | Formatting, whitespace, semicolons — no logic change |
| `refactor` | Code restructuring — neither a feature nor a fix |
| `perf`     | Performance improvement |
| `test`     | Adding or correcting tests |
| `build`    | Build system or dependency changes |
| `ci`       | CI/CD configuration changes |
| `chore`    | Maintenance tasks that don't touch production code |
| `revert`   | Reverting a previous commit |

## Quality Rules

1. **Description** — imperative present tense, no leading capital, no trailing period, max 50 characters
   ✅ `feat(auth): add JWT refresh token support`
   ❌ `feat(auth): Added JWT refresh token support.`

2. **Scope** — optional, lowercase, reflects the affected module/area (e.g. `api`, `auth`, `ui`, `db`)

3. **Body** — separated by a blank line, max 72 characters per line; explain *why*, not *how*

4. **Breaking changes** — append `!` after the type/scope AND add a `BREAKING CHANGE: <description>` footer
   e.g. `feat(api)!: remove deprecated v1 endpoints`

5. **Issue footer** — use `Closes #N`, `Fixes #N` or `Refs #N` to auto-link with GitHub issues

6. **Atomicity** — if the changes span multiple unrelated responsibilities, warn me before committing and suggest splitting them

## Execution Process

1. Check for unstaged files that should be included — if any, run `git add` on the relevant ones and **explain which files were added and why**
2. Verify there are no temp files, debug `console.log` statements, hardcoded credentials, or accidental `TODO` comments in the diff
3. If the user passed a message as an argument (`$ARGUMENTS`), use it as a base and improve it to meet the format; if empty, generate the full message
4. Show the proposed commit message and ask for confirmation **before** running `git commit`
5. Execute `git commit -m "..."` with the approved message
6. Display a summary of the created commit with `git log -1 --stat`