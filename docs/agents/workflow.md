<!-- rogs-skills config v1: workflow -->
# Workflow

How this project runs the ticket lifecycle. Written by `/setup-rogs`; edit it freely and run `/setup-rogs` again to update it in place.

## Features

| Feature | State |
|---|---|
| Bundles | off |
| Browser pass | off |
| Model routing | off |
| Client notes | off |
| Plan review | off |
| Plan presentation | off |
| Taste pass | off |
| Changelog | off |
| Agent verification | off |
| Autonomous runs | off |
| CI review | off |

## Worktrees

Every ticket or bundle is worked in its own git worktree whose branch name and directory name both equal the lead ticket id exactly: branch `ACM-42` checked out in a directory named `ACM-42`. The lifecycle skills check this before anything else and stop when it fails. They never create, switch or repair a worktree. The user creates worktrees, from a base branch that already contains `docs/agents/`.

Usual location: wherever `tkt start` puts it (worktrunk's `worktree-path`); `talk-*` worktrees under `../ragdoll-golf-worktrees/` belong to Self Evident and are not ticket worktrees.

## Verification

| What | Command |
|---|---|
| Format | not configured |
| Full check | `npm run build` |

Focused checks:

| Paths | Command |
|---|---|
| `src/**`, `public/**`, `index.html` | `npm run build` |

Test-first areas: none (there is no test runner yet).

Hooks: none. Never bypass a hook, and never pipe `git commit` through another command: the pipe hides the hook's exit status. Confirm every commit with `git log`.

Notes: run `npm install` once in a new worktree before `npm run build`.

## Commits

- Each commit is one coherent change with its tests, staged by explicit path.
- No amending, no AI attribution, and no co-author trailers, unless this section says otherwise.
- Documentation that belongs to a change, such as an ADR for a new decision, goes in the same commit.
- Never committed: nothing beyond .gitignore.
- Message style: follow recent history: a short imperative subject in sentence case, no prefix.

## Sync

A branch takes the base by merging it: `git pull --no-edit <remote> <base>`, with the remote and base from `forge.md`. Never rebase a published branch and never force-push. Immediately before every push, fetch and require `<remote>/<base>` to be an ancestor of `HEAD`; when it is not, merge again first.

Notes: rerun `npm install` when `package-lock.json` changed.

## Project rules

- Rule files: none.
- Reference implementations: none.
- Data boundaries: none.

## Review

- Invariants: none beyond the defaults.
- House standards: none.
- Focused reproduction: no tests yet; `npm run build` builds the game, `npm run dev` serves it; `npm ls <package>` shows an installed version; sources are in `node_modules/<package>`.

## Human verification

Every pull request and handoff carries one concrete human verification procedure. It contains:

- The environment and exact setup commands: for a user interface, the browser, dev server, account and test data; otherwise the exact API calls, commands, database queries or log inspections.
- Numbered actions that name the exact URL or page, navigation, control, input or command, and any wait condition.
- The observable expected result of every action, including at least one negative or regression check when the change can affect existing behavior.
- Cleanup that restores settings or removes test data.
- The environments or surfaces the procedure cannot verify.

Generic steps ("open the app and verify it works") fail this standard, and so do manual repeats of assertions that automation already proves. A change with no user-visible surface keeps the section, says why, and gives the closest exact check through an API, logs, a database or a CLI. The agent that writes the procedure never claims to have run it. When agent verification is on, `verify-pr` runs the steps in a fresh session after a clean review and posts what it saw as agent evidence; the user still confirms each step, from that evidence or by running it. When CI review is on, the procedure that counts after the CI reviewer's CLEAR is the one in the pull request body.
