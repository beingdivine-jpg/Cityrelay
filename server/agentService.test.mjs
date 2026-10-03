import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import {
  createAgentService,
  sourceSnapshot,
  publicSourceUrl,
  safeText,
  parseResponse,
} from "./agentService.mjs";
it("keeps both single and multiple provider search queries in the observable record", () => {
  const result = parseResponse({
    output: [
      {
        type: "web_search_call",
        action: { type: "search", query: "Kraków heat adaptation" },
      },
      {
        type: "web_search_call",
        action: { type: "search", queries: ["Helsinki library services"] },
      },
    ],
  });
  expect(result.searches.map((s) => s.queries)).toEqual([
    ["Kraków heat adaptation"],
    ["Helsinki library services"],
  ]);
});
async function request(handler, path, body, headers = {}, options = {}) {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = options.method || "POST";
  if (options.preparsed) req.body = body;
  req.url = path;
  req.headers = {
    host: "localhost:5174",
    origin: "http://localhost:5174",
    "content-type": "application/json",
    ...headers,
  };
  const res = new EventEmitter();
  let output = "";
  res.writeHead = function (status, h) {
    this.status = status;
    this.headers = h;
    return this;
  };
  res.write = (text) => {
    output += text;
  };
  res.end = (text) => {
    output += text || "";
    res.writableEnded = true;
  };
  await handler(req, res);
  return {
    status: res.status,
    output,
    json: () => JSON.parse(output),
    events: () =>
      output
        .trim()
        .split("\n")
        .map((x) => JSON.parse(x)),
  };
}
const input = {
  consent: true,
  shared: ["reports", "context", "resources", "catalogue"],
  profile: {
    name: "Kraków",
    context: { geography: "River city" },
    assets: { building: "unknown" },
    resources: { staff: "unknown" },
  },
  reports: [],
  documents: [],
};
describe("Bounded server research", () => {
  it("rejects non-public destinations, credentials, and non-HTTPS links", () => {
    for (const url of [
      "http://www.hel.fi/a",
      "https://localhost/a",
      "https://127.0.0.1/a",
      "https://hel.fi.evil.test/a",
      "https://x:y@hel.fi/a",
      "https://hel.fi:444/a",
    ])
      expect(publicSourceUrl(url)).toBeNull();
    expect(publicSourceUrl("https://www.hel.fi/a")).not.toBeNull();
  });
  it("does not follow a redirect outside approved source domains", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("", {
        status: 302,
        headers: { location: "http://127.0.0.1/private" },
      }),
    );
    const result = await sourceSnapshot(
      { url: "https://www.hel.fi/example", title: "Test" },
      fetcher,
    );
    expect(result.status).toBe("unavailable");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("hashes visible content and ignores script changes", async () => {
    const get = (html) =>
      sourceSnapshot(
        { url: "https://www.hel.fi/example", title: "Test" },
        async () =>
          new Response(html, { headers: { "content-type": "text/html" } }),
      );
    expect((await get("<p>Hello</p><script>a</script>")).hash).toBe(
      (await get("<p>Hello</p><script>b</script>")).hash,
    );
    expect((await get("<p>Changed</p>")).hash).not.toBe(
      (await get("<p>Hello</p>")).hash,
    );
  });
  it("rejects malformed and cross-origin calls", async () => {
    const handler = createAgentService();
    for (const origin of [
      "null",
      "not a url",
      "http://localhost:8000",
      "https://malicious.test",
    ])
      expect(
        (await request(handler, "/api/monitor", { sources: [] }, { origin }))
          .status,
      ).toBe(403);
    expect((await request(handler, "/api/monitor", null)).status).toBe(400);
    expect(
      (await request(handler, "/api/monitor", { sources: [null] })).status,
    ).toBe(400);
  });
  it("keeps AI unconfigured without a server key", async () => {
    const r = await request(createAgentService(), "/api/research", input);
    expect(r.status).toBe(503);
    expect(r.json().error).toContain("not configured");
  });
  it("rejects missing consent and withheld search access before provider use", async () => {
    const fetcher = vi.fn(),
      handler = createAgentService({ apiKey: "test-only", fetcher });
    expect(
      (await request(handler, "/api/research", { ...input, consent: false }))
        .status,
    ).toBe(400);
    expect(
      (
        await request(handler, "/api/research", {
          ...input,
          shared: ["context"],
        })
      ).status,
    ).toBe(400);
    expect(
      (await request(handler, "/api/research", { ...input, reports: [null] }))
        .status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("streams five steps while enforcing per-report/document consent and preserving citations", async () => {
    const calls = [];
    const fetcher = vi.fn(async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push(body);
      const search = !!body.tools;
      return Response.json({
        status: "completed",
        output: [
          ...(search
            ? [
                {
                  type: "web_search_call",
                  action: { type: "search", queries: ["municipal project"] },
                },
              ]
            : []),
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Documented findings",
                annotations: search
                  ? [
                      {
                        type: "url_citation",
                        url: "https://www.hel.fi/example",
                        title: "Helsinki source",
                        start_index: 0,
                        end_index: 10,
                      },
                    ]
                  : [],
              },
            ],
          },
        ],
      });
    });
    const body = {
      ...input,
      reports: [
        {
          title: "Allowed",
          detail: "Public need",
          externalConsent: true,
          status: "received",
        },
        { title: "SECRET REPORT", externalConsent: false, status: "received" },
        { title: "HELD REPORT", externalConsent: true, status: "needs-review" },
      ],
      documents: [
        {
          title: "Allowed policy",
          text: "Public constraint",
          enabled: true,
          externalConsent: true,
        },
        {
          title: "SECRET DOC",
          text: "private",
          enabled: true,
          externalConsent: false,
        },
      ],
    };
    const r = await request(
      createAgentService({ apiKey: "test-only", fetcher }),
      "/api/research",
      body,
    );
    const events = r.events();
    expect(events.at(-1).type).toBe("done");
    expect(
      events.filter((e) => e.type === "step" && e.step.status === "complete"),
    ).toHaveLength(5);
    expect(JSON.stringify(calls)).not.toContain("SECRET");
    expect(JSON.stringify(calls)).not.toContain("HELD REPORT");
    expect(JSON.stringify(calls)).toContain("Public constraint");
    expect(calls[2].tool_choice).toBe("required");
    expect(calls.every((c) => c.store === false)).toBe(true);
    const writer = events.find(
      (e) => e.step?.id === "writer" && e.step.status === "complete",
    );
    expect(writer.step.citations[0].url).toBe("https://www.hel.fi/example");
    expect(writer.step.citations[0].start).toBeUndefined();
    expect(r.output).not.toContain("test-only");
  });
  it("never reports completion after an incomplete provider response", async () => {
    const r = await request(
      createAgentService({
        apiKey: "test-only",
        fetcher: async () =>
          Response.json({ status: "incomplete", output: [] }),
      }),
      "/api/research",
      input,
    );
    expect(r.events().at(-1).type).toBe("error");
    expect(r.events().some((e) => e.type === "done")).toBe(false);
  });
  it("redacts obvious contact details before provider transmission", () => {
    expect(safeText("Contact a@example.com or +48 123 456 789")).not.toContain(
      "example.com",
    );
    expect(safeText("Contact a@example.com or +48 123 456 789")).not.toContain(
      "123 456",
    );
  });
});

