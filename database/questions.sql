-- Done

create table questions (
  id uuid not null default gen_random_uuid(),
  question text not null,
  duration integer not null, -- in seconds
  created_at timestamptz not null default now(),

  -- correct answer is in correct_answers
  primary key(id)
);

alter table questions enable row level security;


create policy "questions - no one can insert"
on public.questions
as permissive
for insert
to authenticated
with check (false);

create policy "questions - no one can update"
on public.questions
as permissive
for update
to authenticated
using (false)
with check (false);

create policy "questions - no one can delete"
on public.questions
as permissive
for delete
to authenticated
using (false);

create policy "questions - anyone can view"
on public.questions
as permissive
for select
to authenticated
using (true);