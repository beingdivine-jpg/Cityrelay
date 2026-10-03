import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), sourceSnapshot: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));
vi.mock("./agentService.mjs", () => ({ sourceSnapshot: mocks.sourceSnapshot }));
import handler from "../api/scheduled-monitor.js";
const savedEnv = { ...process.env };
const response = () => ({
  code: 200,
  body: null,
  setHeader() {},
  status(code) {
    this.code = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-only-cron";
  process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-server";
});
afterEach(() => {
  process.env = { ...savedEnv };
});
it("denies unauthenticated scheduled execution before database or source access", async () => {
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  expect(res.code).toBe(401);
  expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.sourceSnapshot).not.toHaveBeenCalled();
});
it("honours disabled monitoring without fetching sources", async () => {
  mocks.from.mockReturnValue({
    select: () => ({
      order: () => ({
        limit: async () => ({
          data: [
            {
              id: "w",
              document: { civic: { w: { monitor: { enabled: false } } } },
            },
          ],
          error: null,
        }),
      }),
    }),
  });
  const res = response();
  await handler(
    { method: "GET", headers: { authorization: "Bearer test-only-cron" } },
    res,
  );
  expect(res.body.checked).toBe(0);
  expect(mocks.sourceSnapshot).not.toHaveBeenCalled();
});
it("records a source change once and preserves the successful baseline through an outage", async () => {
  let previous = null,
    count = 0;
  mocks.sourceSnapshot.mockImplementation(async (s) => ({
    ...s,
    checkedAt: "2026-10-04T06:00:00Z",
    status: count === 2 ? "unavailable" : "ok",
    hash: count === 0 ? "baseline" : count === 1 ? "changed" : null,
  }));
  mocks.from.mockImplementation((table) =>
    table === "ew_workspaces"
      ? {
          select: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  {
                    id: "w",
                    document: {
                      civic: {
                        w: {
                          monitor: { enabled: true },
                          connections: [{ key: "catalogue", enabled: true }],
                        },
                      },
                    },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }
      : {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: previous ? { result: previous } : null,
                error: null,
              }),
            }),
          }),
          upsert: async (record) => {
            previous = record.result;
            return { error: null };
          },
        },
  );
  const run = async () =>
    handler(
      { method: "GET", headers: { authorization: "Bearer test-only-cron" } },
      response(),
    );
  await run();
  expect(previous.notices).toHaveLength(0);
  count = 1;
  await run();
  const notices = previous.notices.map((n) => n.id);
  expect(notices).toHaveLength(5);
  await run();
  expect(previous.notices.map((n) => n.id)).toEqual(notices);
  count = 2;
  await run();
  expect(
    previous.snapshots.every(
      (s) => s.hash === "changed" && s.status === "unavailable",
    ),
  ).toBe(true);
  expect(previous.notices.map((n) => n.id)).toEqual(notices);
});
