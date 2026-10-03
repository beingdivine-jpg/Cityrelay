import { createAgentService } from "../server/agentService.mjs";
export default createAgentService({
  publicPreview: true,
  backgroundMonitor: !!(
    process.env.CRON_SECRET &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.VITE_SUPABASE_URL
  ),
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_MODEL || "gpt-5.5",
  supabaseUrl: process.env.VITE_SUPABASE_URL || "",
  supabaseKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
});
