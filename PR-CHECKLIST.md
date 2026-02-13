# PR Checklist

Follow this for every feature/fix:

## Before Coding
- [ ] Understand the requirement clearly
- [ ] Check existing code for patterns to follow

## Implementation
- [ ] Implement the feature
- [ ] Add/update tests as needed
- [ ] Run `npm test` — all must pass
- [ ] Run `npm run build` — must succeed with no TS errors
- [ ] Manual smoke test if UI change

## Commit
- [ ] Use conventional commit format:
  - `feat:` — new feature (bumps minor version)
  - `fix:` — bug fix (bumps patch version)
  - `docs:` — documentation only
  - `refactor:` — code change that doesn't add feature or fix bug
  - `test:` — adding/updating tests
  - `chore:` — maintenance tasks
- [ ] Push to feature branch

## PR Policy
- [ ] Create PR as bot: `GH_TOKEN=$(cat ~/.openclaw/.env.github) gh pr create ...`
- [ ] Wait for CI to pass
- [ ] **Wait for Amanda to approve/merge** — do NOT self-merge

---

## Versioning

**Automated via release-please:**
- Conventional commits (`feat:`, `fix:`) automatically trigger version bumps
- Release-please creates Release PRs when changes accumulate
- Merging a Release PR creates a GitHub release and updates CHANGELOG.md

**No manual version bumping required!**

---

## Quick Commands

```bash
# Run tests
cd frontend && npm test

# Run tests once (CI mode)
cd frontend && npm test -- --run

# Build
cd frontend && npm run build

# Create PR as bot
GH_TOKEN=$(cat ~/.openclaw/.env.github) gh pr create --title "feat: description" --body "..."

# Deploy manually
cd frontend && npm run build && firebase deploy --only hosting
```
