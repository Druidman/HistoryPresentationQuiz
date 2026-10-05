-- making query for it holdon
select
  p.nickname,
  (
    select
      jsonb_agg(
        coalesce(
          (
            select 
            
              case
                when ua.option_id is not null then jsonb_build_object(
                  'answer_format', 'deterministic',
                  'answer_id', ua.id,
                  'is_correct', exists(
                    select 1 from correct_answers ca where ca.correct_option_id = ua.option_id and ca.question_id = ua.question_id
                  ),
                  'answered_at', ua.created_at
                )
                when ua.custom_option_model is not null then jsonb_build_object(
                  'answer_format', 'open',
                  'answer_id', ua.id,
                  'is_correct', false, -- not able to verify rn
                  'answered_at', ua.created_at
                )
                else null
              end
            
            from user_answers ua 
            where 
              ua.question_id = q.id and
              ua.user_id = p.user_id
            limit 1
          ),
          null
        )
      )
    from questions q
  ) as test_result 
from profiles p;