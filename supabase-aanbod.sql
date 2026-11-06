-- SOEPRONDE — meerdere soorten producten (soep, snacks, hoofdgerechten…)
-- Al uitgevoerd op de Supabase-database op 6 november 2026.
alter table public.soepen add column if not exists categorie text not null default 'Soep';
alter table public.soepen add column if not exists eenheid text not null default 'portie';
alter table public.weekmenu add column if not exists producten integer[] not null default '{}';
update public.weekmenu set producten = array_remove(array[soep1, soep2, soep3], null) where producten = '{}';
alter table public.bestellingen add column if not exists items jsonb;
