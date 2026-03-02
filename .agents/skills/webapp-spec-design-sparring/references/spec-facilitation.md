# Spec Facilitation Playbook

## Table of Contents
1. Session Kickoff
2. Question Bank
3. Option Comparison Template
4. Turn Output Contract
5. Living Spec Template
6. Spec Review Checklist

## Session Kickoff

Use this structure at the start of a session:

1. Confirm objective in one sentence.
2. Confirm target users and context.
3. Confirm time horizon:
   - validate idea
   - ship MVP
   - prepare implementation handoff
4. Confirm known constraints:
   - team size
   - deadline
   - stack constraints
   - compliance/security constraints
5. Define immediate output:
   - decision note
   - MVP scope
   - full draft spec

## Question Bank

Select the smallest useful set of questions.

### Problem and User
- What user pain is most urgent?
- Who is the primary user and who is explicitly out of scope?
- What currently blocks the user from success?
- Why solve this now?

### Success and Scope
- What metric determines success in 30-90 days?
- What is the minimum lovable MVP?
- What should be intentionally excluded from MVP?
- What assumptions are currently unproven?

### UX and Product Behavior
- What is the core user journey from entry to success?
- What are required screens and their primary action?
- What are failure/empty/loading states?
- Which actions must be reversible or confirmed?

### Data and API Boundaries
- What are the core entities and their ownership boundaries?
- Which integrations are required for MVP?
- What data must be immutable, auditable, or encrypted?
- Which API contracts are high risk and should be frozen early?

### Non-Functional Requirements
- What latency and availability targets are required?
- What is the expected scale in first 6 months?
- What events and metrics must be observable?
- What security and privacy requirements are mandatory?

### Delivery and Risk
- What are the top 3 delivery risks?
- Which decisions must be made before coding starts?
- What dependencies can block release?
- What is the fallback if a core assumption fails?

## Option Comparison Template

Use when evaluating alternatives:

| Option | Summary | Pros | Cons | Cost | Risk | Recommended |
| --- | --- | --- | --- | --- | --- | --- |
| A |  |  |  | Low/Med/High | Low/Med/High | Yes/No |
| B |  |  |  | Low/Med/High | Low/Med/High | Yes/No |
| C |  |  |  | Low/Med/High | Low/Med/High | Yes/No |

## Turn Output Contract

Use this format in normal conversational turns:

```md
## Decisions
- D1:
- D2:

## Unresolved Questions
- Q1:
- Q2:

## Next Action
- Owner:
- Action:
- Done when:
```

## Living Spec Template

Use this markdown skeleton and update it continuously.

```md
# Product Spec: {feature-or-product-name}

## 1. Objective
- Problem statement:
- Target user:
- Success metric(s):
- Non-goals:

## 2. MVP Scope
- In scope:
- Out of scope:
- Assumptions to validate:

## 3. User Journey
- Entry point:
- Steps to success:
- Alternate paths:
- Error/empty states:

## 4. Functional Requirements
- FR-1:
- FR-2:
- FR-3:

## 5. Data and Integrations
- Entities:
- Data ownership:
- External integrations:
- API boundaries:

## 6. Non-Functional Requirements
- Performance:
- Reliability:
- Security/Privacy:
- Observability:

## 7. Delivery Plan
- Phase 1:
- Phase 2:
- Dependencies:
- Open risks:

## 8. Decisions and Open Questions
- Decision log:
- Open questions:
- Decision owners:
```

## Spec Review Checklist

Before closing a session, check:

- Is the target user precise and singular enough?
- Are success metrics measurable and time-bounded?
- Are MVP and non-MVP boundaries explicit?
- Are key edge cases represented?
- Are data ownership and API boundaries clear?
- Are non-functional requirements testable?
- Are top risks paired with mitigations?
- Is there a concrete next decision owner and due order?

Then lint the draft if script is available:
- `python3 scripts/spec_lint.py <path-to-spec-md>`
