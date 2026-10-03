import { createAgentService } from "../server/agentService.mjs";

// Public hosting exposes bounded public-source checks, never a paid AI endpoint.
// Local Vite sessions retain the separately configured research integration.
export default createAgentService({ publicPreview: true });
