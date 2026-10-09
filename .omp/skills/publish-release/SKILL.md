---
name: publish-release
description: Publish a new version of the Zombie Sword game (LLMGame): commit, tag, create a GitHub release, verify the GitHub Pages deployment.
---

# Publishing a new version

Repo: `Danggg/LLMGame` (public). GitHub Pages serves **`main` from repo root** at
`https://danggg.github.io/LLMGame/` — pushing to `main` automatically updates the live site.
Account is on the GitHub **Free** plan, so the repo **must stay public** or Pages breaks.

## Steps

### 1. Sanity check the build

```bash
for f in src/*.js; do node --check "$f" || exit 1; done
# confirm index.html lists every src/*.js in load order
```

### 2. Commit and push to `main`

```bash
git add -A
git commit -m "<concise message>"
git push origin main
```

### 3. Tag the version

Find the latest tag, bump semver, tag, push:

```bash
git tag --sort=-v:refname | head -1   # e.g. v1.0.0 -> next v1.1.0
git tag v1.1.0
git push origin v1.1.0
```

### 4. Create the GitHub release

`gh` must be authenticated as `Danggg` (check `gh auth status`). Include what changed:

```bash
gh release create v1.1.0 \
  --title "Zombie Sword v1.1.0 — <milestone name>" \
  --notes "<bulleted list of changes>"
```

### 5. Verify the Pages deployment

```bash
# poll until status is "built" (usually under a minute; a brief "errored"
# right after pushing is normal for the initial build of a commit)
gh api repos/Danggg/LLMGame/pages --jq '.status'

# smoke check: site + every script must return 200
curl -s -o /dev/null -w "%{http_code}\n" https://danggg.github.io/LLMGame/
for f in util audio state ground particles zombies player render input main; do
  curl -s -o /dev/null -w "$f.js: %{http_code}\n" "https://danggg.github.io/LLMGame/src/$f.js"
done
```

## Invariants

- Pages source is `main` at `/` — never point it at a tag; the live site always tracks `main`.
- The tagged commit should equal the commit currently on `main` (tag what is live).
- Release notes describe the user-visible delta since the previous tag, not the whole milestone.
