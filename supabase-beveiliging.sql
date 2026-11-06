-- ════════════════════════════════════════════════════════════════
-- SOEPRONDE — beveiliging van klantgegevens en wachtwoorden
--
-- Uitvoeren in Supabase: SQL Editor → New query → plak dit → Run.
--
-- VOOR je dit uitvoert:
--   1. Vervang hieronder JOUW-EMAIL@VOORBEELD.BE door het e-mailadres
--      waarmee jij als beheerder wil inloggen.
--
-- NA het uitvoeren:
--   2. Authentication → Users → Add user → Create new user
--      met datzelfde e-mailadres en een sterk wachtwoord
--      (vink "Auto Confirm User" aan).
--   3. Authentication → Sign In / Providers → Email:
--      laat "Confirm email" AAN staan.
-- ════════════════════════════════════════════════════════════════


-- ── 1. Beheerders ───────────────────────────────────────────────
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
-- (geen regels: niemand kan deze tabel via de app lezen of wijzigen)

insert into public.admins (email) values ('JOUW-EMAIL@VOORBEELD.BE')
on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;


-- ── 2. Klanten koppelen aan hun login ───────────────────────────
alter table public.klanten
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

-- Wachtwoorden horen niet in deze tabel: Supabase bewaart ze zelf, versleuteld.
alter table public.klanten drop column if exists wachtwoord;

-- Wanneer iemand een account aanmaakt:
--  · bestaat er al een klant met dat e-mailadres → die wordt gekoppeld
--  · anders → er wordt een nieuwe klant aangemaakt
create or replace function public.koppel_klant()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.admins where lower(email) = lower(new.email)) then
    return new;
  end if;

  update public.klanten set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;

  if not found then
    insert into public.klanten
      (id, naam, email, tel, straat, gemeente, levering, abonnee, aantalperweek, actief, user_id)
    values (
      (select coalesce(max(id), 0) + 1 from public.klanten),
      coalesce(nullif(new.raw_user_meta_data ->> 'naam', ''), new.email),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'tel', ''),
      '', '', '08:00', false, 1, true, new.id
    );
  end if;
  return new;
end $$;

drop trigger if exists na_registratie on auth.users;
create trigger na_registratie
  after insert on auth.users
  for each row execute function public.koppel_klant();


-- ── 3. Oude, open toegangsregels opruimen ───────────────────────
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('klanten', 'bestellingen', 'soepen', 'weekmenu')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;


-- ── 4. Klanten: alleen beheerder ziet alles, klant ziet zichzelf ─
alter table public.klanten enable row level security;

create policy "beheerder beheert klanten" on public.klanten
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "klant leest eigen gegevens" on public.klanten
  for select to authenticated
  using (user_id = auth.uid());

create policy "klant wijzigt eigen gegevens" on public.klanten
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ── 5. Bestellingen: klant ziet en plaatst enkel zijn eigen ─────
alter table public.bestellingen enable row level security;

create policy "beheerder beheert bestellingen" on public.bestellingen
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "klant leest eigen bestellingen" on public.bestellingen
  for select to authenticated
  using (klantid in (select id from public.klanten where user_id = auth.uid()));

create policy "klant plaatst eigen bestelling" on public.bestellingen
  for insert to authenticated
  with check (klantid in (select id from public.klanten where user_id = auth.uid()));


-- ── 6. Soepen en weekmenu: iedereen mag lezen, enkel beheerder wijzigt ─
alter table public.soepen enable row level security;

create policy "iedereen leest soepen" on public.soepen
  for select to anon, authenticated using (true);

create policy "beheerder beheert soepen" on public.soepen
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.weekmenu enable row level security;

create policy "iedereen leest weekmenu" on public.weekmenu
  for select to anon, authenticated using (true);

create policy "beheerder beheert weekmenu" on public.weekmenu
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
