# Elsewhere

**Great ideas start somewhere. Bring them here.**

An advisor workspace for learning from real city projects and shaping a locally appropriate pilot. Formerly CityRelay. React, TypeScript, Vite and an original Three.js architectural scene.

## Run

Node.js 22.12+ and npm:

```sh
npm install
npm run dev
npm test
npm run build
npm run format:check
```

The current local preview is `http://127.0.0.1:5174/`. Vercel deployment configuration is included. `vercel.json` routes application deep links to `index.html` and preserves `/api` function routes.

## Experience

1. **Welcome:** a moving architectural scene introduces the idea and a five-specialist research team. Motion can be paused and respects reduced-motion preferences.
2. **Choose a municipality:** own-city setup is primary; **Let’s simplify it. Try Kraków** is the optional guided route. Returning advisors resume or switch saved workspaces.
3. **Team & data:** identify the responsible municipality, council or public agency; record contributing advisors and data owners; share or withhold reports, context, resources and the project library. Add owned local text documents with separate permission for external AI processing.
4. **Resident space → city signals:** residents can submit concerns or ideas. Eligible unique complaints determine topic order. Exact duplicates and entries containing obvious contact details are held separately. No example complaints are seeded as real public demand.
5. **Agent studio:** Listener → City analyst → Research scout → Fit reviewer → Brief writer. Each stage exposes its input, output and citations. Local runs perform deterministic processing and then visibly replay the completed handoffs. Optional live AI runs stream actual stage completion from a server-side Responses API integration. Run history and Markdown research exports preserve the evidence trail.
6. **Opportunities:** see the reported local need, source city, named source authority, available comparison evidence and unresolved constraints. Resident ideas remain held where evidence is missing. A written advisor justification is required to shortlist anything for human review. Changed inputs invalidate old results; decisions are linked to their research run.
7. **Pilot plan:** understand a documented case, inspect local conditions, adapt a proposal and edit Purpose, Delivery and Learning. Existing pilot editing/export and actual-outcome recording remain available.
8. **Monitoring:** check approved public HTML sources and establish content baselines. Subsequent changes generate advisor inbox notices. Optional checks repeat every 15 minutes while the workspace is open and visible. Changed local evidence also prompts a fresh run. A source-page change requires review and is never represented as a verified new project.

Routes: `/enter`; `/community/:id` (signals); `/community/:id/data`; `/report/:id` (resident form); `/community/:id/reports` (intake); `/community/:id/agents`; `/community/:id/opportunities`; `/community/:id/monitor`; `/community/:id/brief`; `/community/:id/matches`; `/community/:id/matches/:matchId`; `/community/:id/plan`; `/about`.

## Optional live AI research

The working local mode requires no key. For live research, copy `.env.example` to `.env.local`, set `OPENAI_API_KEY` **on the server only**, then restart Vite. Never use a `VITE_` prefix for credentials. `OPENAI_MODEL` defaults to `gpt-5.5` and can be configured for the account. The UI must report **Live AI research connected** before an external run can start. The key is not delivered to the browser.

The advisor must confirm external processing for each run. Only enabled data groups, eligible reporter-consented submissions and enabled, separately consented documents reach the provider. Obvious emails and phone numbers are redacted; this is a basic intake safeguard, not a comprehensive PII classifier. The shared municipal profile is advisor-supplied information and must be reviewed before sending.

