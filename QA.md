# Jury walkthrough and prepared demo inputs — 4 October 2026

- Added a prominent Jury walkthrough entry and a 12-step, English/Polish guide. A native modal establishes the advisor role and demo boundaries; the contextual guide highlights real controls, explains each action, waits for actual agent completion and finishes only after the PDF has been prepared. Closing/minimizing does not cancel an investigation. Progress is saved per browser tab, with route recovery and a safe shortcut to an existing current, completed investigation.
- Kraków rehearsal inputs now include a hypothetical PLN 25,000 discovery/pilot budget with a breakdown, staffing, a six-week sequence, site checks and evidence notes. Missing notes are filled for new and existing demos without replacing authored findings, plans or the operational Kraków workspace. Sample provenance cannot promote a readiness check to confirmed. A clear Continue with demo assumptions action lets jury members draft the pilot without supplying municipal documents. Downloads retain the sample notes and disclosure.
- Browser verification on isolated port 4187 covered every action from home through resident voices, shared inputs, all four handoffs in a default paced five-agent run, comparison, Barcelona source/local-fit review, pilot creation and an actual PDF download. A second Polish rehearsal reused the completed investigation, preserved the pilot and downloaded it again. Minimize, reload, resume and panel recovery were verified. No browser console errors were recorded.
- Desktop and Polish 390/320 px views were inspected. Page width matches both mobile viewports. A 320 px overlap was fixed: the real continuation button scrolls above the bottom guide. The guide header remains available while its longer text scrolls.
- **102 tests pass across 13 files**, including new action-gating, sample isolation, existing-work preservation, sample-readiness and Polish-copy coverage. Production build and diff checks pass. Optional external AI, shared authentication and background monitoring configuration are unchanged.

---

# Ideas in orbit — 4 October 2026

- Replaced the welcome’s flat map with an orthographic globe built from the existing Natural Earth geography and documented city coordinates. Illuminated land points, moving elevated routes and travelling light markers illustrate knowledge exchange; they do not claim live discoveries or actual municipal partnerships.
- A seven-second city tour rotates the globe between documented projects. City selection opens a spotlight and pauses the tour; next-city, left/right controls and desktop pointer dragging provide manual exploration. Existing primary-source links remain visible.
- Animation is capped at 30 fps with shared projection trigonometry and batched land dots. Rendering and the tour stop when hidden/offscreen. Pause freezes the scene; reduced-motion preferences are observed at mount and on change, with manual city/turn controls retained.
- English and Polish labels include the canvas city marker. Browser inspection covered desktop and 390/320 px Polish layouts without horizontal overflow, Singapore source URL, manual turn controls and desktop dragging, automatic spotlight changes, and zero console errors. Two paused screenshots taken separately were byte-identical; Play resumed the tour. Reduced-motion behavior was reviewed in code rather than changing the user’s system settings.
- **97 tests passed across 12 files**, including coordinate centring, lifted route endpoints, shortest rotation over the date line and coincident endpoints. Build, formatting and diff checks pass. No new dependency or backend behavior; the lazy atlas JavaScript grows by about 3 KB gzip.

---

# Downloadable pilots and visible agent work — 4 October 2026

- Added a prominent PDF download alongside Markdown and clipboard export. The PDF uses the complete existing export (authored edits, context, evidence, unresolved checks, source URLs and observations), with paginated layout, selectable text, clickable source links and embedded Polish glyphs. PDF code is loaded only when requested; generation stays on the device. Existing authored content keeps its language when interface language changes.
- Added a five-node agent network, animated active node and input paths, a rolling scan record, visible method/pacing note and an evidence-transfer animation. All record labels/counts come from actual events. Source status stays tied to request callbacks. Reading intervals are disclosed; no new AI provider or broad live web discovery is claimed.
- Handoffs now scroll back to the next active stage; inspecting another agent turns off automatic following. Stop remains available and interrupted runs retain their records. Source requests are expanded by default.
- Internal links and programmatic navigation use React Router view transitions, with a content-entry fallback and reduced-motion handling. Evidence and pilot section changes animate. The router uses the existing friendly recovery screen for missing chunks or rendering failures.
- **93 tests passed across 11 files.** New PDF tests cover long-document pagination, source link annotations, embedded Unicode fonts and filenames. Existing per-action sequencing, cancellation and real source callback tests continue to pass. Production build, formatting and diff checks pass.
- Browser checks on isolated port 4185: complete five-stage guided run; five successful municipal source requests; real English and Polish PDF downloads confirmed in Downloads and rendered for visual inspection; comparison to evidence to pilot creation; Polish mobile node following and stop/save; 390 and 320 px layouts with no document overflow. Browser automation did not emit a download event, but both files were saved successfully and inspected directly.
- PDF rendering was reviewed in English and Polish, including multi-page source sections and diacritics. Generated font instance retains the original OFL licence. No account, provider, shared-storage or deployment credential changes.

