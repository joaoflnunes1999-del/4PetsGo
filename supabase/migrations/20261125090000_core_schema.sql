-- 4PetsGo — core schema: pricing config, breeds, profiles, sitters, pets, care, photos.
-- RLS is enabled on EVERY table. Server-owned columns are protected by triggers.

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.pricing_config (
  country text primary key check (country in ('FR', 'CH')),
  currency text not null check (currency in ('EUR', 'CHF')),
  -- cents per day per size category: {"cat":850,"dogSmall":900,...}
  min_daily_cents jsonb not null,
  km_rate_cents integer not null check (km_rate_cents >= 0),
  owner_fee_rate numeric(5, 4) not null,
  -- {"beginner":0.05,...,"master":0.01}
  sitter_commission jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.pricing_config (country, currency, min_daily_cents, km_rate_cents, owner_fee_rate, sitter_commission) values
  ('FR', 'EUR', '{"cat":850,"dogSmall":900,"dogMedium":1100,"dogLarge":1300,"dogXL":1700}', 37, 0.05,
   '{"beginner":0.05,"explorer":0.04,"advanced":0.03,"expert":0.02,"master":0.01}'),
  ('CH', 'CHF', '{"cat":2020,"dogSmall":2140,"dogMedium":2610,"dogLarge":3080,"dogXL":4030}', 45, 0.05,
   '{"beginner":0.05,"explorer":0.04,"advanced":0.03,"expert":0.02,"master":0.01}');

create table public.breeds (
  id text primary key,
  species text not null check (species in ('dog', 'cat')),
  name text not null,
  typical_size text check (typical_size in ('cat', 'dogSmall', 'dogMedium', 'dogLarge', 'dogXL')),
  -- path in the `breed-images` bucket; null = generic visual
  image_path text,
  sort_order integer not null default 100
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'sitter')),
  first_name text not null check (char_length(first_name) between 1 and 60),
  city_id text not null,
  country text not null references public.pricing_config (country),
  avatar_path text,
  -- set only by the server (Superwall/StoreKit webhook, phase 3)
  owner_club boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sitter_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  age integer not null check (age between 18 and 99),
  bio text not null default '' check (char_length(bio) <= 1500),
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  radius_km integer not null default 10 check (radius_km in (5, 10, 15, 20, 30)),
  -- approximate public location (city level), never the exact address
  lat double precision not null,
  lng double precision not null,
  accepted_species text[] not null check (accepted_species <@ array['dog', 'cat']::text[] and cardinality(accepted_species) > 0),
  accepted_sizes text[] not null check (accepted_sizes <@ array['cat', 'dogSmall', 'dogMedium', 'dogLarge', 'dogXL']::text[]),
  -- My Home & Environment (boarding only): housing, surfaceM2, balcony, garden, children, residentAnimals, canSeparate
  home jsonb,
  unavailable_dates date[] not null default '{}',
  -- server-owned
  paw_points integer not null default 0,
  completed_missions integer not null default 0,
  rating numeric(2, 1),
  review_count integer not null default 0,
  identity_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sitter_services (
  sitter_id uuid not null references public.sitter_profiles (id) on delete cascade,
  type text not null check (type in ('boarding', 'homeVisits', 'dogWalking')),
  -- boarding / homeVisits: {"cat":1200,...} cents per day, each ≥ country minimum
  daily_rates jsonb,
  walk_price_cents integer check (walk_price_cents > 0),
  walk_durations_min integer[],
  max_dogs integer check (max_dogs between 1 and 10),
  primary key (sitter_id, type),
  check (type <> 'dogWalking' or walk_price_cents is not null)
);

-- ---------------------------------------------------------------------------
-- Pets
-- ---------------------------------------------------------------------------

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  species text not null check (species in ('dog', 'cat')),
  breed_id text not null references public.breeds (id),
  birth_date date check (birth_date <= current_date),
  estimated_age_years numeric(4, 1) check (estimated_age_years between 0 and 30),
  sex text check (sex in ('male', 'female')),
  weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg <= 120),
  bio text check (char_length(bio) <= 220),
  main_photo_id uuid,
  personality jsonb not null default '{"traits":[]}',
  routine jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index pets_owner_id_idx on public.pets (owner_id);

