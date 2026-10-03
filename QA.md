# Elsewhere verification — 3 October 2026

## Automated checks

- `npm test`: **51 tests passed** across matching/persistence/export, live-response validation, civic workflow, monitoring and server research boundaries.
- `npm run build`: TypeScript and production build passed. Vite reports the separate Three.js chunk above its default 500 KB warning threshold (about 135 KB gzip). The scene is asynchronous; this warning is documented, not hidden.
- `npm run format:check`: checked after final formatting.

Coverage includes five sourced projects, filter behavior, unknown costs/staff/time, unmet requirements, preservation of older saved work, advisor profile restoration, invalid advisor references, corrupt state, failed storage, source-linked exports, distinct proposals for user-created places, and invalid/failed public weather responses.

## Browser checks

Tested through the Codex browser. The user's existing `127.0.0.1:5174` work was preserved. A separate `localhost:5174` origin held an explicitly labelled QA advisor workspace for Gdańsk, avoiding invented records in the user's working pilot.

- Welcome: actual WebGL city scene renders; pause/play toggles work; approach anchor reaches the explanatory section; primary CTA enters the advisor workflow.
- Entry: own municipality is the primary option; Kraków is an optional walkthrough. Name and municipality setup creates a workspace with unknown local context. Returning entry offers resume and switching.
- Guided flow: Kraków brief → heat projects → Barcelona case → local readiness. Source facts carry reporting dates; local conditions remain unknown until entered. The existing pilot is preserved.
- Own-place flow: Gdańsk QA profile → public services → Helsinki-info → editable local proposal → new pilot. The local goal and edited proposal appear in the pilot. No Kraków context or weather is attributed to Gdańsk.
- Persistence: pilot proposal and edited role assignments survive an actual browser reload.
- Export: Copy pilot produces the source-linked Markdown with the entered goal/proposal. Download anchor and filename verified; a completed OS file save was not independently confirmed in the in-app browser.
- Pilot: Purpose, Delivery and Learning pages and sequential navigation operate. Source-reported facts stay separate from the proposed local outcome.
- Profile editor: mobile three-step form remains accessible and consistently styled.
- Responsive: welcome visually inspected at 1440, 768, 390 and 320 pixels wide. Main-page document width matches viewport after fixing the canvas overflow. Mobile entry, profile editing and pilot learning were visually inspected at 390 pixels.
- Console: no application errors observed in the isolated QA session. A deprecated Three.js shadow-setting warning was found and corrected to `PCFShadowMap`.
- Motion: pause/play browser tested; reduced-motion and offscreen/hidden-page behavior inspected in code. Reduced-motion disables the procedural movement and CSS transitions. No automated accessibility or performance score is claimed.

## Agentic workflow verification

The new workflow was exercised on the separate `localhost:5174` QA origin. Three explicitly labelled test submissions and a QA contributor/document were kept away from the user's `127.0.0.1` workspace.

- Guided entry now opens Team & data. Authority confirmation, contributor creation and owned document entry work and persist.
- Two distinct public-service concerns rank first; a separate waste idea does not inflate complaint volume. Local research returns the documented Helsinki lead. Its factor ledger shows sourced 2024 municipal populations and unknown delivery prerequisites.
- Inspecting a resident-led case preserves the advisor’s original municipal focus; it does not silently rewrite the brief.
- Unsupported waste idea is held for investigation, with no default decision-queue entry. Shortlisting without a written reason is rejected.
- Five-stage local runs expose actual input/output. Completed handoffs replay with an explicit replay label. Reload restores run history and sources.
- Withholding resident reports changes the Listener input to zero and excludes their topics from the new run. Automated checks separately cover withheld resources/context/library, duplicates, intake review, conservative idea triage and stale evidence detection.
- Real source checking succeeded for Barcelona, Paris, Medellín, Singapore and Helsinki. The first baseline generated no source-change alert. A PDF was initially shown as unsupported; the final watchlist deliberately monitors HTML pages only. Changed/unchanged/failed checks are covered in tests, including preserving the last successful hash through an outage.
- Server tests use a mocked provider: explicit consent and per-document/report permission, five streamed stages, actual-search/citation requirements, incomplete-call handling, contact redaction, response-key exclusion, same-origin restriction, URL/redirect allowlisting and malformed requests. No paid live provider call was made; production credentials and provider availability remain unverified.
- Mobile agent studio checked at 390 px, including readable step navigation and no horizontal page overflow. Desktop studio and resident/data views inspected. Research export anchor contents are checked in the UI; OS file-save completion is not claimed.

## Scope and remaining release work

This is a device-saved preview, now publicly hosted at https://cityrelay.vercel.app, with no authenticated login or server-side shared workspace. It does not contact another city or claim endorsement. Operational municipal use needs the real account/storage infrastructure. Provider availability and municipal source freshness are external dependencies. The verified catalogue is maintained manually; the new source watcher detects public page changes for review. Live AI is integrated but not configured. Always-on monitoring and cross-device collaboration require deployed infrastructure.

Live APIs retain explicit failure states; this turn observed a successfully loaded IMGW temperature in the Kraków brief. The value is not frozen into the app. Historical programme facts are not real-time inventories.

Original supplied hackathon documents and the earlier CityRelay prototype were reviewed. AI assistance, previous work, libraries and data providers are disclosed in README and THIRD_PARTY_NOTICES.

## Vercel preparation

Added SPA deep-link rewrites and a serverless public-preview API. Automated tests cover Vercel's pre-parsed JSON body, request-size enforcement, same-origin public POSTs, preservation of local-only restrictions and unconditional disabling of paid research in public mode. Vercel successfully deployed commit `2c6f2da` to https://cityrelay.vercel.app on 3 October 2026. The production dashboard identifies GitHub `main` as its update source.

Verified on the public domain: welcome page, guided Kraków entry, direct `/community/krakow/agents` reload, completed five-stage local analysis, source-monitor API and successful checks of all five public HTML sources. An unauthenticated HTTP request to `/api/status` succeeded with AI explicitly disabled. No local private workspace content was uploaded; the live domain starts with its own browser storage. Screenshot: `artifacts/elsewhere-live-vercel.png`.
