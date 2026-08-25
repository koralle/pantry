---
name: superpowers-goal
description: >
  Use only as a Cursor Custom Mode for /goal sessions that should follow
  the Superpowers software-development workflow. Do not invoke for ordinary
  development tasks or normal chat sessions.
---

# Superpowers Goal

Use this skill as the orchestration layer for Cursor `/goal`.

The objective is to follow the Superpowers development methodology for the
entire goal without enabling the Superpowers workflow in ordinary sessions.

## Core rule

Process skills define HOW work is performed.

When this mode is active, invoke the relevant skills explicitly and follow
their instructions rather than reproducing their behavior from memory.

Do not skip a required process because the implementation appears simple.

## Phase 1: Establish the design authority

Determine whether the goal already provides an approved design or specification.

Examples:

- an approved design PR
- an approved spec document
- an implementation design explicitly provided by the user
- an existing implementation plan explicitly designated as authoritative

### If an approved design exists

Treat that document as the design authority.

Do NOT run `brainstorming` merely to redesign an already-approved solution.

Proceed to workspace preparation and planning.

### If no approved design exists

Invoke and follow:

`brainstorming`

Do not begin implementation until the design/spec has passed the approval
gates required by that skill.

## Phase 2: Prepare an isolated workspace

Use the project's `herdr` skill to ensure implementation happens in an
isolated worktree.

If the current workspace is already the intended isolated worktree, do not
create another one.

Do not use `using-git-worktrees`; `herdr` owns worktree management for this
project.

## Phase 3: Create the implementation plan

Invoke and follow:

`writing-plans`

The plan must be based on the approved design authority.

Do not begin implementation until the plan is complete and self-reviewed.

## Phase 4: Execute the plan

Prefer:

`subagent-driven-development`

Use a fresh implementation subagent for each appropriate plan task and
preserve the review gates defined by that skill.

If subagent-driven execution is unavailable, use `executing-plans` if it is
installed.

### During implementation

Before writing implementation code where the Superpowers TDD workflow
applies, invoke and follow:

`test-driven-development`

When a bug, failing test, unexpected behavior, or unexplained failure occurs,
invoke and follow:

`systematic-debugging`

Do not guess at fixes before establishing root cause.

When explicit code-review feedback is received, invoke and follow:

`receiving-code-review`

Use `requesting-code-review` where required by the selected execution
workflow. Do not duplicate review passes already mandated by
`subagent-driven-development` unless an independent final review is useful.

Use `dispatching-parallel-agents` only when multiple tasks are genuinely
independent and parallel execution will not create conflicting edits.

## Phase 5: Verify the completed goal

Before claiming that the goal is complete, invoke and follow:

`verification-before-completion`

Verification must use fresh evidence appropriate to the repository, such as:

- tests
- type checking
- linting
- builds
- relevant end-to-end checks

Never infer success from implementation alone.

## Phase 6: Finish the development branch

After verification succeeds, invoke and follow:

`finishing-a-development-branch`

Do not merge, push, delete branches, or create a PR unless allowed by the
goal and project instructions.

If the `/goal` explicitly requires a PR, carry the goal through PR creation
and any required final checks.

## Completion condition

The `/goal` is complete only when:

1. the approved design/spec is satisfied;
2. all implementation-plan tasks are complete;
3. required reviews are resolved;
4. fresh verification passes;
5. branch/PR handling required by the goal is complete.

Do not stop merely because the code has been written.