`server/agentService.mjs` uses the [OpenAI Responses API web-search tool](https://developers.openai.com/api/docs/guides/tools-web-search/). Five bounded specialist calls run sequentially; the scout must perform an actual web search and return approved citations. The search is restricted to the municipal/public domains declared in the service. Failed or incomplete calls do not become completed research. Cancellation stops the request; history keeps completed partial outputs as a failed run. `store:false` is set, and API usage may incur costs under the account's terms.

AI discoveries remain unverified research notes, separate from the five manually sourced project records. Deterministic local topic counts can include reports that have no external processing permission; those reports never enter the AI context. AI findings are not automatic fit approvals. The inspector shows an action/evidence trail, not private model reasoning.

The service is mounted by Vite in development and preview, accepts same-origin loopback requests, limits request size/concurrency, and validates monitored domains and redirects. It is **not** a production API. Static-only deployments retain local analysis but cannot run these server endpoints.

## Evidence and method

Five documented examples: Barcelona’s climate shelters, Paris’s OASIS schoolyards, Medellín’s green/blue corridors, Singapore’s Bishan–Ang Mo Kio river park, and Helsinki-info at Oodi. `src/sources.ts` contains primary source links, reporting dates and manual check dates. Historical programme counts retain their dates. The population comparison uses 2024 municipal totals: Kraków 809,168 and Helsinki 684,018, linked to the cities’ statistical publications. Helsinki is about 15% smaller; similar scale is context, not proof of transferability. Other population comparisons stay unknown. No verified global project feed, partnership, local success, cost estimate or municipal commitment is implied.

The workflow draws on [URBACT’s understand–adapt–reuse process](https://urbact.eu/news/how-transfer-urban-good-practice-lessons-urbact-study), [OECD municipal innovation capacity research](https://www.oecd.org/en/publications/enhancing-innovation-capacity-in-city-government_f10c96e5-en.html), and the [Design Council’s framework](https://www.designcouncil.org.uk/resources/framework-for-innovation/). Context and local judgement precede delivery. The public-services example is documented by the [City of Helsinki](https://www.hel.fi/en/decision-making/contact-us/helsinki-info/contact-information).

Matching is deterministic: focus/outcome filtering, readiness categories, then selected priority +40, same setting +5, initiative keyword connections +15 each (maximum 30), user-confirmed checks +4 and unknown checks −3. Unmet requirements take precedence over points. Costs, staffing and timing cannot become verified merely because a user selects generous resources. In local mode, free-text goals are carried into plans without semantic AI interpretation. The optional AI workflow can interpret only the permitted inputs. Planning suggestions are editorial, project-specific starting points.

## Live context

- IMGW-PIB public station endpoint: `https://danepubliczne.imgw.pl/api/data/synop/station/krakow`, station 12566. The raw provider report date/hour is separate from retrieval time; the response provides no timezone. Older reports are identified.
- Open-Meteo seven-day forecast: fixed central Kraków coordinates, Europe/Warsaw dates, temperature highs/lows and rainfall. It is forecast model output, distinct from a station observation.
- Startup, manual and 15-minute refresh; independent provider results, strict validation, 12-second timeout and explicit unavailable states. No fabricated fallback. Values captured in plans are dated snapshots.
- Requests contain fixed public station/location information, never advisor identity, notes or proposal content. Weather provides context and does not alter rankings or act as an official alert.
- Open-Meteo attribution and non-commercial use are disclosed. A commercial deployment needs appropriate provider terms.

## Storage and release boundary

Advisor identity, municipalities, drafts, plans and observations remain in browser storage under `cityrelay.real.v2`. This key is deliberately retained through the rename so existing work survives. Earlier fictional prototype storage is untouched. Corrupt reads and failed saves surface errors. The reset dialog explains what it clears. Text-note import accepts a local `.txt` file up to 100 KB. Local processing displays shared document excerpts; permitted documents can be interpreted during a consented live AI run.

This build has device-saved advisor access, not authenticated accounts. It is a working hackathon preview, not a public municipal service. Public release still requires a hosting destination, secure authentication and shared storage, access control/privacy review, and commercial data arrangements where applicable. User-entered local information is not independently verified. The catalogue is curated and updated manually; source-page changes trigger review notices, not automatic fact updates. Advisor contributors are local role records, not separate authenticated accounts. Data switches control processing inputs, not user-level security boundaries. Previously recorded outputs remain in local history when access is later withheld. Shared-origin browser tabs synchronize saved work; separate devices do not. Always-on background research requires a deployed scheduler and persistent storage; browser monitoring stops when the app closes. No live AI provider call was made during verification because a key was not configured.

The current renderer imports `src/app.css` and `src/civic.css`; previous design files remain in the repository for reference and are not loaded. The Three.js module is loaded asynchronously on the welcome page. Its production chunk is about 544 KB uncompressed / 135 KB gzip; the workspace does not depend on rendering it. Manrope is self-hosted.

## Hackathon disclosure

The supplied SMART CITY documents informed the emphasis on a concrete municipal user, accurate data, a clear user journey, and tested functionality. This iteration builds on an existing local prototype. Codex assisted with research, copy, code, original procedural graphics and verification; this work should be disclosed under the challenge’s AI/prior-work rules. External libraries, fonts and data providers are listed in `THIRD_PARTY_NOTICES.md`. No claim is made that all code was authored during the competition window or that source cities endorse this project.

See `QA.md` for checks and limitations.

## Vercel deployment

Import `beingdivine-jpg/Cityrelay` into Vercel, keep the project root at `./`, and choose Vite. The repository config supplies `npm ci`, `npm run build` and `dist`. Connect the production branch to `main` so subsequent GitHub pushes deploy automatically. No environment secrets are required for the public preview.

The public preview includes local analysis, browser-saved workspaces, resident intake, research history, pilot planning, public weather and a Vercel function for bounded public-source monitoring. `api/[...path].js` reuses the source checker in explicit public-preview mode, with same-origin checks, source/redirect allowlisting and request limits. Limits are per warm function instance, not a distributed abuse-prevention system. The research endpoint is disabled in this mode even if an API key exists; authenticated access and persistent usage controls are needed before enabling paid research publicly.

The live domain has separate browser storage from localhost. Existing local drafts are not automatically uploaded or shared with visitors. Source monitoring still runs only while a visible workspace is open. Vercel hosting does not add authenticated municipal accounts, shared storage or a background scheduler.
