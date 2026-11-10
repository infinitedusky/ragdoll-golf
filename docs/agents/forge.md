<!-- rogs-skills config v1: forge -->
# Forge

Where this project's code is hosted and how the lifecycle skills push branches, open and review pull requests, wait for CI, and merge. Written by `/setup-rogs`; edit it freely and run `/setup-rogs` again to update it in place.

## Forge

- Kind: GitHub
- Host: github.com
- Repository: infinitedusky/ragdoll-golf
- Remote: origin
- CLI: `gh`, version 2.99 or newer. Every `gh pr`, `gh repo` and `gh run` command takes `--repo <host>/<repo>`; every `gh api` call takes `--hostname <host>` and spells the repository out (`repos/<repo>/...`). gh's `{owner}` and `{repo}` placeholders resolve from the checkout, so they never appear in these commands.
- Base branch: main; re-read with: `gh repo view <host>/<repo> --json defaultBranchRef --jq .defaultBranchRef.name`, or `gh api --hostname <host> repos/<repo>/branches/<base> --jq .name` when the base is not the default branch
- Merge style: squash; re-read with: `gh repo view <host>/<repo> --json mergeCommitAllowed,squashMergeAllowed` (the style must still be allowed) and `gh api --hostname <host> repos/<repo>/rules/branches/<base> --jq '.[].type'` (`required_linear_history` rules out `merge`; `merge_queue` hands the merge to a person)
- Non-interactive use: read with `--json <fields>`, trimmed with `--jq`, so gh neither pages nor prompts. Pass bodies as `--body-file <file>` to gh commands and as `-F body=@<file>` to `gh api`. Give `gh pr merge` its style flag: without `--merge` or `--squash` it stops when it cannot prompt. Reviews go through the API (`post-review`), never through `gh pr review`, which records approvals and change requests. `--fill`, `--web`, `--editor` and `--template` belong to the interactive flow and stay unused, and `gh pr create --dry-run` can still push. Quote every endpoint that holds `?` or `&`. `gh api` exits non-zero on an HTTP error and prints `gh: <message> (HTTP <code>)`: a failed call, never an empty result.

Rules for every forge call:

- Name the host, repository and remote from this section explicitly; never rely on ambient CLI defaults or environment variables.
- Never open an editor, form, browser, pager or interactive prompt. Write long bodies to a temporary file outside the repository and pass the file.
- A failed query is not an empty result. Follow pagination until it ends.
- Read every write back.
- Never force-push, bypass branch protection, enable auto-merge, merge with administrator rights, or delete branches.
- Keep tokens out of commands, logs and replies.

## Operations

Angle brackets mark values: `<host>`, `<repo>` (`<owner>/<name>`), `<remote>` and `<base>` come from `## Forge`; the rest come from earlier calls.

### find-pr

```bash
gh pr list --repo <host>/<repo> --head <branch> --base <base> --state <open|merged|all> --limit 100 \
  --json number,url,state,headRefName,headRefOid,headRepository,headRepositoryOwner,baseRefName
```

`--head` matches the branch name in every fork and takes no `owner:` prefix, so check each entry: `headRepository.nameWithOwner` (the same as `headRepositoryOwner.login` and `headRepository.name`) is the head repository, which is `<repo>` for a branch pushed to `<remote>`; `headRefName` is the branch; and `baseRefName` is the base. The entry that passes is the pull request. An empty list counts only when the command exited 0. A list of 100 entries means the limit cut it: raise `--limit` and run it again.

Capability: Supported

### push

```bash
git push --set-upstream <remote> refs/heads/<branch>:refs/heads/<branch>
git ls-remote <remote> refs/heads/<branch>
```

The SHA `git ls-remote` prints must equal `git rev-parse HEAD`. Run the check after a failed or interrupted push too: the remote may hold the new commit anyway, or still the old one. A rejection (the branch moved, a branch rule or secret push protection refused it) is reported with its message; never force.

Capability: Supported

### create-pr

