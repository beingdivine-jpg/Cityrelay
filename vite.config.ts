import { defineConfig, loadEnv } from "vite";
import { cwd } from "node:process";
import react from "@vitejs/plugin-react";
import { createAgentService } from "./server/agentService.mjs";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  const agentService = createAgentService({
    apiKey: env.OPENAI_API_KEY || "",
    model: env.OPENAI_MODEL || "gpt-5.5",
  });
  return {
    plugins: [
      react(),
      {
        name: "elsewhere-local-agents",
        configureServer(server) {
          server.middlewares.use(agentService);
        },
        configurePreviewServer(server) {
          server.middlewares.use(agentService);
        },
      },
    ],
  };
});
