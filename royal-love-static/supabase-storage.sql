-- OPTIONAL: only if you want photo/audio uploads from the admin panel. Safe to re-run.
insert into storage.buckets(id,name,public) values('media','media',true) on conflict (id) do nothing;
drop policy if exists "media read" on storage.objects;
drop policy if exists "media upload" on storage.objects;
create policy "media read" on storage.objects for select using (bucket_id='media');
create policy "media upload" on storage.objects for insert to anon with check (bucket_id='media');
