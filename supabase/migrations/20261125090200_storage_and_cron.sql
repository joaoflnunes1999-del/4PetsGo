-- 4PetsGo — storage buckets and policies, scheduled offer expiry.

insert into storage.buckets (id, name, public) values
  ('pet-photos', 'pet-photos', false),
  ('breed-images', 'breed-images', true),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- pet-photos: path = {owner_id}/{pet_id}/{photo_id}.jpg — only the owner writes in their folder.
create policy pet_photos_objects_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy pet_photos_objects_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy pet_photos_objects_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Reading a file follows the pet_photos row visibility (owner / public / confirmed mission), evaluated with RLS.
create policy pet_photos_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'pet-photos' and exists (select 1 from public.pet_photos p where p.storage_path = name));

-- avatars: {user_id}/avatar.jpg — readable by signed-in users, written by the user only.
create policy avatars_objects_read on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy avatars_objects_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- breed-images is a public bucket managed from the dashboard / service role only (no client write policy).

-- Offer expiry every 10 minutes (pg_cron is available on Supabase; skipped where it is not installed).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('expire-offers', '*/10 * * * *', 'select private.expire_all_open_requests()');
  end if;
end;
$$;
