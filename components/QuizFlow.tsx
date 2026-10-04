"use client";

import { useCallback, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { DbQuestion, Selections } from "@/lib/types";
import {
  collectDeviceMetadata,
  enrichDeviceMetadata,
  getDeviceFingerprint,
} from "@/lib/device-metadata";
import { JoinCard } from "@/components/JoinCard";
import { QuizCard } from "@/components/QuizCard";
import { ThankYouCard } from "@/components/ThankYouCard";

type Stage = "join" | "quiz" | "submitting" | "done";

export function QuizFlow() {
  const [stage, setStage] = useState<Stage>("join");
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DbQuestion[] | null>(null);

  /** Step 1–3 of the flow: anon sign-in -> profile row -> fetch questions. */
  const startQuiz = useCallback(async (nickname: string) => {
    setError(null);
    try {
      const supabase = getSupabase();

      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error("Nie udało się zalogować anonimowo.");

      const baseMeta = collectDeviceMetadata();
      const meta = await enrichDeviceMetadata(baseMeta);
      const { error: profileError } = await supabase.from("profiles").insert({
        nickname: nickname.trim(),
        metadata: { ...meta, device_fingerprint: getDeviceFingerprint() },
      });
      if (profileError) throw profileError;

      const { data, error: questionsError } = await supabase
        .from("questions_with_options")
        .select("*")
        .order("created_at", { ascending: true });
      if (questionsError) throw questionsError;

      // Questions without options are open questions — keep them. Only drop
      // malformed rows (missing id/question text).
      const fetched = (data ?? []).filter(
        (q) => typeof q.id === "string" && typeof q.question === "string" && q.question.length > 0,
      );
      if (fetched.length === 0) {
        throw new Error("Nie znaleziono pytań w bazie. Skontaktuj się z prowadzącym.");
      }

      setQuestions(fetched);
      setStage("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coś poszło nie tak. Spróbuj ponownie.");
      // A half-finished attempt may have left a session behind — clean it up.
      try {
        await getSupabase().auth.signOut();
      } catch {
        /* ignore */
      }
    }
  }, []);

  /** Step 4: insert one user_answers row per question. */
  const submitQuiz = useCallback(async (selections: Selections) => {
    setError(null);
    setStage("submitting");
    try {
      const supabase = getSupabase();
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error("Sesja wygasła. Odśwież stronę i spróbuj ponownie.");

      type AnswerRow = {
        user_id: string;
        question_id: string;
        option_id?: string;
        custom_option_model?: string;
      };
      const rows: AnswerRow[] = Object.entries(selections).flatMap(
        ([questionId, selection]): AnswerRow[] => {
          if (selection.kind === "option") {
            return [{ user_id: uid, question_id: questionId, option_id: selection.optionId }];
          }
          // Timer expiry can sweep past an open question with whitespace-only text —
          // don't insert an empty custom answer.
          const text = selection.text.trim();
          return text.length > 0
            ? [{ user_id: uid, question_id: questionId, custom_option_model: text }]
            : [];
        },
      );
      if (rows.length === 0) throw new Error("Brak odpowiedzi do wysłania.");

      const { error: insertError } = await supabase.from("user_answers").insert(rows);
      if (insertError) throw insertError;

      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wysłać odpowiedzi.");
      setStage("quiz");
    }
  }, []);

  if (stage === "done") return <ThankYouCard />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-redline/60 bg-card px-4 py-3 text-sm font-medium text-cocoa"
          >
            {error}
          </div>
        )}
        {stage === "join" && <JoinCard onStart={startQuiz} />}
        {stage !== "join" && questions && (
          <QuizCard questions={questions} busy={stage === "submitting"} onSubmit={submitQuiz} />
        )}
      </div>
    </div>
  );
}
