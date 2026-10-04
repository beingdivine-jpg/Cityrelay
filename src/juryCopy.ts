import type { JuryStep } from "./juryTourModel";
import type { AgentKey } from "./civicModel";
export type WalkthroughMessage = {
  title: string;
  body: string;
  action: string;
};
export const juryCopy: Record<
  JuryStep,
  WalkthroughMessage & { target: string }
> = {
  listen: {
    title: "Start with a resident.",
    body: "You are advising Kraków. These sample concerns show what residents might need; the most reported topics come first.",
    action: "Click Another voice, or choose a concern topic.",
    target: "voice",
  },
  team: {
    title: "You’ve heard a resident.",
    body: "Now meet the advisors. Their local knowledge helps the agents judge which ideas could work here.",
    action: "Click Meet the team & inspect the data.",
    target: "team",
  },
  access: {
    title: "See who shares what.",
    body: "Each input has an owner and a sharing switch. Sample data is ready; no account or uploads are needed.",
    action: "Review access, then continue to the agent studio.",
    target: "access",
  },
  launch: {
    title: "Ready to investigate.",
    body: "Your inputs are ready. Five agents will connect local concerns with documented approaches and explain the fit.",
    action: "Start the research, then follow the activity log.",
    target: "launch",
  },
  run: {
    title: "Follow the investigation.",
    body: "The log shows the work actually performed. Each handoff pauses for your review.",
    action: "Read the output, then continue to the next agent.",
    target: "workbench",
  },
  compare: {
    title: "Five stages completed.",
    body: "You now have documented leads and open checks. Compare the findings before choosing a direction.",
    action: "Click Compare the findings.",
    target: "compare",
  },
  choose: {
    title: "Choose a promising approach.",
    body: "Compare the fit scores and their factors. Open a lead to check its source and local requirements; the score is not approval.",
    action: "Click Inspect this approach.",
    target: "choose",
  },
  evidence: {
    title: "You’ve opened a real project.",
    body: "Read what the city did and what its source supports. This helps separate the useful idea from unproven local benefits.",
    action: "Review the evidence, then click Check the local fit.",
    target: "fit",
  },
  reality: {
    title: "Your sample inputs are ready.",
    body: "Budget, team and evidence notes are prefilled for the demo. These hypothetical inputs let you draft a pilot; real permissions remain unverified.",
    action: "Review them, then click Continue with demo assumptions.",
    target: "reality",
  },
  shape: {
    title: "Shape a local proposal.",
    body: "The approach is now a draft for Kraków. Edit it before creating your pilot. Existing pilot text is preserved.",
    action:
      "Create the pilot brief, or add this evidence to your existing pilot.",
    target: "pilot",
  },
  export: {
    title: "Your pilot is ready to review.",
    body: "The brief combines your proposal, responsibilities, sources and open checks. Review it, then take a copy with you.",
    action: "Click Download pilot · PDF.",
    target: "export",
  },
  done: {
    title: "Your pilot PDF is ready.",
    body: "Find it in your browser downloads. It includes your proposal, evidence and labelled demo assumptions. Nothing was sent to a municipality.",
    action: "Keep exploring, or start the walkthrough again.",
    target: "",
  },
};
export const agentWalkthroughCopy: Record<
  AgentKey,
  { working: WalkthroughMessage; handoff?: WalkthroughMessage }
> = {
  listener: {
    working: {
      title: "Listening to residents.",
      body: "The Listener groups concerns and excludes duplicates, so repeated submissions do not inflate priorities.",
      action: "Watch the log; a handoff will appear when this stage finishes.",
    },
  },
  context: {
    working: {
      title: "Checking Kraków’s context.",
      body: "The City analyst reads the shared profile, resources and constraints. These inputs anchor the research in local conditions.",
      action: "Watch the checks appear in the log.",
    },
    handoff: {
      title: "Resident priorities are ready.",
      body: "The concerns are grouped. Next, the City analyst checks the local context to guide the research.",
      action: "Review the Listener’s output, then continue to City analyst.",
    },
  },
  scout: {
    working: {
      title: "Looking for documented approaches.",
      body: "The Research scout works with permitted documented projects. The log shows its queries, evidence and any live source-page checks.",
      action: "Follow the sources as they are checked.",
    },
    handoff: {
      title: "The local context is ready.",
      body: "Kraków’s shared inputs have been reviewed. The Research scout will now look for documented approaches from other cities.",
      action: "Review the context, then continue to Research scout.",
    },
  },
  reviewer: {
    working: {
      title: "Testing the local fit.",
      body: "The Fit reviewer compares needs, assets and resources. Sample planning notes stay unverified; open questions remain visible.",
      action: "Read the reasons behind each fit check.",
    },
    handoff: {
      title: "The source trail is ready.",
      body: "Candidate projects and source-check results are recorded. Next, the Fit reviewer examines what could transfer to Kraków.",
      action: "Review the sources, then continue to Fit reviewer.",
    },
  },
  writer: {
    working: {
      title: "Preparing the findings.",
      body: "The Brief writer brings the evidence and open questions together for your decision.",
      action: "Wait for the final stage to finish.",
    },
    handoff: {
      title: "Local checks are ready.",
      body: "The fit review shows useful connections and unresolved conditions. The Brief writer will organise these findings for your review.",
      action: "Review the fit, then continue to Brief writer.",
    },
  },
};
