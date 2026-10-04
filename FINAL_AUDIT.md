# Final product audit — 4 October 2026

## Release scope

This pass followed the municipal advisor journey from the bilingual Kraków demo through resident intake, data permissions, research, comparison, local feasibility and a downloadable pilot. The latest request adds an explainable research-fit score to that journey and to the final report.

## Resolved findings

| Finding                                                                                              | Resolution                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rapid research updates could cause two open tabs to overwrite saved work or report a false conflict. | A persistence coordinator ignores stale events, never echoes received snapshots, preserves genuine unsaved-edit conflicts and supports explicit backup restoration.                       |
| Reloading during research lost the visible investigation.                                            | Each observed action is checkpointed under one run ID. Interrupted work is labelled incomplete, retains its real trace and can be restarted without inventing results.                    |
| Full-speed processing could stall in Safari background tabs.                                         | Full speed yields browser tasks through a cancellable message channel; normal reading intervals and manual handoffs remain available.                                                     |
| No visible explanation of how a project matched the city.                                            | Versioned 0–100 scorecards appear in the reviewer/writer flow, comparison, project detail and pilot. Each exposes factor points, the formula, unresolved requirements and limitations.    |
| Reports lacked the score and methodology.                                                            | English and Polish PDF/text exports contain every selected approach's score, factor matrix, calculation, timestamp and method version. Source citation blocks stay together across pages. |
| Some walkthrough states assumed usable or current results.                                           | Completed runs are distinguished from interrupted runs. Empty/outdated results explain the next action and provide recovery links. The guide explains the new scorecards.                 |
| Revisiting a saved pilot offered edits that would not be retained when adding evidence.              | Existing text is shown as a saved preview with a direct editing link; adding another example preserves authored text. Untouched templates follow the selected language.                   |
| Held report areas could not be corrected; duplicate detection could follow another duplicate.        | Area and content are checked together, held areas are editable, and duplicate matching uses eligible canonical reports with the same location/topic/kind.                                 |
| Disconnected account/reporting screens implied shared delivery was available.                        | Copy identifies local storage and offers working backup/demo routes. Shared tracking is hidden when its service is absent.                                                                |
| Backup imports accepted inconsistent references or unsafe source URLs.                               | Validation covers null profiles, IDs, enums, selected examples, community references, citation protocols and score arithmetic. Existing backups without scorecards remain supported.      |
| A background source check could finish after switching city.                                         | Results are applied only to the originating active workspace.                                                                                                                             |

## Scoring method

`fit-v1` exposes the existing planning weights rather than presenting an invented probability:

- Relevant shared municipal priority or eligible resident topic: 40 points.
- Same community setting: 5 points.
- Connected existing initiatives: 15 points each, up to 30.
- Local requirements: +4 per met check; −3 per unknown check.
- Score: earned points / possible total × 100, rounded and bounded to 0–100.

An unmet requirement blocks readiness regardless of score. Withheld data contributes no relevance/context points. Population, project cost and predicted outcomes do not add points. Demo assumptions remain unverified. The initial Barcelona example scores 42/100, with six unknown requirements. Research history preserves the original score; the pilot recalculates against current permitted inputs and says so explicitly.

## Validation evidence

- 117 automated tests passed across 17 files, including local research, permissions, resident screening, recovery, persistence races, import validation, bilingual exports, PDF generation, API security and database row-level security tests.
- TypeScript and the production Vite build passed.
- Production dependency audit reported zero known vulnerabilities at audit time.
- Browser journey: English guided demo completed through download; Polish guide and PDF checked; manual handoffs, stop/restart and real source-page checks exercised.
- Native Safari: full-speed five-stage investigation completed with another resident-inbox tab open; both views reported saved state; completed research survived a reload.
- Resident intake: a held report containing contact information in its area stayed blocked until corrected, then could be reviewed without granting external AI consent.
- A separate custom-city journey retained its own context rather than inheriting the demo budget or sample reports.
- New scorecards were inspected in the actual browser. The Polish PDF's selectable text, Polish glyphs, score matrix and clickable citations were checked and its pages rendered for visual inspection.
- Desktop controls were checked for accessible names, navigation and horizontal overflow earlier in the pass.

## Release limits

This is a verified local/demo journey, not a claim that all production services are configured. Shared accounts, shared resident delivery, external AI research and server-side scheduled monitoring still require deployment configuration. Two real authenticated users could not be tested without that backend. Local analysis is deterministic and labelled as such; optional source checks make real HTTP requests.

The final pass did not complete a fresh 320/390/768-pixel device matrix after the browser connector became unavailable. Backup rejection and empty-result recovery have automated coverage; not every failure state was also repeated through the UI. These are explicit verification limits, not silently reported passes.

The audit run ends with this release; no background audit automation was created.
