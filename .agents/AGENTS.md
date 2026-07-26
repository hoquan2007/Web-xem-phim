# Workspace Agent Rules

- **Strict Task Completion Workflow**:
  After completing each task specified in `Plan.md`, the Agent MUST:
  1. Run verification commands: `npx tsc --noEmit` and `npm run build`.
  2. Update `Plan.md` checklist with status `✅ Completed` and test notes.
  3. Execute `git add .`, `git commit -m "feat: complete task X - [task title]"`, and `git push origin main`.
