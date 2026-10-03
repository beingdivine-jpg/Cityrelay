import { beforeAll, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db;
const owner = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002",
  invitee = "00000000-0000-4000-8000-000000000003";
const w = "10000000-0000-4000-8000-000000000001";
const doc = { version: 2, profiles: [{ id: w }] };
async function as(user, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  await db.exec(`set role ${role}`);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;insert into auth.users values('${owner}','owner@example.test',now()),('${other}','other@example.test',now()),('${invitee}','invited@example.test',now());`,
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610030001_workspace.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await as(owner);
  await db.query("select public.ew_create($1,$2,$3)", [w, "Test city", doc]);
}, 20000);
afterAll(async () => {
  await db?.close();
});
it("isolates private workspaces and rejects unauthenticated creation", async () => {
  await as(other);
  expect(
    (await db.query("select * from public.ew_workspaces")).rows,
  ).toHaveLength(0);
  await expect(
    db.query("select public.ew_save($1,1,$2)", [w, doc]),
  ).rejects.toThrow("access denied");
  await as(null, "anon");
  await expect(
    db.query("select * from public.ew_workspaces"),
  ).rejects.toThrow();
  await expect(
    db.query("select public.ew_create($1,$2,$3)", [w, "Bad", doc]),
  ).rejects.toThrow();
});
it("prevents lost updates with optimistic revision checks and retains history", async () => {
  await as(owner);
  const saved = await db.query(
    "select (public.ew_save($1,1,$2)).revision as revision",
    [w, doc],
  );
  expect(saved.rows[0].revision).toBe(2);
  await expect(
    db.query("select public.ew_save($1,1,$2)", [w, doc]),
  ).rejects.toThrow("SAVE_CONFLICT");
  expect(
    (await db.query("select * from public.ew_revisions")).rows,
  ).toHaveLength(2);
  await expect(
    db.query("update public.ew_workspaces set owner_id=$1", [other]),
  ).rejects.toThrow();
});
it("exposes only published metadata and delivers reports without exposing the private inbox", async () => {
  await as(null, "anon");
  expect(
    (await db.query("select * from public.ew_public_workspace($1)", [w])).rows,
  ).toHaveLength(0);
  await expect(
    db.query("select public.ew_publish($1,true,$2)", [w, "Fake team"]),
  ).rejects.toThrow();
  await as(owner);
  await db.query("select public.ew_publish($1,true,$2)", [
    w,
    "Test receiving team",
  ]);
  await as(null, "anon");
  const metadata = (
    await db.query("select * from public.ew_public_workspace($1)", [w])
  ).rows[0];
  expect(Object.keys(metadata).sort()).toEqual(["id", "name", "receiver"]);
  const report = {
    kind: "idea",
    topic: "heat",
    title: "A shaded space",
    detail: "Please explore a shaded waiting space near the public library.",
    area: "Library",
    externalConsent: false,
  };
  const result = (
    await db.query("select public.ew_submit($1,$2) as token", [w, report])
  ).rows[0];
  expect(result.token).toMatch(/^[\da-f-]{36}$/);
  const receipt = (
    await db.query("select * from public.ew_receipt($1)", [result.token])
  ).rows[0];
  expect(receipt.status).toBe("needs-review");
  expect(receipt).not.toHaveProperty("payload");
  await expect(db.query("select * from public.ew_reports")).rejects.toThrow();
  await as(owner);
  const rows = (await db.query("select * from public.ew_reports")).rows;
  expect(rows[0].payload.title).toBe(report.title);
  await db.query("select public.ew_review_report($1,$2)", [
    rows[0].id,
    "received",
  ]);
  await as(null, "anon");
  expect(
    (await db.query("select * from public.ew_receipt($1)", [result.token]))
      .rows[0].status,
  ).toBe("received");
});
it("binds invitations to a verified email and prevents role escalation", async () => {
  await as(owner);
  const token = (
    await db.query("select public.ew_invite($1,$2) as id", [
      w,
      "invited@example.test",
    ])
  ).rows[0].id;
  await as(other);
  await expect(
    db.query("select public.ew_accept($1)", [token]),
  ).rejects.toThrow("invited email");
  await as(invitee);
  expect(
    (await db.query("select public.ew_accept($1) as id", [token])).rows[0].id,
  ).toBe(w);
  expect(
    (await db.query("select * from public.ew_workspaces")).rows,
  ).toHaveLength(1);
  await expect(
    db.query("select public.ew_publish($1,true,$2)", [w, "Other"]),
  ).rejects.toThrow("Owner access");
  await expect(
    db.query("insert into public.ew_members values($1,$2,$3)", [
      w,
      other,
      "owner",
    ]),
  ).rejects.toThrow();
});
it("rejects malformed anonymous reports", async () => {
  await as(null, "anon");
  await expect(
    db.query("select public.ew_submit($1,$2)", [
      w,
      { title: "A title", detail: "A description that is long enough." },
    ]),
  ).rejects.toThrow("Invalid report");
  await expect(
    db.query("select public.ew_submit($1,$2)", [
      w,
      { kind: "idea", topic: "heat", title: "short", detail: "tiny" },
    ]),
  ).rejects.toThrow("Invalid report");
});

it("limits paid research attempts per authenticated user across workspaces", async () => {
  await as(other);
  await expect(
    db.query("select public.ew_claim_research($1)", [w]),
  ).rejects.toThrow("access denied");
  await as(owner);
  for (let i = 0; i < 3; i++)
    expect(
      (await db.query("select public.ew_claim_research($1) as allowed", [w]))
        .rows[0].allowed,
    ).toBe(true);
  await expect(
    db.query("select public.ew_claim_research($1)", [w]),
  ).rejects.toThrow("Daily research limit");
});

it("rejects missing workspace versions and lets only owners revoke access", async () => {
  await as(owner);
  await expect(
    db.query("select public.ew_save($1,2,$2)", [w, { profiles: [{ id: w }] }]),
  ).rejects.toThrow("Invalid workspace");
  const access = (await db.query("select public.ew_access($1) as access", [w]))
    .rows[0].access;
  expect(access.members.some((m) => m.id === invitee)).toBe(true);
  await as(invitee);
  await expect(
    db.query("select public.ew_revoke($1,$2,'member')", [w, owner]),
  ).rejects.toThrow("Owner access");
  await as(owner);
  await db.query("select public.ew_revoke($1,$2,'member')", [w, invitee]);
  await as(invitee);
  expect(
    (await db.query("select * from public.ew_workspaces")).rows,
  ).toHaveLength(0);
  await expect(
    db.query("select public.ew_save($1,2,$2)", [w, doc]),
  ).rejects.toThrow("access denied");
});
