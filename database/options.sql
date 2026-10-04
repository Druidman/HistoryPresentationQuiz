-- Done

create table options (
  id uuid not null default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade on update cascade,
  option text not null,
  created_at timestamptz not null default now(),
  
  unique(id, question_id),
  primary key(id)
);


alter table options enable row level security;


create policy "options - no one can insert"
on public.options
as permissive
for insert
to authenticated
with check (false);

create policy "options - no one can update"
on public.options
as permissive
for update
to authenticated
using (false)
with check (false);

create policy "options - no one can delete"
on public.options
as permissive
for delete
to authenticated
using (false);

create policy "options - anyone can view"
on public.options
as permissive
for select
to authenticated
using (true);