describe("Public Vercel preview", () => {
  const headers = {
    host: "city-preview.vercel.app",
    origin: "https://city-preview.vercel.app",
  };
  it("reports public mode without enabling paid AI even if a key is present", async () => {
    const handler = createAgentService({
      publicPreview: true,
      apiKey: "not-for-public-use",
    });
    const status = await request(handler, "/api/status", {}, headers, {
      method: "GET",
    });
    expect(status.status).toBe(200);
    expect(status.json().ai).toBe(false);
    expect(status.json().message).toContain("Public preview");
    const r = await request(handler, "/api/research", input, headers);
    expect(r.status).toBe(503);
    expect(r.output).not.toContain("not-for-public-use");
  });
  it("accepts serverless pre-parsed JSON for bounded public source checks", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("<p>Public city evidence</p>", {
          headers: { "content-type": "text/html" },
        }),
    );
    const handler = createAgentService({ publicPreview: true, fetcher });
    const r = await request(
      handler,
      "/api/monitor",
      {
        sources: [
          { url: "https://www.hel.fi/example", title: "Official city source" },
        ],
      },
      headers,
      { preparsed: true },
    );
    expect(r.status).toBe(200);
    expect(r.json().snapshots[0].status).toBe("ok");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects cross-origin and missing-origin public POSTs", async () => {
    const handler = createAgentService({ publicPreview: true });
    for (const origin of ["https://other.example", undefined])
      expect(
        (
          await request(
            handler,
            "/api/monitor",
            { sources: [] },
            { ...headers, origin },
          )
        ).status,
      ).toBe(403);
  });
  it("preserves the size limit when Vercel has already parsed the body", async () => {
    const r = await request(
      createAgentService({ publicPreview: true }),
      "/api/monitor",
      { text: "x".repeat(100001) },
      headers,
      { preparsed: true },
    );
    expect(r.status).toBe(413);
  });
  it("keeps the local service closed to public hosts", async () => {
    const r = await request(createAgentService(), "/api/status", {}, headers, {
      method: "GET",
    });
    expect(r.status).toBe(403);
  });
});