-- Sensitive care data lives in its own table with stricter RLS (PRD §3.2).
create table public.pet_care (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  vet_name text,
  vet_phone text,
  vet_address text,
  microchip text,
  -- [{id,name,dosage,route,frequency,schedule}]
  medications jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table public.pet_photos (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- `pet-photos` bucket path: {owner_id}/{pet_id}/{photo_id}.jpg
  storage_path text not null unique,
  width integer,
  height integer,
  caption text check (char_length(caption) <= 200),
  created_at timestamptz not null default now()
);
create index pet_photos_pet_id_created_idx on public.pet_photos (pet_id, created_at desc);
create index pet_photos_owner_id_idx on public.pet_photos (owner_id);

alter table public.pets
  add constraint pets_main_photo_fk foreign key (main_photo_id) references public.pet_photos (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the current request runs with elevated rights (Edge Functions / migrations).
create or replace function private.is_server()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin')
    or coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role';
$$;

-- Weight first; without a weight, the breed's typical size; then dogMedium (mirrors pricing.ts sizeCategoryFor).
create or replace function private.size_category(p_species text, p_weight numeric, p_breed_size text default null)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_species = 'cat' then 'cat'
    when p_weight is null then coalesce(nullif(p_breed_size, 'cat'), 'dogMedium')
    when p_weight < 10 then 'dogSmall'
    when p_weight < 25 then 'dogMedium'
    when p_weight < 40 then 'dogLarge'
    else 'dogXL'
  end;
$$;

-- Owners may not grant themselves Owner Club; sitters may not edit reputation fields.
create or replace function private.protect_profile_server_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_server() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.owner_club := false;
  else
    new.owner_club := old.owner_club;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_server_fields
  before insert or update on public.profiles
  for each row execute function private.protect_profile_server_fields();

create or replace function private.protect_sitter_server_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_server() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.paw_points := 0;
    new.completed_missions := 0;
    new.rating := null;
    new.review_count := 0;
    new.identity_verified := false;
  else
    new.paw_points := old.paw_points;
    new.completed_missions := old.completed_missions;
    new.rating := old.rating;
    new.review_count := old.review_count;
    new.identity_verified := old.identity_verified;
  end if;
  return new;
end;
$$;

create trigger sitter_profiles_protect_server_fields
  before insert or update on public.sitter_profiles
  for each row execute function private.protect_sitter_server_fields();

-- Daily rates can never be below the country minimum (PRD §3.6).
create or replace function private.check_sitter_service_rates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_min jsonb;
  v_key text;
begin
  if new.type = 'dogWalking' then
    return new;
  end if;
  select c.min_daily_cents into v_min
  from public.profiles p
  join public.pricing_config c on c.country = p.country
  where p.id = new.sitter_id;
  if new.daily_rates is null then
    new.daily_rates := v_min;
    return new;
  end if;
  for v_key in select jsonb_object_keys(new.daily_rates) loop
    if not (v_min ? v_key) then
      raise exception 'Unknown size category %', v_key using errcode = '22023';
    end if;
    if (new.daily_rates ->> v_key)::integer < (v_min ->> v_key)::integer then
      raise exception 'BELOW_MINIMUM' using errcode = '22023', hint = v_key;
    end if;
  end loop;
  return new;
end;
$$;

create trigger sitter_services_check_rates
  before insert or update on public.sitter_services
  for each row execute function private.check_sitter_service_rates();

create or replace function private.set_photo_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select owner_id into new.owner_id from public.pets where id = new.pet_id;
  return new;
end;
$$;

create trigger pet_photos_set_owner
  before insert on public.pet_photos
  for each row execute function private.set_photo_owner();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.pricing_config enable row level security;
alter table public.breeds enable row level security;
alter table public.profiles enable row level security;
alter table public.sitter_profiles enable row level security;
alter table public.sitter_services enable row level security;
alter table public.pets enable row level security;
alter table public.pet_care enable row level security;
alter table public.pet_photos enable row level security;

create policy pricing_config_read on public.pricing_config for select to authenticated using (true);
create policy breeds_read on public.breeds for select to anon, authenticated using (true);

-- Profiles hold no sensitive data (first name, city): readable by signed-in users.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_delete_self on public.profiles for delete to authenticated using (id = (select auth.uid()));

create policy sitter_profiles_read on public.sitter_profiles for select to authenticated using (true);
create policy sitter_profiles_insert_self on public.sitter_profiles for insert to authenticated
  with check (id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'sitter'));
create policy sitter_profiles_update_self on public.sitter_profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy sitter_services_read on public.sitter_services for select to authenticated using (true);
create policy sitter_services_write_self on public.sitter_services for all to authenticated
  using (sitter_id = (select auth.uid())) with check (sitter_id = (select auth.uid()));

-- Pet profiles and their gallery are public inside the app (like Instagram, founder decision 25/11/2026).
-- Only the owner writes. Sensitive data lives elsewhere: pet_care and mission photos.
create policy pets_read_all on public.pets for select to authenticated using (true);
create policy pets_owner_write on public.pets for insert to authenticated with check (owner_id = (select auth.uid()));
create policy pets_owner_update on public.pets for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy pets_owner_delete on public.pets for delete to authenticated using (owner_id = (select auth.uid()));

create policy pet_care_owner_all on public.pet_care for all to authenticated
  using (exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid())));

create policy pet_photos_read_all on public.pet_photos for select to authenticated using (true);
create policy pet_photos_owner_insert on public.pet_photos for insert to authenticated
  with check (exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = (select auth.uid())));
create policy pet_photos_owner_update on public.pet_photos for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy pet_photos_owner_delete on public.pet_photos for delete to authenticated using (owner_id = (select auth.uid()));
