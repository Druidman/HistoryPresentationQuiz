create or replace view questions_with_options with (security_invoker = on) as
SELECT 
  *,
  (
    SELECT jsonb_agg(row_to_json(o)) from options o where o.question_id = q.id
  ) as options
from public.questions q;