# Elsewhere verification — 3 October 2026

## Automated checks

- `npm test`: **23 tests passed** across matching/persistence/export and live-response validation.
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

## Scope and remaining release work

This is a local, device-saved preview, with no authenticated login, server-side shared workspace or public deployment. It does not contact another city or claim endorsement. Public launch needs the real account/storage infrastructure and hosting destination. Provider availability and municipal source freshness are external dependencies. Project-source updates are manual.

Live APIs retain explicit failure states; this turn observed a successfully loaded IMGW temperature in the Kraków brief. The value is not frozen into the app. Historical programme facts are not real-time inventories.

Original supplied hackathon documents and the earlier CityRelay prototype were reviewed. AI assistance, previous work, libraries and data providers are disclosed in README and THIRD_PARTY_NOTICES.