1. Run `find-pr` with `--state open`, and reuse a pull request that already exists.
2. Open it:

   ```bash
   gh pr create --repo <host>/<repo> --base <base> --head <branch> --title "<title>" --body-file <body file>
   ```

   A head in a fork is `--head <fork owner>:<branch>`. gh refuses an organization as `<fork owner>` (gh 2.100); open that pull request through the API instead, `gh api --hostname <host> -X POST repos/<repo>/pulls -f base=<base> -f head=<fork owner>:<branch> -f head_repo=<fork name> -f title="<title>" -F body=@<body file>`, which prints the new pull request as JSON. Add `--attach <file>` for each capture the body references (see `attach`). The assignee comes from `assign`.
3. gh can print the new URL and still fail a later step, and it reports an existing pull request as an error that carries that one's URL. Whatever the exit status, run `find-pr` and `read-pr`: exactly one pull request for this head and base, with the title and body sent and `isDraft` false. Repair that one with `edit-pr`; never open a second. When the call timed out without a URL, run `find-pr` before any retry.

Capability: Supported

### read-pr

```bash
gh pr view <number> --repo <host>/<repo> \
  --json url,number,state,isDraft,title,body,baseRefName,headRefName,headRefOid,headRepository,headRepositoryOwner,assignees,mergeable,mergeStateStatus,mergeCommit,mergedAt
```

`state` is `OPEN`, `CLOSED` or `MERGED`; `headRefOid` is the exact head SHA; `mergeCommit.oid` is the merge commit once merged. `mergeable` is `MERGEABLE`, `CONFLICTING` or `UNKNOWN`. GitHub recomputes it in the background after every push to the head or the base, so `UNKNOWN` means not computed yet: read again after a few seconds, and never report it as a conflict. `mergeStateStatus` says what still blocks a mergeable pull request (`BLOCKED`, `BEHIND`, `UNSTABLE`, `DRAFT`, `HAS_HOOKS`, `CLEAN`, `DIRTY` or `UNKNOWN`).

Capability: Supported

### edit-pr

```bash
gh pr edit <number> --repo <host>/<repo> --body-file <body file>
```

The body is replaced whole, so build the file from the body `read-pr` returned just before: an edit someone made in the meantime then survives. Add `--attach <file>` for captures the new body references. Read back with `read-pr`: `body` matches the file, apart from attachment paths rewritten to URLs.

Capability: Supported

### assign

1. Check: `gh api --hostname <host> repos/<repo>/assignees/<login>` exits 0 (HTTP 204) when the login can be assigned; HTTP 404 means it cannot. Any other failure leaves the answer unknown.
2. Add: `gh pr edit <number> --repo <host>/<repo> --add-assignee <login>`, which keeps the current assignees.
3. Read back `assignees` with `read-pr`. GitHub can accept an assignment and drop it silently, so only the read-back proves it.

Capability: Supported

### ci

1. Take the head SHA from `read-pr`.
2. Wait:

   ```bash
   gh pr checks <number> --repo <host>/<repo> --watch --interval 30
   ```

   It exits 0 when every check passed and 1 when one failed. A long wait outlives a tool timeout: run it in the background, or run it again until it exits on its own; a timeout is not a result. When no check has registered yet, it stops at once with "no checks reported". Right after a push, wait a minute and run it again before treating that as the answer.
3. Read the results of that exact SHA, every page:

   ```bash
   gh api --hostname <host> --paginate "repos/<repo>/commits/<sha>/check-runs?per_page=100" \
     --jq '.check_runs[] | [.name, .status, .conclusion, .app.slug, .html_url] | @tsv'
   gh api --hostname <host> --paginate "repos/<repo>/commits/<sha>/status?per_page=100" \
     --jq '.statuses[] | [.context, .state, .target_url] | @tsv'
   ```

   A check run is finished when `status` is `completed`; `success`, `neutral` and `skipped` pass, and every other conclusion fails. A commit status passes on `success`, waits on `pending`, and fails on `failure` or `error`. The combined `state` of the second call reads `pending` when the SHA has no status at all, so decide from the list. A check that appears after the watch ended starts the wait again.
4. Read `headRefOid` again. When the head moved, these results belong to an older head: start over.
5. Report each check with its result and link, split into gate and advisory checks as `## CI gate` says. A SHA without any check passes only under the path-filter rule in `## CI gate`.

