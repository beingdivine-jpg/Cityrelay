import type {
  Asset,
  Budget,
  CommunityProfile,
  ImplementationExample,
  Staff,
} from "./model";
export const assetLabels: Record<Asset, string> = {
  building: "Accessible public building",
  volunteers: "Volunteer network",
  land: "Public land available",
  network: "District cooling network",
  vehicle: "Community vehicle",
  broadband: "Reliable broadband",
  water: "Water access for the proposed use",
  transport: "Approved transport arrangement",
  waterway: "Suitable waterway and floodplain site",
};
export const budgetLabels: Record<Budget, string> = {
  unknown: "Not yet known",
  none: "No budget available",
  micro: "Under €5,000",
  small: "€5,000–25,000",
  medium: "€25,000–100,000",
  capital: "Over €100,000",
};
export const staffLabels: Record<Staff, string> = {
  unknown: "Not yet known",
  none: "No staff available",
  limited: "A few hours a week",
  shared: "Shared part-time lead",
  dedicated: "Dedicated team",
};
export const outcomesFor = (domain: string): Record<string, string> =>
  domain === "heat"
    ? {
        all: "Explore heat preparedness",
        cool: "Access to cooler places",
        reach: "Reach vulnerable residents",
        shade: "Create lasting shade",
      }
    : domain === "water"
      ? {
          all: "Explore rain and water resilience",
          retention: "Make space for stormwater",
        }
      : domain === "services"
        ? {
            all: "Explore essential services",
            access: "Bring services closer",
            mobility: "Improve local journeys",
          }
        : { all: "Choose a priority first" };
