# Fiscus: Product Requirements Document

Oct 12, 2026 · @Praba

| Field | Value |
| --- | --- |
| Status | Revised for the offline-first Flutter app ([ADR-0002](../architecture/decisions/0002-offline-first-mobile-app.md)) and the web app without a PWA (Q-08). It waits for your acceptance at the Stage 0 sign-off; blocking questions are in 6.2 |
| Version | 1.1 |
| Owner | @Praba |
| Stakeholders | Owner only (single-maintainer project) |
| Last updated | Oct 12, 2026 |

## Revision notes

| # | Change | Why |
| --- | --- | --- |
| 1 | v1.0: the first Fiscus PRD, covering the core platform and ledger and budgets, with US, AC, FR, BR, EC, NFR, A and Q IDs | Traceability for tickets and tests |
| 2 | v1.1: Phase 3, the phone app, with US-19 to US-24, FR-34 to FR-44, BR-35 to BR-38, EC-23 to EC-28, NFR-23 to NFR-25, A-15 and the `fiscus:settings` scope. The PWA is removed, and FR-14, FR-19, NFR-16, NFR-17, EC-02, EC-04, EC-16 and AC-08.3 are restated | ADR-0002 accepted, Q-07, Q-01 and Q-08 answered (11 and 12 Oct 2026) |

## Contents

1. [Document overview & objectives](1-overview-and-objectives.md)
2. [Actors & access matrix (RBAC)](2-actors-and-access-matrix.md)
3. [User stories & acceptance criteria](3-user-stories.md)
4. Functional requirements & business rules
   - [4.1 Workflow](4.1-workflow.md)
   - [4.2 Business rules & validation](4.2-business-rules.md)
   - [4.3 State lifecycle](4.3-state-lifecycle.md)
   - [4.4 Edge cases & error handling](4.4-edge-cases.md)
5. Technical & integration specifications (high level)
   - [5.1 Integration touchpoints](5.1-integration-touchpoints.md)
   - [5.2 Notifications & events](5.2-notifications-and-events.md)
   - [5.3 Non-functional requirements](5.3-non-functional-requirements.md)
   - [5.4 Repository layout](5.4-repository-layout.md)
6. [Open questions & assumptions](6-open-questions-and-assumptions.md)

## Sources

- [Apion README](https://github.com/mdepraba/apion/blob/main/README.md): stack, systemd deploy, and why Docker does not run on the LXC host
- [Apion PRD 07, platform architecture and operations](https://github.com/mdepraba/apion/blob/main/docs/prd/07-platform-architecture-and-operations.md): 1 GB budget, PostgreSQL limits, UUIDv7, backups
- [apion.service](https://github.com/mdepraba/apion/blob/main/deploy/apion.service): memory caps and sandboxing reused for the systemd units
- Your budgeting and money-manager-exporter skills: accounts, categories, TSV schema, pay-cycle and budget rules
