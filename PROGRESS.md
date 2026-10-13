# Execution ledger — plan: outputs/投资命题验证Agent_实施清单.md

## Preflight
- Spec approved by user; inline execution authorized. Prototype drawing delegated by explicit user request to chat 01a13779-149e-7de3-ad4f-bb6dd632e08c, in its own directory.
- Tasks 1→2: Evidence and ToolResult contracts shared; standardization precedes inference.
- Tasks 2→3→4: RunEvent.versionId must isolate revisions; server persisted events are authoritative.
- Task 5 consumes every task and requires deployed integration checks.

## Rulings
- Ruling: Fresh isolated Git repository on build/investment-verifier replaces a linked worktree, because there is no existing repository or shared branch — no user files are reset or copied.
- Ruling: Use Node's built-in TypeScript-capable test runner instead of adding Vitest — fewer dependencies; assertions and test coverage remain the same.
- Ruling: Windows Bash bookkeeping helpers are replaced by this committed ledger and explicit commands — keep progress and evidence across context compaction.
- Ruling: Install npm locally from its official registry, because the bundled runtime contains Node but no npm — do not modify global tools.

## Current state
- Task 1: in progress. Supplied Vinext starter copied; Node 24 verified. Site registered: appgprj_6aceb6ba035481918f6647539d6cc8dd; manifest persisted.
- Dependency install initially failed before any packages were installed: npm missing. Local npm bootstrap and retry started.
- GitHub browser identity yishu-glitch verified; CLI authorization is still pending.
- OPENAI_MODEL not selected yet; OpenAI directory authorization verified, generation not yet tested.

- Backend milestone: 15 behavioral tests pass; local Cloudflare simulation connects to OpenAI/Fuyao/iFinD; first real research returned 不支持 because 2025 profit declined. 8 tool calls, main loop 90587 input/2489 output tokens before compaction optimization. Fixed partial-data retention and URL-only support validation after RED→GREEN tests. Prototype remains under user revision; no formal frontend implemented yet.
