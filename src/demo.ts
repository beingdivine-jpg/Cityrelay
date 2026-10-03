import type { AppState } from "./model";
import type { CivicReport, CivicTopic } from "./civicModel";
import { seedProfiles } from "./data";
import { newCivic } from "./civicEngine";
export const DEMO_ID = "krakow-demo";
export const demoDisclosure =
  "Demo workspace · Sample resident reports and team inputs. City facts and project sources are real. Nothing is sent to a municipality.";
// Illustrative scenarios, never records attributed to actual residents.
export const demoReports: [CivicTopic, string, string, string][] = [
  [
    "heat",
    "Too little shade while waiting",
    "Waiting outdoors on a hot afternoon is uncomfortable. Could an accessible cool place nearby be clearly signposted?",
    "Stare Miasto",
  ],
  [
    "heat",
    "A cool place to rest",
    "On hot days I would like somewhere public to sit, drink water and rest without buying anything.",
    "Kazimierz",
  ],
  [
    "heat",
    "School grounds after lessons",
    "Could the team explore opening a shaded school courtyard outside lesson times, with clear responsibility for access?",
    "Podgórze",
  ],
  [
    "heat",
    "Finding relief from the heat",
    "It is difficult to know which nearby public buildings offer a comfortable place to spend a very hot afternoon.",
    "Nowa Huta",
  ],
  [
    "heat",
    "Shade along everyday routes",
    "Please investigate shade and rest points along walking routes used for everyday errands, including access for people with limited mobility.",
    "Grzegórzki",
  ],
  [
    "heat",
    "Opening hours are hard to find",
    "A useful hot-weather guide would explain opening hours, step-free access and drinking water at participating public places.",
    "Krowodrza",
  ],
  [
    "services",
    "Help with a municipal form",
    "Could there be a clearly advertised place near everyday services where someone explains which municipal form I need?",
    "Nowa Huta",
  ],
  [
    "services",
    "One place for practical advice",
    "I would find it easier to ask basic city-service questions in a familiar public library rather than work out which office to contact.",
    "Podgórze",
  ],
  [
    "services",
    "Offline help is still needed",
    "People who are less confident online need a welcoming way to ask for city information in person.",
    "Krowodrza",
  ],
  [
    "services",
    "Clearer signposting for newcomers",
    "A public advice point could help newcomers find the right city service and explain where specialist help is available.",
    "Stare Miasto",
  ],
  [
    "water",
    "Rain-friendly public spaces",
    "Please investigate whether a public square could temporarily hold rainwater while remaining useful in dry weather.",
    "Grzegórzki",
  ],
  [
    "water",
    "Schoolyard rainwater ideas",
    "Could a schoolyard redesign consider rainwater, shade and everyday play together, after checking site conditions?",
    "Podgórze",
  ],
  [
    "waste",
    "Clearer information about collection",
    "I would like clearer local information about waste collection. Please identify evidence before recommending a solution.",
    "Nowa Huta",
  ],
];
export function startDemo(state: AppState): AppState {
  if (state.profiles.some((p) => p.id === DEMO_ID))
    return {
      ...state,
      advisor: {
        name: state.advisor?.name || "Demo advisor",
        role: "Municipal innovation advisor",
        activeCommunityId: DEMO_ID,
        entryMode: "guided",
      },
    };
  const profile = { ...structuredClone(seedProfiles[0]), id: DEMO_ID };
  const civic = newCivic(profile);
  civic.authority.name = "Gmina Miejska Kraków";
  civic.contributors = [
    {
      id: "lead",
      name: "Demo innovation advisor",
      department: "Sample team",
      role: "Lead advisor",
    },
    {
      id: "parks",
      name: "Demo public-space advisor",
      department: "Sample team",
      role: "Site and maintenance checks",
    },
    {
      id: "services",
      name: "Demo resident-services advisor",
      department: "Sample team",
      role: "Intake and accessibility",
    },
  ];
  civic.connections = civic.connections.map((c) => ({
    ...c,
    ownerId:
      c.key === "reports"
        ? "services"
        : c.key === "resources"
          ? "parks"
          : "lead",
  }));
  const at = "2026-10-03T09:00:00.000Z";
  civic.reports = demoReports.map(
    ([topic, title, detail, area], i): CivicReport => ({
      id: `demo-report-${i + 1}`,
      kind: "complaint",
      topic,
      title,
      detail,
      area,
      submittedAt: at,
      externalConsent: false,
      status: "received",
      provenance: "demo",
    }),
  );
  const ideas: [CivicTopic, string, string][] = [
    [
      "heat",
      "A small network of cool public places",
      "Explore a few accessible public buildings as a possible heat-relief network. Check operators, opening hours, water and maintenance before proposing a pilot.",
    ],
    [
      "services",
      "Advice where people already go",
      "Explore a city-information desk inside an existing public library, with trained staff and clear referral routes.",
    ],
    [
      "waste",
      "A neighbourhood reuse scheme",
      "Explore a local reuse scheme, but first find a documented comparable project and investigate operating responsibilities.",
    ],
  ];
  civic.reports.push(
    ...ideas.map(([topic, title, detail], i): CivicReport => ({
      id: `demo-idea-${i + 1}`,
      kind: "idea",
      topic,
      title,
      detail,
      area: "Kraków",
      submittedAt: at,
      externalConsent: false,
      status: "received",
      provenance: "demo",
    })),
  );
  civic.reports.push(
    { ...civic.reports[0], id: "demo-duplicate", duplicateOf: "demo-report-1" },
    {
      ...civic.reports[1],
      id: "demo-review",
      title: "Location needs clarification",
      detail:
        "A sample intake item held until the public location and scope can be clarified.",
      status: "needs-review",
    },
  );
  civic.documents = [
    {
      id: "demo-brief",
      title: "Demo brief: a small, accessible pilot",
      ownerId: "lead",
      text: "Sample planning input: investigate a small pilot using an existing public place. Actual site permission, staffing, budget, opening hours and accessibility remain unknown. Compare documented projects, record limitations and ask the responsible team before proceeding.",
      enabled: true,
      externalConsent: false,
      createdAt: at,
    },
  ];
  return {
    ...state,
    profiles: [...state.profiles, profile],
    civic: { ...state.civic, [DEMO_ID]: civic },
    advisor: {
      name: state.advisor?.name || "Demo advisor",
      role: "Municipal innovation advisor",
      activeCommunityId: DEMO_ID,
      entryMode: "guided",
    },
  };
}
