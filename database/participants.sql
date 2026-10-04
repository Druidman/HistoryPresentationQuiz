-- Done

create table profiles (
  -- we will use anonymous signins
  user_id uuid not null references auth.users(id) on delete cascade on update cascade default auth.uid(),
  nickname varchar(500) not null,
  metadata jsonb,
  created_at timestamptz not null default now(),

  primary key(user_id)
);

alter table profiles enable row level security;

create policy "profiles - user can insert himself"
on public.profiles
as permissive
for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles - user can view himself"
on public.profiles
as permissive
for select
to authenticated
using (user_id = auth.uid());

create policy "profiles - no one can update"
on public.profiles
as permissive
for update
to authenticated
using (false)
with check (false);


create policy "profiles - no one can delete"
on public.profiles
as permissive
for delete
to authenticated
using (false);




