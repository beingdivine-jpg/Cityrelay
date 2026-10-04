import type { JuryStep } from "./juryTourModel";
export const juryCopy: Record<
  JuryStep,
  { title: string; body: string; action: string; target: string }
> = {
  listen: {
    title: "Start with a resident.",
    body: "You are advising Kraków. These sample concerns make the local need tangible. Counts exclude duplicates and reports awaiting review.",
    action: "Click Another voice, or choose a concern topic.",
    target: "voice",
  },
  team: {
    title: "Where does the knowledge come from?",
    body: "Residents are one input. Municipal advisors also bring context, resources and documents. Let’s look at who shares what.",
    action: "Click Meet the team & inspect the data.",
    target: "team",
  },
  access: {
    title: "A team, with clear access.",
    body: "Each data group has an owner and a sharing switch. The demo is already prepared for local analysis. You do not need to claim municipal membership or connect an AI provider.",
    action: "Review the data room, then continue to the agent studio.",
    target: "access",
  },
  launch: {
    title: "Begin a visible investigation.",
    body: "Five stages will group concerns, examine Kraków, retrieve documented approaches, check fit and write a brief. Local analysis works now; external AI is optional.",
    action: "Click Start the research. Existing runs stay in your history.",
    target: "launch",
  },
  run: {
    title: "Follow the work as it happens.",
    body: "The log records the inputs, retrieval and checks actually performed. Reading pauses make each action visible. Live source requests can fail; failures stay in the record.",
    action:
      "Watch the log. At each handoff, inspect the output and click Continue.",
    target: "workbench",
  },
  compare: {
    title: "The research is ready for you.",
    body: "All five stages have finished. The agents have organised evidence, but choosing a direction remains your decision.",
    action: "Click Compare the findings.",
    target: "compare",
  },
  choose: {
    title: "Choose a documented approach.",
    body: "Leads connect the resident concerns to projects from other cities. A relevant example is a starting point, not proof that it will work in Kraków.",
    action: "Click Inspect this approach to follow one lead.",
    target: "choose",
  },
  evidence: {
    title: "Understand what actually happened.",
    body: "Read the project mechanism, the dated source fact and its limitations. These are real documented projects; their outcomes are not predictions for Kraków.",
    action: "Open the evidence if useful, then click Check the local fit.",
    target: "fit",
  },
  reality: {
    title: "The demo reality is already filled in.",
    body: "Sample budget, team and evidence notes are ready. They are hypothetical planning inputs, so real permissions and affordability remain unverified. You can edit them or continue without supplying documents.",
    action:
      "Review the sample assumptions, then click Continue with demo assumptions.",
    target: "reality",
  },
  shape: {
    title: "Make a proposal of your own.",
    body: "The suggested local version is editable. Creating a brief preserves your existing pilot text if you already have one. This is a proposal for review, not approval to deliver.",
    action:
      "Review the proposal, then create the pilot brief or add this evidence to your pilot.",
    target: "pilot",
  },
  export: {
    title: "Take the working brief with you.",
    body: "Your pilot brings together the proposal, responsibilities, sources and unresolved checks. You can edit its pages before exporting. Sample assumptions remain labelled in the download.",
    action:
      "Click Download pilot · PDF. The guide finishes after the file is prepared.",
    target: "export",
  },
  done: {
    title: "From a concern to a considered pilot.",
    body: "You listened, inspected the shared inputs, followed five research stages and prepared a pilot brief. Check your browser downloads for the PDF. Nothing has been sent to a municipality.",
    action:
      "Keep exploring, or rehearse the journey again. Your work stays saved.",
    target: "",
  },
};
