"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DbQuestion, Selections } from "@/lib/types";
import { Connector, OrangeDot } from "@/components/decor";

/** Fallback when a question row somehow lacks a usable duration (seconds). */
const FALLBACK_DURATION_SEC = 30;
/** Remaining time below which the countdown pill turns red and pulses. */
const URGENT_SECONDS = 5;

function durationOf(question: DbQuestion | undefined): number {
  const raw = question?.duration;
  return typeof raw === "number" && Number.isFinite(raw)
    ? Math.max(1, Math.floor(raw))
    : FALLBACK_DURATION_SEC;
}

/**
 * Stage 2: one question at a time, forward-only. Each question has its own
 * countdown (`duration` seconds from the questions table) — expiry auto-advances,
 * or auto-submits on the last question. Answers stay changeable while the
 * question is on screen and are batch-inserted into user_answers on submit.
 */
export function QuizCard({
  questions,
  busy,
  onSubmit,
}: {
  questions: DbQuestion[];
  busy: boolean;
  onSubmit: (selections: Selections) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [secondsLeft, setSecondsLeft] = useState(() => durationOf(questions[0]));

  const question = questions[index];
  const durationSec = durationOf(question);
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(selections).length;
  const urgent = secondsLeft <= URGENT_SECONDS;

  const selectionForQuestion = question ? selections[question.id] : undefined;

  // Reset the countdown whenever the question changes. Done during render (the
  // React-documented "adjust state on prop change" pattern) instead of inside the
  // timer effect, where a synchronous setState is an anti-pattern the lint rule
  // (react-hooks/set-state-in-effect) rejects.
  const [countdownQuestionId, setCountdownQuestionId] = useState(question.id);
  if (countdownQuestionId !== question.id) {
    setCountdownQuestionId(question.id);
    setSecondsLeft(durationSec);
  }

  // Restart the countdown when a submit cycle ends back on this screen (insert
  // failed -> QuizFlow returns to the quiz stage). Without this the last question
  // would be left with a dead 0s timer and no further auto-submit.
  const [timerGen, setTimerGen] = useState(0);
  const [prevBusy, setPrevBusy] = useState(busy);
  if (prevBusy !== busy) {
    setPrevBusy(busy);
    if (prevBusy) {
      setTimerGen((g) => g + 1);
      setSecondsLeft(durationSec);
    }
  }

  // Latest values for the timer's expiry callback (closures would go stale).
  const latestRef = useRef({ busy, isLast, selections });
  useEffect(() => {
    latestRef.current = { busy, isLast, selections };
  });

  // Guards so a Dalej click and a timer tick landing in the same instant
  // can't advance twice, and submit can't be triggered concurrently.
  const advancingRef = useRef(false);
  const submittingRef = useRef(false);

  // Selecting again simply overwrites — the choice stays editable until submit.
  const choose = useCallback(
    (optionId: string) => {
      setSelections((prev) => ({ ...prev, [question.id]: optionId }));
    },
    [question.id],
  );

  const tryAdvance = useCallback(() => {
    if (advancingRef.current || latestRef.current.busy) return;
    advancingRef.current = true;
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const trySubmit = useCallback(() => {
    if (submittingRef.current || latestRef.current.busy) return;
    submittingRef.current = true;
    // submitQuiz handles its own errors, but never let this ref stay stuck.
    Promise.resolve(onSubmit(latestRef.current.selections))
      .catch(() => {})
      .finally(() => {
        submittingRef.current = false;
      });
  }, [onSubmit]);

  // Per-question countdown, deadline-based so it stays accurate.
  useEffect(() => {
    advancingRef.current = false;
    const deadline = Date.now() + durationSec * 1000;
    const interval = setInterval(() => {
      const remainingMs = deadline - Date.now();
      if (remainingMs > 0) {
        setSecondsLeft(Math.ceil(remainingMs / 1000));
        return;
      }
      clearInterval(interval);
      setSecondsLeft(0);
      // Expiry while a submit is in flight is suppressed — the submit flow owns the UI.
      if (latestRef.current.busy) return;
      if (latestRef.current.isLast) trySubmit();
      else tryAdvance();
    }, 250);
    return () => clearInterval(interval);
  }, [durationSec, index, timerGen, tryAdvance, trySubmit]);

  return (
    <section className="relative">
      {/* progress line above the card, like the blue line feeding the orange dot */}
      <div className="mb-4 flex items-center gap-3">
        <OrangeDot className="h-4 w-4 shrink-0" />
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink/15">
          <div
            className="h-full rounded-full bg-ink transition-all duration-300"
            style={{ width: `${((index + (selectionForQuestion ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="rounded-3xl border-2 border-ink/15 bg-card p-5 shadow-[6px_6px_0_rgba(36,64,110,0.12)] sm:p-7">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-accent-deep sm:text-xl">
            Pytanie {index + 1}
          </h2>
          <span
            role="timer"
            aria-label={`Pozostały czas: ${secondsLeft} sekund`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold tabular-nums transition-colors ${
              urgent
                ? "pulse-urgent border-redline bg-redline/10 text-redline"
                : "border-ink/25 bg-cream text-ink-soft"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2.5" />
              <path d="M12 13V8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 13l3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {secondsLeft}s
          </span>
        </div>
        <p className="mb-5 text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {question.question}
        </p>

        <div className="grid gap-2.5">
          {question.options!.map((option, i) => {
            const selected = selectionForQuestion === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => choose(option.id)}
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-medium transition sm:text-lg ${
                  selected
                    ? "border-ink bg-accent text-white shadow-[3px_3px_0_rgba(36,64,110,0.25)]"
                    : "border-ink/25 bg-cream text-cocoa enabled:hover:-translate-y-0.5 enabled:hover:border-accent enabled:hover:shadow-[3px_3px_0_rgba(242,128,62,0.35)] active:translate-y-0"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    selected ? "border-white bg-white text-accent" : "border-ink/40 text-ink-soft"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option.option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-cocoa/60">
          {answeredCount}/{questions.length} odpowiedzi
        </span>

        {isLast ? (
          <button
            type="button"
            disabled={answeredCount === 0 || busy}
            onClick={trySubmit}
            className="rounded-2xl border-2 border-ink bg-ink px-5 py-3 text-base font-bold text-cream transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-ink-soft sm:text-lg"
          >
            {busy ? "Wysyłam…" : "Wyślij odpowiedzi"}
          </button>
        ) : (
          <button
            type="button"
            disabled={selectionForQuestion === undefined || busy}
            onClick={tryAdvance}
            className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-accent px-5 py-3 text-base font-bold text-white transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-accent-deep sm:text-lg"
          >
            Dalej
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M5 12h13M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* small hand-drawn connector under the card, decorative */}
      <Connector className="left-1/2 top-full hidden h-0.5 w-16 -translate-x-1/2 sm:block" />
    </section>
  );
}