---

# Civic atlas art direction — 4 October 2026

- Replaced the welcome composition with an interactive Natural Earth atlas, sourced city selectors, a concise municipal-advisor entry and a shared typographic system. City selection pauses the presentation; pause/play and reduced-motion support remain. Dateline-crossing polygons are unwrapped so they do not draw across the map.
- Rebuilt the research room as a current-task stage alongside a continuously visible working record. A graphic plots real recorded events; detailed filters, scope and reading pace sit in a disclosure. The agent sequence is horizontal and follows the selected agent on narrow screens. Existing processing, handoffs, cancellation, saved logs and source requests are preserved.
- Applied deep green, mineral grey and lime with sharper typography and fewer decorative surfaces across listening, research, comparison, project evidence, forms and pilot drafting. Replaced the old project cartoons with labelled conceptual diagrams; these do not claim to be site plans.
- Browser verification at isolated port 4184 covered the English/Polish atlas, the correct Helsinki municipal source link, pause state, 320/390 px layouts without document overflow, all five Polish agent handoffs, five successful actual source requests, completed research, Barcelona evidence and creation of an editable local pilot. Existing production data is not reset.
- **91 tests pass across 10 files**. Production build, formatting and diff checks pass. The atlas is loaded separately; the emitted main bundle is approximately 357 kB and no build chunk warning remains.
- This is a presentation redesign. It does not configure an AI provider, Supabase, identity verification or background monitoring. Fictional resident examples and unknown local feasibility conditions retain their disclosures.

---

# Progressive agent activity — 4 October 2026

- Local analysis now yields after each recorded action. The default **Reading pace** uses disclosed reading intervals; **Full speed** removes those intervals. Real HTTP request callbacks are recorded immediately and are not paced or simulated.
- The selected agent has a current-action panel, elapsed stage time, action count and its own log. Users can inspect prior agents without restarting the run, return to the working agent, or view the complete investigation. Existing source/search/check filters and explicit stage handoffs remain.
- Resident topic grouping and brief assembly expose their actual intermediate records. Live request rows distinguish pending, retrieved and unavailable responses. Stopping an active stage preserves its partial log and marks it stopped, including after reload.
- **91 tests passed across 10 files**, including new sequencing/backpressure, per-action cancellation/timer cleanup and unpaced source callback tests. Production build, formatting and diff checks pass. The existing main bundle warning remains.
- Browser checks on isolated port 4184: incremental Listener events; City analyst handoff; catalogue retrieval and five correctly reported source timeouts; inspecting Research scout while Fit reviewer continues; return-to-active control; cancellation and reload persistence; full-speed completion through all five stages. Polish controls were visually inspected at 390 px; document width matches both 390 px and 320 px viewports.
- No new AI provider, broad web search, institutional identity verification or backend configuration is claimed. This changes execution visibility and review pacing, preserving the existing matching and consent rules.

---

# Civic studio redesign — 4 October 2026

- Rebuilt the visual presentation around apricot, aubergine, vermilion, lavender and chartreuse, with editorial serif typography, an original animated city illustration and distinct project motifs. The welcome scene is conceptual artwork, not a live feed or map; its three city selectors link to existing documented sources. Pause and reduced-motion handling are present.
- Replaced the demo’s overview panels with a listening desk: eligible topic counts, one sample resident voice at a time, a complete-inbox link and a clear research action. Four persistent chapters are labelled Listen, Research, Compare and Your pilot. Supporting tools and research settings remain available through disclosures.
- Preserved the data model, source catalogue, analysis rules, consent, agent execution, history, evidence checks, pilot drafting and account/storage behavior. Existing tests: **88 passed across nine files**. Production build passes; the main application chunk still exceeds Vite’s warning threshold. The welcome page no longer loads Three.js.
- Browser checks on the isolated 4183 preview: English and Polish welcome layouts; interactive Helsinki source selection; pause button state; resident topic changes and paging; all five research handoffs; completed record and comparison; source review and preserved existing pilot. A rebuild during preview navigation removed an old lazy chunk; reload restored the saved plan without resetting data.
- Desktop welcome, listening desk, research console, comparison and pilot surfaces were visually inspected. English/Polish welcome and Polish listening/research views were checked at 390 and 320 pixels where applicable; measured document widths matched the tested viewport. The long Polish headline and language-switch contrast were corrected.
- The local source-check run returned five timed-out requests, visibly recorded as unavailable. No successful live retrieval is claimed for that run. Provider/server integration was not changed by this presentation work.

