-- Apply to a user-owned Supabase project. No service-role key belongs in the browser.
create schema if not exists private;
create table public.ew_workspaces (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(char_length(name) between 1 and 120),
 document jsonb not null, revision bigint not null default 1,
 public_intake boolean not null default false, receiver text not null default '',
 updated_at timestamptz not null default now()
);
create table public.ew_members (
 workspace_id uuid not null references public.ew_workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id), role text not null check(role in ('owner','advisor')),
 primary key(workspace_id,user_id)
);
create table public.ew_invitations (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.ew_workspaces(id) on delete cascade,
 email text not null, expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz
);
create table public.ew_reports (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.ew_workspaces(id),
 receipt uuid not null unique default gen_random_uuid(), payload jsonb not null,
 status text not null default 'received' check(status in ('received','needs-review','reviewed','closed')),
 submitted_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ew_revisions (
 workspace_id uuid not null references public.ew_workspaces(id), revision bigint not null,
 actor uuid not null references auth.users(id), document jsonb not null, at timestamptz not null default now(),
 primary key(workspace_id,revision)
);
alter table public.ew_workspaces enable row level security;
alter table public.ew_members enable row level security;
alter table public.ew_invitations enable row level security;
alter table public.ew_reports enable row level security;
alter table public.ew_revisions enable row level security;
create function private.ew_member(w uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ew_members where workspace_id=w and user_id=(select auth.uid()));
$$;
create policy member_read on public.ew_workspaces for select to authenticated using(private.ew_member(id));
create policy member_read on public.ew_members for select to authenticated using(private.ew_member(workspace_id));
create policy member_read on public.ew_reports for select to authenticated using(private.ew_member(workspace_id));
create policy member_read on public.ew_revisions for select to authenticated using(private.ew_member(workspace_id));
-- Mutations go through bounded functions; members cannot change ownership or bypass revisions.
revoke all on public.ew_workspaces,public.ew_members,public.ew_invitations,public.ew_reports,public.ew_revisions from anon,authenticated;
grant select on public.ew_workspaces,public.ew_members,public.ew_reports,public.ew_revisions to authenticated;
grant usage on schema private to authenticated;
revoke all on function private.ew_member(uuid) from public;
grant execute on function private.ew_member(uuid) to authenticated;
create function private.ew_validate(d jsonb,w uuid) returns void language plpgsql set search_path='' as $$
begin
 if d is null or octet_length(d::text)>2000000 or coalesce(d->>'version','')<>'2' or coalesce(jsonb_typeof(d->'profiles'),'')<>'array' then
 raise exception 'Invalid workspace document'; end if;
 if
 not exists(select 1 from jsonb_array_elements(d->'profiles') p where p->>'id'=w::text) then
 raise exception 'Invalid workspace document'; end if;
end;$$;
create function public.ew_create(w uuid,n text,d jsonb) returns public.ew_workspaces language plpgsql security definer set search_path='' as $$
declare result public.ew_workspaces;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if (select count(*) from public.ew_workspaces where owner_id=auth.uid())>=10 then raise exception 'Workspace limit reached'; end if;
 perform private.ew_validate(d,w);
 insert into public.ew_workspaces(id,owner_id,name,document) values(w,auth.uid(),trim(n),d) returning * into result;
 insert into public.ew_members values(w,auth.uid(),'owner');
 insert into public.ew_revisions values(w,1,auth.uid(),d,now());
 return result;
end;$$;
create function public.ew_save(w uuid,expected_revision bigint,d jsonb) returns public.ew_workspaces language plpgsql security definer set search_path='' as $$
declare result public.ew_workspaces;
begin
 if not private.ew_member(w) then raise exception 'Workspace access denied'; end if;
 perform private.ew_validate(d,w);
 update public.ew_workspaces set document=d,revision=revision+1,updated_at=now()
 where id=w and revision=expected_revision returning * into result;
 if result.id is null then raise exception 'SAVE_CONFLICT'; end if;
 insert into public.ew_revisions values(w,result.revision,auth.uid(),d,now());
 delete from public.ew_revisions where workspace_id=w and revision<result.revision-49;
 return result;
end;$$;
create function public.ew_publish(w uuid,enabled boolean,receiver_name text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.ew_workspaces where id=w and owner_id=auth.uid()) then raise exception 'Owner access required'; end if;
 if enabled and char_length(trim(receiver_name))<3 then raise exception 'Name the receiving team'; end if;
 update public.ew_workspaces set public_intake=enabled,receiver=left(trim(receiver_name),160) where id=w;
end;$$;
create function public.ew_public_workspace(w uuid) returns table(id uuid,name text,receiver text) language sql stable security definer set search_path='' as $$
 select id,name,receiver from public.ew_workspaces where id=w and public_intake;
$$;
create function public.ew_submit(w uuid,p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; clean jsonb;
begin
 -- Serialize per-workspace intake to make the daily bound effective under concurrency.
 perform 1 from public.ew_workspaces where id=w and public_intake for update;
 if not found then raise exception 'Reporting is not available for this workspace'; end if;
 if (select count(*) from public.ew_reports where workspace_id=w and submitted_at>now()-interval '1 day')>=200 then raise exception 'Daily intake limit reached. Please try again tomorrow.'; end if;
 if coalesce(p->>'kind','') not in ('complaint','idea') or coalesce(p->>'topic','') not in ('heat','water','services','mobility','waste','unknown') or
 coalesce(char_length(trim(p->>'title')),0) not between 5 and 150 or coalesce(char_length(trim(p->>'detail')),0) not between 20 and 2000 or
 char_length(coalesce(p->>'area',''))>100 or octet_length(p::text)>12000 then raise exception 'Invalid report'; end if;
 clean=jsonb_build_object('kind',p->>'kind','topic',p->>'topic','title',trim(p->>'title'),'detail',trim(p->>'detail'),'area',coalesce(p->>'area',''),'externalConsent',coalesce((p->>'externalConsent')::boolean,false));
 insert into public.ew_reports(workspace_id,payload,status) values(w,clean,'needs-review') returning receipt into result;
 return result;
end;$$;
create function public.ew_receipt(token uuid) returns table(status text,submitted_at timestamptz,updated_at timestamptz,receiver text) language sql stable security definer set search_path='' as $$
 select r.status,r.submitted_at,r.updated_at,w.receiver from public.ew_reports r join public.ew_workspaces w on w.id=r.workspace_id where r.receipt=token;
$$;
create function public.ew_review_report(r uuid,next_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if next_status not in ('received','needs-review','reviewed','closed') or not exists(select 1 from public.ew_reports where id=r and private.ew_member(workspace_id)) then raise exception 'Report access denied'; end if;
 update public.ew_reports set status=next_status,updated_at=now() where id=r;
end;$$;
create function public.ew_invite(w uuid,recipient_email text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not exists(select 1 from public.ew_workspaces where id=w and owner_id=auth.uid()) then raise exception 'Owner access required'; end if;
 if recipient_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(recipient_email)>254 then raise exception 'Enter a valid email'; end if;
 if (select count(*) from public.ew_invitations where workspace_id=w and expires_at>now())>=50 then raise exception 'Invitation limit reached'; end if;
 insert into public.ew_invitations(workspace_id,email) values(w,lower(trim(recipient_email))) returning id into result;
 return result;
end;$$;
create function public.ew_accept(invitation uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare invite public.ew_invitations;
begin
 select * into invite from public.ew_invitations where id=invitation and expires_at>now() and accepted_at is null for update;
 if invite.id is null or not exists(select 1 from auth.users where id=auth.uid() and lower(email)=invite.email and email_confirmed_at is not null) then raise exception 'Sign in with the invited email address'; end if;
 insert into public.ew_members values(invite.workspace_id,auth.uid(),'advisor') on conflict do nothing;
 update public.ew_invitations set accepted_at=now() where id=invitation;
 return invite.workspace_id;
end;$$;
revoke all on function private.ew_validate(jsonb,uuid) from public;
revoke all on function public.ew_create(uuid,text,jsonb),public.ew_save(uuid,bigint,jsonb),public.ew_publish(uuid,boolean,text),public.ew_public_workspace(uuid),public.ew_submit(uuid,jsonb),public.ew_receipt(uuid),public.ew_review_report(uuid,text),public.ew_invite(uuid,text),public.ew_accept(uuid) from public;
grant execute on function public.ew_create(uuid,text,jsonb),public.ew_save(uuid,bigint,jsonb),public.ew_publish(uuid,boolean,text),public.ew_review_report(uuid,text),public.ew_invite(uuid,text),public.ew_accept(uuid) to authenticated;
grant execute on function public.ew_public_workspace(uuid),public.ew_submit(uuid,jsonb),public.ew_receipt(uuid) to anon,authenticated;
-- Persistent paid-research attempt budget, shared across all server instances.
create table public.ew_research_usage(user_id uuid not null references auth.users(id), day date not null, attempts integer not null, primary key(user_id,day));
alter table public.ew_research_usage enable row level security;
revoke all on public.ew_research_usage from anon,authenticated;
create function public.ew_claim_research(w uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare claimed integer;
begin
 if not private.ew_member(w) then raise exception 'Workspace access denied'; end if;
 insert into public.ew_research_usage values(auth.uid(),(now() at time zone 'UTC')::date,1)
 on conflict(user_id,day) do update set attempts=public.ew_research_usage.attempts+1 where public.ew_research_usage.attempts<3
 returning attempts into claimed;
 if claimed is null then raise exception 'Daily research limit reached'; end if;
 return true;
end;$$;
revoke all on function public.ew_claim_research(uuid) from public;
grant execute on function public.ew_claim_research(uuid) to authenticated;
-- Background source checks are isolated from advisor document edits.
create table public.ew_monitor_results(workspace_id uuid primary key references public.ew_workspaces(id), result jsonb not null);
alter table public.ew_monitor_results enable row level security;
revoke all on public.ew_monitor_results from anon,authenticated;
grant select on public.ew_monitor_results to authenticated;
create policy member_read on public.ew_monitor_results for select to authenticated using(private.ew_member(workspace_id));
grant select on public.ew_workspaces to service_role;
grant select,insert,update on public.ew_monitor_results to service_role;
-- Workspace owners can audit and revoke invitations or advisor access.
create function public.ew_access(w uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.ew_workspaces where id=w and owner_id=auth.uid()) then raise exception 'Owner access required'; end if;
 return jsonb_build_object(
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.user_id,'email',u.email,'role',m.role)) from public.ew_members m join auth.users u on u.id=m.user_id where m.workspace_id=w),'[]'::jsonb),
 'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'email',i.email,'expiresAt',i.expires_at)) from public.ew_invitations i where i.workspace_id=w and i.accepted_at is null and i.expires_at>now()),'[]'::jsonb));
end;$$;
create function public.ew_revoke(w uuid,target uuid,kind text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.ew_workspaces where id=w and owner_id=auth.uid()) then raise exception 'Owner access required'; end if;
 if kind='invitation' then
   update public.ew_invitations set expires_at=now() where id=target and workspace_id=w;
 elsif kind='member' then
   delete from public.ew_members where workspace_id=w and user_id=target and role='advisor';
 else raise exception 'Invalid access type'; end if;
end;$$;
revoke all on function public.ew_access(uuid),public.ew_revoke(uuid,uuid,text) from public;
grant execute on function public.ew_access(uuid),public.ew_revoke(uuid,uuid,text) to authenticated;
