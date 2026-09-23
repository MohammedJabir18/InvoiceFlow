# AGENTS.md

Project harness for reliable agent-assisted development in a rust codebase.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd`
2. **Read this file** completely
3. **Read project docs if present** (`docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, README, or equivalent)
4. **Run `./init.sh`** to verify environment is healthy
5. **Read `feature_list.json`** to see current feature state
6. **Review recent commits** with `git log --oneline -5`

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `cd apps/desktop && bun run build`
- `cargo check --workspace`

## Installed Local Skills (`.agents/skills/` & `.claude/skills/`)

The following local skill suites are installed for high-craft UI/UX, motion engineering, and rigorous review:
- **Design & Taste**:
  - `taste-skill` / `minimalist-skill` / `brutalist-skill` / `soft-skill`: Anti-slop frontend craftsmanship for landing pages, dashboards, and app views.
  - `frontend-design`: Distinctive, intentional, production-quality visual design (Anthropic).
  - `impeccable`: Design critique, typography, layout, and polish engine.
  - `ui-ux-pro-max`: Multi-stack UI/UX design intelligence, design tokens, charts, color palettes, and component reasoning.
  - `brand-guidelines` & `theme-factory`: Visual identity, theme palettes, and artifact styling.
- **Motion & Interaction Engineering**:
  - `design-motion-principles`: Deep motion design guidelines based on Emil Kowalski & Jakub Krehel.
  - `animate`, `apple-design`, `emil-design-eng`, `improve-animations`, `review-animations`, `find-animation-opportunities`: Emil Kowalski's complete animation and interaction suite.
- **gstack Production Suite (Garry Tan / YC)**:
  - `gstack`: Central router for review, QA, shipping, and design consultation.
  - Standalone skills: `gstack-design-review`, `gstack-plan-ceo-review`, `gstack-review`, `gstack-qa`, `gstack-ship`, `gstack-office-hours`, `gstack-investigate`.

## Escalation

If you encounter:
- **Architecture decisions**: Consult project architecture docs if present, otherwise ask user
- **Unclear requirements**: Check product/requirements docs if present, otherwise ask user
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