---

# Kraków demo and observable agent workflow — 4 October 2026

- Automated verification: **88 tests passed across nine files**. Production build passed; existing application and lazy Three.js chunk-size warnings remain.
- `/demo` creates an isolated, idempotent `krakow-demo` workspace. It preserves existing advisor work and seeds 18 explicitly fictional intake records: 13 unique complaints, three ideas, one duplicate and one held item. Sample contributors and the planning document are labelled; authority, cost, staffing and site permissions are not fabricated as confirmed.
- Home and entry prioritise the demo. The route is resident voices → five agent stages → documented findings → an editable pilot. Sample work cannot be uploaded as an operational shared workspace; exported plans and activity records carry demo disclosures.
- The default run pauses at actual handoffs. The chronological log records grouping, excluded reports, data permissions, catalogue queries, retrieved candidates, live page checks, evidence gaps, fit factors, idea triage and outputs. Search/source/check filters, cancellation, run history and JSON export are available. No artificial delays or replay presented as live execution.
- Browser verification used the separate `127.0.0.1:4183` origin. All five approved source pages returned successfully during a real source-check run. Completed logs survived navigation and refresh. Cancellation after the Listener retained 22 events and a failed run; the earlier complete record remained inspectable.
- The Polish route was followed from the demo inbox through the agent workroom, findings, Barcelona evidence/local checks and an editable pilot. Sample report titles and text have translation coverage. Authored resident text remains unchanged.
- Desktop agent workroom visually checked; Polish mobile log and handoff controls checked at 390 px, with document width matching the viewport at both 390 and 320 px.
- Local rules and current HTTP source checks are explicitly distinguished from unconfigured LLM web research. Provider tests are mocked; this work does not configure paid AI, Supabase, shared resident delivery or always-on monitoring.

---

# Audit remediation verification — 4 October 2026

## Current implementation

- `npm test`: **81 tests passed in eight files**.
- TypeScript and production build passed; the main and lazy Three.js chunks still exceed the default warning threshold.
- Format and diff checks run before commit.

The audit remediation plan is in AUDIT_REMEDIATION.md. Current automated coverage includes preservation of authored pilot fields, full checkpoint validation and shared-copy remapping, Polish generated proposals for all five cases, area-aware duplicate intake, unsupported-topic visibility, consistent implementation checks, and withheld resource evidence. The PostgreSQL suite executes the actual migration in PGlite, testing RLS isolation, revision conflicts, private intake, email-bound invitations, owner revocation and atomic research quotas. These are database logic tests, not a claim of deployed email or Supabase verification.

Browser checks on the isolated `127.0.0.1:4182` production preview:

- A new Lublin workspace begins with no challenge selected. Choosing public services yields the documented Helsinki case.
- The four-step journey and secondary tools work in Polish at 390px; the viewport has no horizontal overflow on the challenge page.
- Helsinki → edited pilot → Barcelona added as evidence retains the exact original authored proposal. Both sources appear in the pilot.
- Saving a checkpoint, changing the proposal and restoring the checkpoint recovers the original text and keeps the intervening version. Exported QA workspace JSON was validated and restored through the browser file picker.
- Language, source dates, unknown readiness checks and explicit local/device status are visible. The user's existing localhost/live workspaces were preserved.

Production: commit `93eb091` was pushed to GitHub main and Vercel reported success. The live Kraków challenge and Account & backup pages were inspected in Polish; the new city/sign-in/save banner is visible and the console reported no warnings or errors in this check. Shared accounts correctly display disconnected. `/api/status` reports AI and background monitoring disabled until configured.

Connected-release verification is tracked separately in BACKEND_SETUP.md. Until actual production checks are recorded, do not treat email delivery, shared account switching, scheduled execution or paid AI as verified. Historical results below describe previous builds only.

---

## Historical verification — 3 October 2026

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

## English / Polish — 3 October 2026

- Verified a visible English / Polski header switch on desktop and at 390px.
- Verified Polish selection survives reload, updates the page title and `lang`,
  and persists while navigating to agent studio, opportunities and resident forms.
- Verified an unfinished resident title with Polish diacritics survives switching
  to English, unchanged. The test title was cleared without submitting.
- Checked local agent summaries, authority/context output, evidence factors,
  historical population figures and source attribution in Polish.
- Fixed canonical authority option values and multi-line agent output handling.
- 59 tests pass, including locale fallback, template placeholders, counts across
  multiple report topics, Polish pilot/export text and unchanged authored fields.
- Production build passes. Vite still warns about large application/Three.js
  chunks; the translation dictionary adds about 44 KB gzip to the main bundle.
