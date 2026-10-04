"use client";

import { useCallback, useState } from "react";
import type { DbQuestion, Selections } from "@/lib/types";
import { Connector, OrangeDot } from "@/components/decor";

/**
 * Stage 2: one question at a time, strictly forward-only.
 * Answers are buffered in state and inserted into user_answers in one batch on submit.
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

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(selections).length;

  const choose = useCallback(
    (optionId: string) => {
      setSelections((prev) => (prev[question.id] ? prev : { ...prev, [question.id]: optionId }));
    },
    [question.id],
  );

  function handleNext() {
    if (!isLast) setIndex((i) => i + 1);
  }

  const selectionForQuestion = question ? selections[question.id] : undefined;

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
        <h2 className="mb-1 text-lg font-bold text-accent-deep sm:text-xl">
          Pytanie {index + 1}
        </h2>
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
                disabled={busy || selectionForQuestion !== undefined}
                onClick={() => choose(option.id)}
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-medium transition sm:text-lg ${
                  selected
                    ? "border-ink bg-accent text-white shadow-[3px_3px_0_rgba(36,64,110,0.25)]"
                    : selectionForQuestion
                      ? "border-ink/10 bg-cream/60 text-cocoa/60"
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
            disabled={answeredCount < questions.length || busy}
            onClick={() => onSubmit(selections)}
            className="rounded-2xl border-2 border-ink bg-ink px-5 py-3 text-base font-bold text-cream transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-ink-soft sm:text-lg"
          >
            {busy ? "Wysyłam…" : "Wyślij odpowiedzi"}
          </button>
        ) : (
          <button
            type="button"
            disabled={selectionForQuestion === undefined || busy}
            onClick={handleNext}
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
