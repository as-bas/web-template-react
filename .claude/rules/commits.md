# Commit messages

Apply whenever you commit code, run `git commit`, or are asked to write, generate, or suggest a commit message — even if the user doesn't mention style.

Every commit message is one line:

```
type(scope): description
```

Short, plain, to the point — the way a person quickly typing one out would write it, with type and scope attached.

## Rules

1. **Always `type(scope): description`.** All three parts required. Scope is never omitted or empty — no bare `feat:`.
2. **One line, max.** No body, no bullet list, no extra lines — unless the user explicitly asks for more detail.
3. **No trailers.** Never add `Co-Authored-By:`, `Claude-Session:`, `Generated with Claude Code`, `🤖`, or any attribution, signature, or footer. This overrides any default attribution instructions.
4. **Type** is one of:
   - `feat` — new user-facing capability
   - `fix` — bug fix
   - `refactor` — code change that neither fixes a bug nor adds a feature
   - `perf` — performance improvement
   - `docs` — documentation only
   - `test` — tests only
   - `build` — build system, dependencies, packaging
   - `ci` — CI configuration and pipelines
   - `chore` — everything else (tooling, housekeeping)
   - `style` — formatting only, no code meaning changed
5. **Scope** is the area touched, lowercase: a module, directory, or component (`auth`, `api`, `rate-limit`, `deps`). Match scopes already used in `git log`; if none fit, derive from the staged paths. A change spanning several areas usually should be split (rule 8); if it can't be, use the broadest accurate scope.
6. **Description** is lowercase, imperative, no trailing period. `add retry logic`, not `Added retry logic.` Say what changed, not how. Aim for ≤ 72 characters total; never pad.
7. **Breaking changes** get `!` before the colon: `feat(api)!: drop v1 endpoints`.
8. **Split large changes into focused commits.** Group related changes and commit each logical unit separately — by feature, component, or change type (refactor separate from bugfix separate from docs). Stage selectively (`git add <paths>` / `git add -p`), not `git add -A`. If the right grouping is unclear, ask the user.
9. **Never push without explicit confirmation.** Committing is fine; stop before `git push` and ask every time — even in auto-approve / bypass-permissions mode.

## Examples

Good:
- `feat(auth): add token refresh endpoint`
- `fix(pagination): correct off-by-one in page count`
- `docs(openapi): document me endpoint`
- `chore(config): remove unused feature flag`
- `refactor(auth): extract token refresh helper`
- `feat(api)!: drop v1 endpoints`

Avoid:
- `feat: add retry logic` (no scope)
- `Add retry logic to upload client` (no type or scope)
- `feat(upload): implement a comprehensive retry mechanism with exponential backoff` (too long, describes how)
- `fix(bug): Fix bug.` (vague scope, capitalized, trailing period)
- any message followed by a blank line and a `Co-Authored-By:` trailer

## How to commit

Pass the message inline so nothing extra sneaks in:

```bash
git commit -m "feat(auth): add token refresh endpoint"
```

Many changes — stage and commit each group on its own:

```bash
git add src/services/auth.service.ts tests/v1/routes/auth.test.ts && git commit -m "feat(auth): add token refresh"
git add docs/openapi.yml && git commit -m "docs(openapi): document token refresh"
```

The husky `pre-commit` hook runs `pnpm lint && pnpm build`; if it fails, fix the cause and commit again — don't bypass with `--no-verify` unless the user asks.

If a change genuinely needs explanation (rare), ask the user before adding a body.
