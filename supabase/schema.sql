-- Schema for the IV-to-Oral savings calculator.
-- Paste this whole file into the Supabase dashboard: SQL Editor -> New query -> Run.
-- Safe to re-run: it drops and recreates both tables.

drop table if exists dose_entries;
drop table if exists medications;

-- The medication impact database. Replaced wholesale by a CSV upload.
create table medications (
  id              text primary key,
  name            text not null,
  co2_per_dose    double precision not null,
  plastic_per_dose double precision not null
);

-- Audit dose entries. Replaced wholesale by an audit CSV upload.
--
-- Holds EVERY audited dose, switchable or not: only switchable ones with a
-- known medication drive the savings figures, but the audit chart plots both to
-- show a switch rate per drug.
--
-- medication_id references medications.id but is deliberately NOT a foreign
-- key: re-uploading the medication CSV rebuilds that table, and a FK would
-- cascade-delete the audit data along with it. It is '' for a drug that has no
-- impact figures yet, which is why `name` carries the audit's own spelling.
create table dose_entries (
  id            text primary key,
  medication_id text default '',
  name          text not null,
  switchable    boolean not null default false,
  doses         double precision not null,
  unit          text default '',
  ward          text default '',
  date_str      text default ''
);

-- Row-level security. There is no sensitive data here and no login, so the
-- anonymous key is allowed full read/write on both tables. To lock writes down
-- later, drop the "anon write" policies and add an auth check.
alter table medications enable row level security;
alter table dose_entries enable row level security;

create policy "anon read medications"  on medications  for select to anon using (true);
create policy "anon write medications" on medications  for all    to anon using (true) with check (true);

create policy "anon read dose_entries"  on dose_entries for select to anon using (true);
create policy "anon write dose_entries" on dose_entries for all    to anon using (true) with check (true);