Capability: Supported

### feedback

Read all four, to the last page:

1. Inline comments: `gh api --hostname <host> --paginate "repos/<repo>/pulls/<number>/comments?per_page=100"`. Each has `id`, `in_reply_to_id` (absent on a thread's first comment), `path`, `line` (null once outdated, when `original_line` holds it), `commit_id`, `user.login`, `body` and `html_url`. A reply's `in_reply_to_id` points at its thread's first comment.
2. Thread state:

   ```bash
   gh api graphql --hostname <host> --paginate -f owner=<owner> -f name=<name> -F number=<number> -f query='
   query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
     repository(owner: $owner, name: $name) {
       pullRequest(number: $number) {
         reviewThreads(first: 100, after: $endCursor) {
           pageInfo { hasNextPage endCursor }
           nodes { id isResolved isOutdated path line comments(first: 100) { nodes { fullDatabaseId } } }
         }
       }
     }
   }'
   ```

   A thread's `id` is what `resolve-thread` takes; each comment's `fullDatabaseId`, a string, equals its REST `id` from step 1.
3. Review bodies: `gh api --hostname <host> --paginate "repos/<repo>/pulls/<number>/reviews?per_page=100"`, with `id`, `user.login`, `state`, `body`, `commit_id` and `submitted_at`. A review with an empty body and inline comments is normal.
4. Conversation comments: `gh api --hostname <host> --paginate "repos/<repo>/issues/<number>/comments?per_page=100"`.

`gh pr view --comments` and `--json comments,reviews` leave out inline threads, so they never replace steps 1 and 2.

Capability: Supported

### post-review

1. Anchor every finding to a line of the new file version inside a diff hunk of the head: GitHub rejects the whole review when one comment points outside the diff. The hunks are in each file's `patch` from `gh api --hostname <host> --paginate "repos/<repo>/pulls/<number>/files?per_page=100"`, or in `git diff <remote>/<base>...<head sha>` when a large file has no `patch`. The checkout's line numbers match the new version only at the reviewed head.
2. Write the review as JSON to a file outside the repository, with a serializer such as Python's `json` module rather than by hand, since the texts hold quotes and newlines:

   ```json
   {
     "commit_id": "<head sha>",
     "event": "COMMENT",
     "body": "<summary>",
     "comments": [
       {"path": "src/app.py", "line": 42, "side": "RIGHT", "body": "<finding>"},
       {"path": "src/app.py", "start_line": 50, "start_side": "RIGHT", "line": 54, "side": "RIGHT", "body": "<finding on a range>"}
     ]
   }
   ```

3. Post it: `gh api --hostname <host> --method POST repos/<repo>/pulls/<number>/reviews --input <review file>`.
4. An HTTP 422 posts nothing. Move each comment it names (for example "Line could not be resolved") into the summary as `path:line`, and post again.
5. Read back with `feedback` steps 1 and 3: one new review whose `commit_id` is the head, with the summary and every inline comment.

`event` stays `COMMENT`: `APPROVE` and `REQUEST_CHANGES` are formal verdicts the skills never post.

Capability: Supported

### reply

```bash
gh api --hostname <host> --method POST repos/<repo>/pulls/<number>/comments/<comment id>/replies -F body=@<reply file>
```

`<comment id>` is the thread's first comment, the one without `in_reply_to_id`: GitHub takes no replies to replies. The response's `in_reply_to_id` equals `<comment id>`, and the reply then shows in `feedback` step 1.

Capability: Supported

### resolve-thread

```bash
gh api graphql --hostname <host> -f id=<thread id> -f query='
mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { id isResolved } } }'
```

`<thread id>` comes from `feedback` step 2. The response must show `isResolved: true`.

Capability: Supported

### comment

```bash
gh pr comment <number> --repo <host>/<repo> --body-file <comment file>
```

gh prints the comment's URL, which ends in `#issuecomment-<id>`. Read it back with `gh api --hostname <host> repos/<repo>/issues/comments/<id>`.

Capability: Supported

### merge

1. Run `read-pr` just before: `state` is `OPEN`, `headRefOid` is the reviewed head, and `mergeable` is `MERGEABLE`.
2. Merge with the configured style, pinned to that head:

   ```bash
   gh pr merge <number> --repo <host>/<repo> --squash --match-head-commit <reviewed head sha>
   ```

   GitHub refuses the merge when the head moved. `--auto`, `--admin` and `--delete-branch` stay off. On a base branch with a merge queue the command only adds the pull request to the queue; setup records that case as a fallback, so this command runs only where there is no queue.
3. Read back with `read-pr`: `state` is `MERGED`, `mergeCommit.oid` is set, and `headRefOid` is still the reviewed head. Report a refusal (not mergeable, head moved, checks or reviews missing) as it came; never retry with other flags.

Capability: Supported

### post-merge-ci

1. The merge commit is `mergeCommit.oid` from `read-pr`.
2. List its runs: `gh run list --repo <host>/<repo> --commit <merge sha> --limit 100 --json databaseId,workflowName,event,status,conclusion,url`. Runs can take a minute to appear after the merge.
3. Wait for each: `gh run watch <run id> --repo <host>/<repo> --exit-status --interval 30`, in the background or repeated as in `ci`. It does not work with a fine-grained personal access token; then poll `gh run view <run id> --repo <host>/<repo> --json status,conclusion` instead.
4. Read the check runs and commit statuses of the merge SHA with the two `gh api` calls of `ci` step 3; they also cover CI outside GitHub Actions.
5. When the merged diff touches none of the base-branch workflows' path filters, no run is expected: say so.

Capability: Supported

### attach

`--attach <file>` on `gh pr create`, `gh pr edit` and `gh pr comment` uploads the file and rewrites a Markdown reference to it, such as `![Login form after submit](/tmp/acm-42/ACM-42-login.png)`, into its permanent `https://<host>/user-attachments/assets/<id>` URL; a file the body never references is appended to its end. gh matches the flag and the reference by absolute path, so write the same absolute path in both. An image's alt text can also follow `#` in the flag: `--attach '<file>#<alt text>'`.

To get a URL alone, for a reply or the tracker:

1. `gh pr comment <number> --repo <host>/<repo> --body 'Capture upload' --attach <file>` prints the new comment's URL with its id.
2. `gh api --hostname <host> repos/<repo>/issues/comments/<id> --jq .body` holds the asset URL.
3. Delete that comment: `gh api --hostname <host> --method DELETE repos/<repo>/issues/comments/<id>`. The asset URL outlives it.

Capability: Supported

## CI gate

- Gate checks: none: this repository has no CI.
- Advisory checks: none. Their comments are review feedback; their status is not the gate.
- Path filters: none: there are no workflows. A head whose diff touches none of these paths legitimately reports no gate checks; treat that as a pass only after confirming it from the changed files, and say so wherever CI evidence would go.
- No CI: this repository has no CI (no `.github/workflows/`); write 'no CI configured' wherever CI evidence would go.
- Automation that moves the base branch: none. Re-check that the base is an ancestor of the head immediately before every push.

## Pull requests

- Body format: `docs/agents/pull-request.md`.
- Every body contains `## Review brief`, `## Related work`, `## Attribution`, `## Validation` and `## Human verification`, plus `## Screenshots` when the browser pass is on and `## Changelog` when the changelog is on. When the template lacks one of these, add it to the body you write; never edit the template file.
- Title: `<lead id>[, <rider ids>]: <title>`, with every ticket id first so the tracker can link the pull request.
- Related work: one line per ticket, lead first, in this format: `Ticket: [RG-12](http://localhost:5180/tasks/RG-12)`.
- Closing keywords: never. Reference tickets plainly (`Refs ACM-123`); only `finish-ticket` completes tickets.
- Drafts: never, unless the user asks for one.
- Assignee: none.

## Identity limits

The skills run as `infinitedusky`, the repository owner, who also opens the pull requests. GitHub refuses an approval or change request from a pull request's author, so the verdicts the skills post are workflow evidence, not approvals. `main` has no branch protection or rulesets, so no approval is required to merge.
