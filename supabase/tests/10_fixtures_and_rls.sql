-- Fixtures (as postgres = server) + RLS isolation tests.
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'), -- owner Alice (FR)
  ('00000000-0000-0000-0000-0000000000b2'), -- owner Bob (FR)
  ('00000000-0000-0000-0000-0000000000c1'), -- sitter Camille
  ('00000000-0000-0000-0000-0000000000c2'); -- sitter Marc
insert into public.profiles (id, role, first_name, city_id, country) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner', 'Alice', 'paris', 'FR'),
  ('00000000-0000-0000-0000-0000000000b2', 'owner', 'Bob', 'paris', 'FR'),
  ('00000000-0000-0000-0000-0000000000c1', 'sitter', 'Camille', 'paris', 'FR'),
  ('00000000-0000-0000-0000-0000000000c2', 'sitter', 'Marc', 'paris', 'FR');
insert into public.sitter_profiles (id, age, lat, lng, accepted_species, accepted_sizes) values
  ('00000000-0000-0000-0000-0000000000c1', 34, 48.86, 2.35, '{dog,cat}', '{cat,dogSmall,dogMedium,dogLarge,dogXL}'),
  ('00000000-0000-0000-0000-0000000000c2', 46, 48.84, 2.30, '{dog}', '{dogMedium,dogLarge,dogXL}');
insert into public.sitter_services (sitter_id, type, daily_rates) values
  ('00000000-0000-0000-0000-0000000000c1', 'boarding', '{"dogLarge":2340}'),
  ('00000000-0000-0000-0000-0000000000c2', 'boarding', '{"dogLarge":2860}');
insert into public.pets (id, owner_id, name, species, breed_id, weight_kg) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000a1', 'Pistache', 'dog', 'dog-golden-retriever', 28);
insert into public.pet_care (pet_id, vet_name, microchip) values
  ('00000000-0000-0000-0000-00000000f001', 'Dr Martin', '250269600000001');
insert into public.pet_photos (id, pet_id, storage_path) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000f001',
   '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-00000000f001/p1.jpg');

-- ---- Alice (owner) ----------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pets) = 1, 'owner sees her pet';
  assert (select count(*) from public.pet_care) = 1, 'owner sees her pet care';
  update public.profiles set owner_club = true where id = auth.uid();
  assert (select owner_club from public.profiles where id = auth.uid()) = false, 'owner cannot grant herself Owner Club';
  raise notice 'owner: full access to own pet, cannot self-grant Owner Club';
end $$;
commit;

-- ---- Bob (other owner) --------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pets) = 1, 'pet profiles are public inside the app';
  assert (select count(*) from public.pet_photos) = 1, 'pet gallery is public inside the app';
  assert (select count(*) from public.pet_care) = 0, 'other owner cannot see care';
  update public.pets set name = 'Hacked' where id = '00000000-0000-0000-0000-00000000f001';
  delete from public.pet_photos;
  raise notice 'other user: sees the public pet profile and gallery, never its care data, cannot modify or delete';
end $$;
commit;
do $$ begin
  assert (select name from public.pets where id = '00000000-0000-0000-0000-00000000f001') = 'Pistache', 'pet not modified by other owner';
  assert (select count(*) from public.pet_photos) = 1, 'photo not deleted by other owner';
end $$;

-- ---- Camille (sitter) before any request --------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pet_care) = 0, 'sitter cannot see care without a mission';
  update public.sitter_profiles set paw_points = 9999, identity_verified = true where id = auth.uid();
  assert (select paw_points from public.sitter_profiles where id = auth.uid()) = 0, 'sitter cannot edit paw points';
  assert (select identity_verified from public.sitter_profiles where id = auth.uid()) = false, 'sitter cannot self-verify';
  begin
    update public.sitter_services set daily_rates = '{"dogLarge":500}' where sitter_id = auth.uid();
    raise exception 'expected BELOW_MINIMUM';
  exception when others then
    assert sqlerrm = 'BELOW_MINIMUM', sqlerrm;
  end;
  begin
    insert into public.booking_requests (id, owner_id, service, start_date, days, country, currency, floor_cents)
    values ('4PG-AAAAAA', auth.uid(), 'boarding', current_date, 1, 'FR', 'EUR', 100);
    raise exception 'expected RLS violation';
  exception when insufficient_privilege then null;
  end;
  raise notice 'sitter: no care access without mission, reputation fields and floor protected, no direct booking writes';
end $$;
commit;

-- ---- Storage ------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('pet-photos', '00000000-0000-0000-0000-0000000000a1/x/evil.jpg');
    raise exception 'expected storage RLS violation';
  exception when insufficient_privilege then null;
  end;
  insert into storage.objects (bucket_id, name) values ('pet-photos', '00000000-0000-0000-0000-0000000000b2/p/ok.jpg');
  raise notice 'storage: users write only in their own folder';
end $$;
rollback;
