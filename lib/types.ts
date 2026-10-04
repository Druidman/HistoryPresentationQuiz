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
  /** Max time for the question, in seconds. */
  duration: number;
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

/** One buffered answer: a picked option id, or free text for an open question. */
export type Selection =
  | { kind: "option"; optionId: string }
  | { kind: "custom"; text: string };

/** map: question_id -> selection */
export type Selections = Record<string, Selection>;

/** Whitespace-only custom text does not count as an answer. */
export function isAnswered(selection: Selection | undefined): boolean {
  if (!selection) return false;
  return selection.kind === "option" || selection.text.trim().length > 0;
}
