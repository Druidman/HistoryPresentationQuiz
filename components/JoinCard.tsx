"use client";

import { useState } from "react";
import { OrangeDot, SquigglyArrow, Wavy } from "@/components/decor";

/**
 * Stage 1: nickname entry. The anonymous sign-in + profile insert happen in
 * QuizFlow.startQuiz() once the participant submits this form.
 */
export function JoinCard({ onStart }: { onStart: (nickname: string) => Promise<void> }) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = nickname.trim().length >= 2 && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    await onStart(nickname);
    setBusy(false);
  }

  return (
    <section className="relative">
      {/* hand-drawn vertical squiggle entering the card, like the reference arrows */}
      <SquigglyArrow className="float-squiggle pointer-events-none absolute -top-16 left-6 hidden h-24 w-12 text-ink sm:block" />

      <h1 className="relative mb-6 text-center text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        <OrangeDot className="absolute -left-9 top-2 h-8 w-8 max-sm:hidden" />
        Skibidi <Wavy>quiz</Wavy>
      </h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-ink/15 bg-card p-6 shadow-[6px_6px_0_rgba(36,64,110,0.12)] sm:p-8"
      >
        <label htmlFor="nickname" className="mb-1 block text-lg font-bold text-accent-deep">
          Twój <Wavy>nick</Wavy>
        </label>
        <p className="mb-4 text-sm text-cocoa/70">
          Tak żebym ciebie mógł rozpoznać bo Pan będzie chciał odpowiedzi
        </p>

        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="np. alek_w5a"
          className="w-full rounded-2xl border-2 border-ink/25 bg-cream px-4 py-3 text-base text-cocoa outline-none transition placeholder:text-cocoa/40 focus:border-accent focus:bg-white"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-2xl border-2 border-ink bg-accent px-4 py-3.5 text-base font-bold text-white transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 enabled:hover:bg-accent-deep sm:text-lg"
        >
          {busy ? "Wchodzę do quizu…" : "Zaczynamy!"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-cocoa/60">
        10 pytań · Uważaj na czas · nie da się wrócić do poprzednich
      </p>
    </section>
  );
}
