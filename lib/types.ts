export interface DbOption {
  id: string;
  question_id: string;
  option: string;
  created_at: string;
}

/** Row shape returned by the `questions_with_options` view. */
export interface DbQuestion {
  id: string;
  question: string;
  created_at: string;
  options: DbOption[] | null;
}

export interface ProfileRow {
  user_id: string;
  nickname: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserAnswerRow {
  id: string;
  user_id: string;
  question_id: string;
  option_id: string | null;
  custom_option_model: string | null;
  created_at: string;
}

/** map: question_id -> chosen option_id */
export type Selections = Record<string, string>;
