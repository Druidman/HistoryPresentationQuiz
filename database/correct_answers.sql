create table correct_answers (
  id uuid not null default gen_random_uuid(),

  question_id uuid not null references public.questions(id) on delete cascade on update cascade,


  correct_option_id uuid,
  correct_option_model text,
  created_at timestamptz not null default now(),

  constraint option_question_fk foreign key (correct_option_id, question_id)
  references public.options(id, question_id) on delete cascade on update cascade,

  constraint has_some_answer check (
    (correct_option_id is not null and correct_option_model is null) or
    (correct_option_model is not null and correct_option_id is null)
  ),

  

  primary key(id)
);
-- no unique on question_id alone which allows for multiple choice
create unique index correct_answers_unique_option_id_idx on public.correct_answers(question_id, correct_option_id) where
(correct_option_model is null);
create unique index correct_answers_unique_option_model_idx on public.correct_answers(question_id, correct_option_model) where
(correct_option_id is null);

alter table correct_answers enable row level security;

create policy "correct_answers - no one can insert"
on public.correct_answers
as permissive
for insert
to authenticated
with check (false);

create policy "correct_answers - no one can delete"
on public.correct_answers
as permissive
for delete
to authenticated
using (false);

create policy "correct_answers - no one can update"
on public.correct_answers
as permissive
for update
to authenticated
using (false)
with check (false);


-- this is intentional
create policy "correct_answers - no one can view"
on public.correct_answers
as permissive
for select
to authenticated
using (false);