const date = "2026-10-03T00:00:00.000Z";
export const emptyAssets: CommunityProfile["assets"] = {
  building: "unknown",
  volunteers: "unknown",
  land: "unknown",
  network: "unknown",
  vehicle: "unknown",
  broadband: "unknown",
  water: "unknown",
  transport: "unknown",
  waterway: "unknown",
};
export const seedProfiles: CommunityProfile[] = [
  {
    id: "krakow",
    name: "Kraków",
    demo: false,
    setting: "city",
    authorityType: "City of Kraków",
    context: {
      pattern: "Polish city with a municipal climate-adaptation programme",
      population: "Not included in this research",
      geography:
        "The city’s adaptation plan identifies heatwaves, the urban heat island and intense rainfall as local challenges.",
    },
    problems: ["heat"],
    priorities: ["Explore practical responses to urban heat"],
    assets: { ...emptyAssets },
    existingInitiatives: [
      "Biblioteka Kraków — public library branches",
      "Ogrody Krakowian — pocket parks",
      "Kraków climate adaptation plan",
    ],
    resources: { budget: "unknown", staff: "unknown" },
    restrictions:
      "No pilot site, delivery budget, staffing or municipal approval has been confirmed for this walkthrough.",
    goals: {
      outcome: "all",
      ambition: "Explore a locally suitable climate-adaptation approach.",
      horizon: "unknown",
      objective: "",
    },
    note: "",
    createdAt: date,
    updatedAt: date,
    fieldProvenance: {
      context: "official source",
      existingInitiatives: "official source",
      goals: "proposed focus",
      assets: "proposed focus",
      resources: "proposed focus",
    },
    sources: ["krakow-plan", "krakow-heat", "krakow-library", "krakow-gardens"],
  },
];
export const examples: ImplementationExample[] = [
  {
    id: "barcelona-shelters",
    title: "A network of places to escape the heat",
    shortTitle: "Climate shelters",
    origin: {
      name: "Barcelona",
      country: "Spain",
      setting: "city",
      coordinates: [2.1734, 41.3851],
      context:
        "A citywide network uses indoor and outdoor spaces, including libraries and community facilities.",
      ambition:
        "Provide accessible places with more comfortable conditions during hot weather.",
      resources:
        "Existing public and community spaces, with opening schedules and access information.",
    },
    domain: "heat",
    outcomes: ["cool", "reach"],
    mechanism:
      "Barcelona brings existing indoor and outdoor spaces into a climate-shelter network. Libraries, community facilities and parks are among the places listed by the city. Access information and opening hours help people find a refuge.",
    preconditions: [
      {
        asset: "building",
        explanation:
          "For a building-based local version, confirm permission, access, indoor conditions, water and operating arrangements for a specific venue. A library’s existence does not confirm its suitability.",
      },
    ],
    resourceNeeds: { budget: "unknown", staff: "unknown" },
    timingDays: null,
    evidenceType: "Documented project",
    status: "Municipal programme documented",
    reportedOutcomes: [
      "Barcelona City Council reported nearly 400 climate shelters in June 2025. This is a dated network count, not today’s opening list or a measured health outcome.",
    ],
    sources: ["barcelona-shelters"],
    limitations:
      "The source describes the network and services. It does not establish a transferable cost, implementation duration or benefit for Kraków. Current shelter opening hours must be checked with Barcelona.",
    reuse: ["library"],
    adaptation:
      "Elsewhere proposal: use the existing library directory to identify a candidate in Kraków, then ask the operator about access, thermal conditions and capacity before considering a pilot.",
    proposal:
      "Proposed next step: assess one existing Kraków library as a possible cool refuge. Identify a site and responsible operator, inspect access and indoor conditions, and obtain a local cost and staffing assessment before deciding whether to run a pilot.",
    fact: {
      value: "Nearly 400",
      label: "climate shelters reported",
      asOf: "June 2025",
      sourceId: "barcelona-shelters",
    },
  },
  {
    id: "paris-oasis",
    title: "Schoolyards that make room for shade and nature",
    shortTitle: "OASIS schoolyards",
    origin: {
      name: "Paris",
      country: "France",
      setting: "city",
      coordinates: [2.3522, 48.8566],
      context:
        "The OASIS programme transforms school and college playgrounds into greener, more comfortable spaces.",
      ambition: "Create cooler schoolyards and support more shared use.",
      resources:
        "School sites and collaboration with school communities, designers and researchers.",
    },
    domain: "heat",
    outcomes: ["cool", "shade"],
    mechanism:
      "Paris redesigns schoolyards through the OASIS programme, introducing more vegetation and permeable surfaces. The programme involves school communities and evaluates environmental and social aspects of the changes.",
    preconditions: [
      {
        asset: "land",
        explanation:
          "A local version needs a specific schoolyard, permission to change it and an assessment of access, underground services and maintenance.",
      },
      {
        asset: "water",
        explanation:
          "Confirm safe water provision and establishment/maintenance arrangements for the selected design. This is a local design check, not a verified Kraków allocation.",
      },
    ],
    resourceNeeds: { budget: "unknown", staff: "unknown" },
    timingDays: null,
    evidenceType: "Documented project",
    status: "Implemented programme; published case study",
    reportedOutcomes: [
      "Paris reported around 130 transformed schoolyards for 2023 on its page updated in January 2025.",
      "A published study examines microclimatic measurements in one OASIS schoolyard. That single-site evidence is not a universal cooling estimate.",
    ],
    sources: ["paris-oasis", "paris-study"],
    limitations:
      "The programme count is historical. The research’s single-site scope does not establish the temperature change, construction cost or timeframe of a Kraków project.",
    reuse: ["school", "schoolyard"],
    adaptation:
      "Elsewhere proposal: start with a site survey and conversations with a school community. Check seasonal use, ownership, utilities and maintenance before selecting a design.",
    proposal:
      "Proposed next step: assess a Kraków schoolyard for shade, vegetation and permeable surfaces with the school and site owner. Set a baseline and agree a design and budget before any works.",
    fact: {
      value: "≈130",
      label: "schoolyards transformed",
      asOf: "2023, as reported by Paris",
      sourceId: "paris-oasis",
    },
  },
  {
    id: "medellin-corridors",
    title: "Connect everyday streets with living green corridors",
    shortTitle: "Green corridors",
    origin: {
      name: "Medellín",
      country: "Colombia",
      setting: "city",
      coordinates: [-75.5812, 6.2442],
      context:
        "Vegetation and more permeable surfaces connect road corridors and waterways.",
      ambition: "Connect ecological infrastructure with everyday urban space.",
      resources:
        "City-led planting, landscape works and maintenance along streets and streams.",
    },
    domain: "heat",
    outcomes: ["shade", "cool"],
    mechanism:
      "Medellín’s corridor programme adds trees, planting and permeable surfaces along roads and waterways. The city reports a network that combines green road corridors and blue corridors beside streams.",
    preconditions: [
      {
        asset: "land",
        explanation:
          "Confirm an appropriate street or public site, permission and space for vegetation before proposing physical changes.",
      },
      {
        asset: "water",
        explanation:
          "A local planting design needs species-appropriate establishment and watering arrangements, with a named maintenance owner.",
      },
    ],
    resourceNeeds: { budget: "unknown", staff: "unknown" },
    timingDays: null,
    evidenceType: "Documented project",
    status: "Implemented network; municipal reporting",
    reportedOutcomes: [
      "On 20 September 2026, Medellín reported 56 corridors in total: 27 along roads and 29 associated with waterways.",
      "The municipality reports environmental benefits, but this record does not convert those claims into a quantified effect for Kraków.",
    ],
    sources: ["medellin-corridors"],
    limitations:
      "These are municipal programme reports, not an independent causal evaluation. Climate, species, maintenance and street conditions differ between Medellín and Kraków.",
    reuse: ["parks", "green"],
    adaptation:
      "Elsewhere proposal: connect the idea to Kraków’s existing pocket-park work and urban-climate studies. Ask local specialists which street conditions and planting types are suitable.",
    proposal:
      "Proposed next step: examine one street connection between existing green spaces in Kraków. Document shade gaps, utilities, access and maintenance needs, then assess options with the responsible city team.",
    fact: {
      value: "56",
      label: "green and blue corridors",
      asOf: "20 September 2026",
      sourceId: "medellin-corridors",
    },
  },
  {
    id: "singapore-bishan",
    title: "Give a river room to belong to the park",
    shortTitle: "Bishan–Ang Mo Kio Park",
    origin: {
      name: "Singapore",
      country: "Singapore",
      setting: "city",
      coordinates: [103.8198, 1.3521],
      context: "The Kallang River runs through Bishan–Ang Mo Kio Park.",
      ambition: "Integrate a waterway, nature and public space.",
      resources:
        "A joint PUB and NParks project using landscape design and civil engineering.",
    },
    domain: "water",
    outcomes: ["retention"],
    mechanism:
      "At Bishan–Ang Mo Kio Park, Singapore’s PUB and NParks transformed a concrete canal into a naturalised river. Plants, rocks and civil-engineering techniques shape the banks and help prevent erosion.",
    preconditions: [
      {
        asset: "waterway",
        explanation:
          "Confirm a suitable waterway and floodplain, ownership, hydraulic conditions and permissions. A general river setting is not enough to establish feasibility.",
      },
      {
        asset: "land",
        explanation:
          "A local version requires land and space for a safe, engineered landscape; availability must be established at a specific site.",
      },
    ],
    resourceNeeds: { budget: "unknown", staff: "unknown" },
    timingDays: null,
    evidenceType: "Documented project",
    status: "Completed project; public-agency documentation",
    reportedOutcomes: [
      "PUB’s 2014 guidelines record completion in March 2012.",
      "PUB documents the canal-to-river transformation and the use of soil bioengineering. No numerical flood-risk reduction is claimed in this record.",
    ],
    sources: ["singapore-bishan", "singapore-guide"],
    limitations:
      "A tropical river-park project is not a ready-made design for Kraków. Hydrology, flood protection, ecology, permissions, cost and construction time need a local engineering study.",
    reuse: ["parks"],
    adaptation:
      "Elsewhere proposal: use the river-park principle as a question for Kraków’s water and landscape teams, starting with a feasibility study rather than assumed construction.",
    proposal:
      "Proposed next step: identify whether a Kraków waterway site could accommodate a nature-based intervention. Commission local hydraulic and ecological assessment before selecting an intervention.",
    fact: {
      value: "2012",
      label: "project completed",
      asOf: "March 2012 · PUB guidelines",
      sourceId: "singapore-guide",
    },
  },
  {
    id: "helsinki-info",
    title: "City advice inside a familiar public library",
    shortTitle: "Helsinki-info at Oodi",
    origin: {
      name: "Helsinki",
      country: "Finland",
      setting: "city",
      coordinates: [24.9384, 60.1699],
      context:
        "Helsinki-info has a face-to-face service point in Oodi Central Library.",
      ambition: "Help residents navigate city services.",
      resources:
        "Public library space, advisers, and telephone and chat channels.",
    },
    domain: "services",
    outcomes: ["access"],
    mechanism:
      "Helsinki places a municipal advice service inside Oodi Central Library. Residents can ask about city services and immigration-related matters, with several languages supported. Telephone and chat offer additional ways to reach the service.",
    preconditions: [
      {
        asset: "building",
        explanation:
          "Confirm an accessible public venue, permission to host advisers, a private place for sensitive discussions and appropriate service arrangements.",
      },
    ],
    resourceNeeds: { budget: "unknown", staff: "unknown" },
    timingDays: null,
    evidenceType: "Documented project",
    status: "Operating service documented by the city",
    reportedOutcomes: [
      "Helsinki’s service page documents a free, confidential advice point in Oodi, alongside telephone and chat support. It does not provide an independently evaluated impact figure.",
    ],
    sources: ["helsinki-info"],
    limitations:
      "The source establishes the service model, not its effect on access, transferable cost or staffing needs. Check current opening information directly with the city.",
    reuse: ["library"],
    adaptation:
      "Elsewhere proposal: investigate whether a Kraków library could host a small municipal advice session. Confirm the operator, staff expertise, accessibility, privacy and the specific services residents need.",
    proposal:
      "Proposed next step: speak with a library operator and the relevant municipal service team about a locally suitable advice session. Consult intended users, confirm staffing and privacy arrangements, and define a small trial before committing.",
    fact: {
      value: "In person",
      label: "city advice within a public library",
      asOf: "Service page checked 3 October 2026",
      sourceId: "helsinki-info",
    },
  },
];
export function newProfile(): CommunityProfile {
  return {
    id: crypto.randomUUID(),
    name: "",
    demo: false,
    setting: "unknown",
    authorityType: "Unknown",
    context: { pattern: "Unknown", population: "Unknown", geography: "" },
    problems: ["unknown"],
    priorities: [],
    assets: { ...emptyAssets },
    existingInitiatives: [],
    resources: { budget: "unknown", staff: "unknown" },
    restrictions: "",
    goals: { outcome: "all", ambition: "", horizon: "unknown", objective: "" },
    note: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fieldProvenance: { all: "local user entry" },
    sources: [],
  };
}

