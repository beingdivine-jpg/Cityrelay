# Audit remediation plan

The acceptance target is an understandable advisor journey from a chosen challenge to an evidence-backed, recoverable pilot, with a separate resident reporting journey and truthful identity/delivery status.

1. Preserve drafts when adding evidence; add pilot checkpoints and whole-workspace backup/recovery.
2. Ask for a challenge before recommendations; retain advisor identity; derive city context from the route; simplify navigation.
3. Use one implementation checklist across retrieval, detail, pilot and export; add evidence/owner resolution; separate human review from implementation approval; preserve uncovered resident topics.
4. Complete English/Polish generated content, form feedback, responsive controls, route titles, error recovery and lazy loading.
5. Add configurable Supabase authentication, workspace membership, versioned shared persistence and resident delivery with database authorization. Keep local exploration explicitly separate. Never upload local work implicitly.
6. Verify regressions, build, responsive browser journeys, storage failure/recovery and production deployment. Record unavailable external integration checks explicitly.

External prerequisites: a user-owned Supabase project with the reviewed migration applied, authentication redirect settings and public project configuration; live AI requires separately configured credentials and persistent usage controls. These must not be represented as connected before verification.

No user data should be discarded or silently moved to a cloud workspace. Municipal identity remains self-described until independently verified. Human approval, not the agent animation, governs implementation decisions.

## Implementation status — 4 October 2026

Stages 1–4 are implemented and covered by regression tests plus the isolated browser checks in QA.md. Stage 5 is implemented with real database authorization tests, explicit cloud saving, conflict handling, email-bound membership and revocation, resident receipts and intake review. The daily source checker has authentication, disabled-workspace and change/outage regression coverage.

External activation is pending: the user signed in to Supabase; a free CityRelay organization was created. Project creation requires the user's database-password entry. Until the project exists and its migration, auth redirects and environment configuration are applied, shared accounts stay visibly disconnected. Production email delivery, two-account collaboration, scheduled execution and a consented provider run remain unverified. This is an explicit release gate, not a completed feature claim.

The tested fixes were deployed to https://cityrelay.vercel.app from commit `93eb091`. Production challenge/account views and the API status were checked. The remaining release gates are external activation and connected-service verification above.
