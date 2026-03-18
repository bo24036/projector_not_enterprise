# Development Workflow

## Commits

**Small, coherent chunks:** Each commit should represent a single logical change. Examples:
- Add a new component and its tests
- Fix a bug in one system
- Refactor a specific module
- Update dependencies for a feature

Avoid bundling unrelated changes in one commit. This makes history readable and enables clean bisecting.

**Commit after every change:** After completing any code change, commit immediately with an appropriate conventional commit message.

**Commit messages:** Use clear, descriptive messages that explain *what* changed and *why*:
- Bad: `Fix stuff` or `WIP`
- Good: `Add task creation form component` or `Fix race condition in concurrent task fetches`

Format: One-line summary (imperative mood, no period). Follow with details if needed.

## Code Organization

Keep changes focused on the responsibility at hand. Don't:
- Refactor unrelated code while fixing a bug
- Add new features alongside bug fixes
- Reorganize file structure when implementing a feature

When you spot an improvement outside the current task, note it as a follow-up rather than including it in the commit.

## Testing & Review

- Run tests before committing (if tests exist)
- Verify the change works in context (manual test or automated test)
- Review your own diff before committing—catch typos, debug code, incomplete logic