export function localSuggestion(
  profile: CommunityProfile,
  example: ImplementationExample,
  field: "adaptation" | "proposal",
): string {
  if (profile.id === "krakow") return example[field];
  const checks = example.preconditions
    .map((p) => assetLabels[p.asset].toLowerCase())
    .join(", ");
  const place = profile.name || "your community";
  if (field === "adaptation")
    return `Use ${example.origin.name}’s experience as a starting point for ${place}. Check ${checks}, then work with the responsible local team on permissions, access, cost, staffing and an appropriate scale. No local site, programme or allocation is assumed.`;
  const suggestions: Record<string, string> = {
    "barcelona-shelters": `Explore whether an existing public venue in ${place} could offer residents a comfortable refuge during hot weather. Consult its operator and intended users; check indoor conditions, accessibility, drinking water and opening arrangements before proposing a small trial.`,
    "paris-oasis": `Explore a schoolyard in ${place} with its school community. Map heat and access needs, identify opportunities for shade, planting and permeable surfaces, and request a site assessment before selecting a small intervention.`,
    "medellin-corridors": `Bring ${place}’s street, parks and maintenance teams together to identify a possible green connection. Check utilities, species, land ownership and long-term care before scoping a planting pilot.`,
    "singapore-bishan": `Ask ${place}’s water and landscape teams whether a local waterway could accommodate a nature-based intervention. Start with hydraulic, ecological and ownership checks before considering construction.`,
    "helsinki-info": `Consult residents, a local public venue and ${place}’s municipal service team about an accessible advice session. Confirm the services needed, staff expertise, language support and privacy arrangements before defining a small trial.`,
  };
  return `Proposed next step: ${suggestions[example.id] || `investigate ${example.shortTitle} with the relevant team in ${place}. Confirm a local site, operator and resources before proceeding.`}`;
}
