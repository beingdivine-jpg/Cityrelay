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

The current local preview is `http://127.0.0.1:5174/`. No public deployment has been performed. A static host must rewrite application routes to `index.html`.

## Experience

1. **Welcome:** one focused introduction with a moving idea connecting two conceptual city fragments. Motion can be paused and respects reduced-motion preferences. The artwork is not a map or a model of any actual city.
2. **Enter your workspace:** set up the municipality you advise. Alternatively, choose **Let’s simplify it. Try Kraków.** Returning advisors can resume or switch between locally saved municipalities.
3. **Your brief:** choose heat/shade, rain/water or public services; articulate a local ambition. Resource and asset details are optional. Kraków has sourced local context and expandable live weather. Other municipalities start with the advisor’s inputs, without invented local facts.
4. **Explore ideas:** one featured starting point and other documented perspectives. Each case moves through **Understand the idea → Check the local fit → Make it yours**. Evidence and constraints are disclosed when relevant.
5. **Pilot plan:** edit Purpose, Delivery and Learning. Keep unresolved conditions visible. Copy or download a source-linked Markdown brief, and record actual observations after a pilot. Questions are drafts, never sent to a city.

`/enter` handles entry; `/community/:id` is the brief; `/community/:id/matches` explores projects; `/community/:id/matches/:matchId` is a case; `/community/:id/plan` is the pilot; `/start?edit=:id` edits local context; `/about` exposes sources and the method.

## Evidence and method

Five documented examples: Barcelona’s climate shelters, Paris’s OASIS schoolyards, Medellín’s green/blue corridors, Singapore’s Bishan–Ang Mo Kio river park, and Helsinki-info at Oodi. `src/sources.ts` contains primary source links, reporting dates and manual check dates. Historical programme counts retain their dates. No global live project feed, partnership, local success, cost estimate or municipal commitment is implied.

The workflow draws on [URBACT’s understand–adapt–reuse process](https://urbact.eu/news/how-transfer-urban-good-practice-lessons-urbact-study), [OECD municipal innovation capacity research](https://www.oecd.org/en/publications/enhancing-innovation-capacity-in-city-government_f10c96e5-en.html), and the [Design Council’s framework](https://www.designcouncil.org.uk/resources/framework-for-innovation/). Context and local judgement precede delivery. The public-services example is documented by the [City of Helsinki](https://www.hel.fi/en/decision-making/contact-us/helsinki-info/contact-information).

Matching is deterministic: focus/outcome filtering, readiness categories, then selected priority +40, same setting +5, initiative keyword connections +15 each (maximum 30), user-confirmed checks +4 and unknown checks −3. Unmet requirements take precedence over points. Costs, staffing and timing cannot become verified merely because a user selects generous resources. Free-text goals are carried into plans; they are not interpreted by an AI model. Planning suggestions are editorial, project-specific starting points.

## Live context

- IMGW-PIB public station endpoint: `https://danepubliczne.imgw.pl/api/data/synop/station/krakow`, station 12566. The raw provider report date/hour is separate from retrieval time; the response provides no timezone. Older reports are identified.
- Open-Meteo seven-day forecast: fixed central Kraków coordinates, Europe/Warsaw dates, temperature highs/lows and rainfall. It is forecast model output, distinct from a station observation.
- Startup, manual and 15-minute refresh; independent provider results, strict validation, 12-second timeout and explicit unavailable states. No fabricated fallback. Values captured in plans are dated snapshots.
- Requests contain fixed public station/location information, never advisor identity, notes or proposal content. Weather provides context and does not alter rankings or act as an official alert.
- Open-Meteo attribution and non-commercial use are disclosed. A commercial deployment needs appropriate provider terms.

## Storage and release boundary

Advisor identity, municipalities, drafts, plans and observations remain in browser storage under `cityrelay.real.v2`. This key is deliberately retained through the rename so existing work survives. Earlier fictional prototype storage is untouched. Corrupt reads and failed saves surface errors. The reset dialog explains what it clears. Text-note import accepts a local `.txt` file up to 100 KB; it is not automatically interpreted.

This build has device-saved advisor access, not authenticated accounts. It is a working hackathon preview, not a public municipal service. Public release still requires a hosting destination, secure authentication and shared storage, access control/privacy review, and commercial data arrangements where applicable. User-entered local information is not independently verified. The catalogue is curated and updated manually.

The current renderer imports only `src/app.css`; previous design files remain in the repository for reference and are not loaded. The Three.js module is loaded asynchronously on the welcome page. Its production chunk is about 544 KB uncompressed / 135 KB gzip; the workspace does not depend on rendering it. Manrope is self-hosted.

## Hackathon disclosure

The supplied SMART CITY documents informed the emphasis on a concrete municipal user, accurate data, a clear user journey, and tested functionality. This iteration builds on an existing local prototype. Codex assisted with research, copy, code, original procedural graphics and verification; this work should be disclosed under the challenge’s AI/prior-work rules. External libraries, fonts and data providers are listed in `THIRD_PARTY_NOTICES.md`. No claim is made that all code was authored during the competition window or that source cities endorse this project.

See `QA.md` for checks and limitations.
