-- Done

create table user_answers (
  id uuid not null default gen_random_uuid(),

  user_id uuid not null references public.profiles(user_id) on delete cascade on update cascade default auth.uid(),

  question_id uuid not null references public.questions(id) on delete cascade on update cascade,
  option_id uuid,
  custom_option_model text,

  constraint option_question_fk foreign key (option_id, question_id) 
  references public.options(id, question_id) on delete no action on update cascade,

  

  created_at timestamptz not null default now(),

  constraint has_option check (
    (option_id is not null and custom_option_model is null) or (option_id is null and custom_option_model is not null)
  ),
  

  unique(user_id, question_id),

  primary key(id)
);


alter table user_answers enable row level security;


create policy "user_answers - user can insert his answers"
on public.user_answers
as permissive
for insert
to authenticated
with check (user_id = auth.uid() and not exists(
  select 1 from public.user_answers ua where ua.question_id = user_answers.question_id and ua.user_id = user_answers.user_id
));

create policy "user_answers - no one can update"
on public.user_answers
as permissive
for update
to authenticated
using (false)
with check (false);

create policy "user_answers - no one can delete"
on public.user_answers
as permissive
for delete
to authenticated
using (false);

create policy "user_answers - user can view his answers"
on public.user_answers
as permissive
for select
to authenticated
using (user_id = auth.uid());