it("requires a shared account before public paid research and fails closed on quota denial", async () => {
  const fetcher = vi.fn(async () => new Response("{}", { status: 403 }));
  const handler = createAgentService({
    publicPreview: true,
    apiKey: "test-key",
    supabaseUrl: "https://example.supabase.co",
    supabaseKey: "public-test-key",
    fetcher,
  });
  const anonymous = await request(handler, "/api/research", {
    consent: true,
    workspaceId: "10000000-0000-4000-8000-000000000001",
  });
  expect(anonymous.status).toBe(401);
  expect(fetcher).not.toHaveBeenCalled();
  const denied = await request(
    handler,
    "/api/research",
    { consent: true, workspaceId: "10000000-0000-4000-8000-000000000001" },
    { authorization: "Bearer test-token" },
  );
  expect(denied.status).toBe(403);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain("/rest/v1/rpc/ew_claim_research");
});

it("streams actual source starts and results, including failures, before the terminal event", async () => {
  const fetcher = vi.fn(
    async (url) =>
      new Response(
        String(url).includes("missing")
          ? "missing"
          : "<main>A documented municipal project.</main>",
        {
          status: String(url).includes("missing") ? 404 : 200,
          headers: { "Content-Type": "text/html" },
        },
      ),
  );
  const result = await request(
    createAgentService({ fetcher }),
    "/api/monitor",
    {
      stream: true,
      sources: [
        { title: "City source", url: "https://www.hel.fi/example" },
        { title: "Unavailable source", url: "https://www.hel.fi/missing" },
      ],
    },
  );
  const events = result.events();
  expect(result.status).toBe(200);
  expect(events.filter((e) => e.phase === "started")).toHaveLength(2);
  expect(
    events
      .filter((e) => e.phase === "complete")
      .map((e) => e.snapshot.status)
      .sort(),
  ).toEqual(["ok", "unavailable"]);
  expect(events.at(-1).type).toBe("done");
  for (const source of [
    "https://www.hel.fi/example",
    "https://www.hel.fi/missing",
  ])
    expect(events.findIndex((e) => e.source?.url === source)).toBeLessThan(
      events.findIndex((e) => e.snapshot?.url === source),
    );
});
