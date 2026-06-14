# DD-game

This repository is currently empty. It is intended for a game project.

---

# Subagent Requirements

This project MUST use specialized subagents throughout planning, implementation, testing, debugging, security review, and documentation.

Do not perform all work using a single general-purpose agent.

Delegate tasks to the appropriate subagent whenever possible.

## Subagent Quick Reference

| Agent | When to use |
|---|---|
| `@code-reviewer` | Architecture review, PR review, feature completion, before merges |
| `@security-auditor` | Auth, AI integration, API, database, before beta/prod releases |
| `@docs-writer` | After milestones, before releases, when APIs or architecture change |
| `@debugger` | Test/build/runtime failures, performance degradation |

---

## `@code-reviewer`

**Capabilities:** Read-only, Git analysis, code analysis, architecture review, refactoring recommendations.

**Must be used:**
- Before major merges
- After feature completion
- Before release milestones

**Output:** Findings, risk assessments, improvement recommendations, code quality score.

---

## `@security-auditor`

**Capabilities:** Read-only, web research, security analysis.

**Must be used:**
- After authentication implementation
- After AI integration implementation
- Before beta release
- Before production release

**Output:** Vulnerability report, risk severity levels, remediation recommendations.

---

## `@docs-writer`

**Capabilities:** Documentation editing and creation. No bash execution.

**Must be used:**
- After every completed milestone
- Before release
- Whenever APIs change
- Whenever architecture changes

**Output:** Updated documentation, user-facing guides, developer references.

---

## `@debugger`

**Capabilities:** Full file editing, full bash access, testing, investigation, bug fixing.

**Must be used:**
- Whenever tests fail
- Whenever builds fail
- Whenever runtime exceptions occur
- Whenever performance degrades

**Output:** Root cause analysis, fix implementation, validation results.

---

# Required Development Workflow

For every major feature:

1. Implement feature
2. Run tests
3. Invoke `@code-reviewer`
4. Resolve findings
5. Invoke `@security-auditor` if security-related
6. Update documentation using `@docs-writer`
7. Validate with `@debugger` if issues arise
8. Merge only after all reviews pass

---

# Feature-Specific Workflows

## Combat Engine
- **Implementation:** Primary agent builds feature
- **Review:** `@code-reviewer` validates architecture; `@debugger` validates calculations

## AI Dungeon Master
- **Implementation:** Primary agent builds prompts and orchestration
- **Review:** `@code-reviewer` reviews prompt architecture; `@security-auditor` reviews prompt injection risks

## Memory / RAG System
- **Implementation:** Primary agent builds memory engine
- **Review:** `@code-reviewer` reviews retrieval logic; `@security-auditor` reviews data isolation

## Authentication
- **Implementation:** Primary agent builds feature
- **Mandatory review:** `@security-auditor`, `@code-reviewer`

## API Layer
- **Implementation:** Primary agent builds endpoints
- **Mandatory review:** `@security-auditor`, `@code-reviewer`

---

# Autonomous Agent Expectations

The system should proactively choose the most appropriate subagent.

- Architecture concerns → `@code-reviewer`
- Security concerns → `@security-auditor`
- Documentation work → `@docs-writer`
- Build failures → `@debugger`

Do not wait for user instruction when a specialist review is clearly beneficial.

---

# Definition of Done

A feature is only considered complete when:

- [ ] Implementation is complete
- [ ] Tests pass
- [ ] `@code-reviewer` has reviewed it
- [ ] `@security-auditor` has reviewed it (when applicable)
- [ ] Documentation is updated by `@docs-writer`
- [ ] Runtime validation has been completed
- [ ] No critical findings remain

Features that have not completed this workflow are considered unfinished.
