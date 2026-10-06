"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { OrangeDot, SquigglyArrow, Wavy } from "@/components/decor";

/**
 * Hardcoded copy of analytics/toUse.json (specifics translated into Polish).
 * /results is a static, presentation-time summary, so the numbers live inline
 * instead of being fetched at runtime. Anything shown on this page comes from
 * this data (or trivial arithmetic on it).
 */
const ANDROID = { count: 10, score: 72, avg: 7.2, median: 5.5 };
const APPLE = { count: 9, score: 59, avg: 6.6, median: 5 };

const LEADERBOARD: { score: number; names: string[] }[] = [
  { score: 9, names: ["marek", "MaksŻelazowski"] },
  {
    score: 8,
    names: ["Wi🤖", "michal", "hania", "Alek", "Kostek Sytnyk", "Gumiś"],
  },
  { score: 7, names: ["Kryspin Bartoszek", "takzwany maciej"] },
  {
    score: 6,
    names: [
      "Ola",
      "Kamil",
      "Suchy",
      "Antoni Maćkowiak",
      "Olek pindolek",
      "Kajtek 😎😎😎😎🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐",
    ],
  },
  { score: 5, names: ["Kamila", "Igor", "nino"] },
];

const SPECIFICS = [
  "Najniższy poziom baterii podczas quizu: 'marek' z 49%",
  "Najwyższy poziom baterii podczas quizu: 'Ola' z 97%",
  "Najszybszy internet podczas quizu: Ola z 1,6 mb/s i 4g",
  "Najwolniejszy internet podczas quizu: Kajtek z 0,15 mb/s i slow-2g",
  "Najmniej aktywnych rdzeni CPU: Michał z 3 rdzeniami",
];

/** Quiz questions in order (analytics/toUse.json -> questions). */
const QUESTIONS = [
  "Którzy politycy przedstawili dwie różne wizje zjednoczenia Europy na początku integracji?",
  "Jakie trzy państwa utworzyły Beneluks?",
  "W którym roku powstała Rada Europy i z czyjej inicjatywy?",
  "Na mocy jakiego traktatu i kiedy powołano Europejską Wspólnotę Węgla i Stali?",
  "Co powstało na mocy traktatów rzymskich z 1957 r.?",
  "Która z poniższych zmian NIE była wynikiem Soboru Watykańskiego II?",
  "Jaką metodę walki stosował Martin Luther King i co osiągnięto do 1964 r.?",
  "Czym charakteryzowały się państwa dobrobytu w powojennej Europie Zachodniej?",
  "Jakie zjawisko związane jest bezpośrednio z wprowadzeniem pigułki antykoncepcyjnej w 1960 r.?",
  "Kim była Betty Friedan?",
];

/** nick -> 1/0 per question, aligned with QUESTIONS (toUse.json -> user_answers). */
const USER_ANSWERS: Record<string, number[]> = {
  "Wi🤖": [1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
  michal: [1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
  Kamila: [1, 1, 0, 0, 0, 0, 1, 0, 1, 1],
  hania: [1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
  Alek: [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  "Kostek Sytnyk": [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  "Gumiś": [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  Igor: [1, 1, 0, 0, 0, 1, 0, 1, 0, 1],
  Ola: [0, 1, 1, 0, 0, 1, 0, 1, 1, 1],
  Kamil: [1, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  Suchy: [0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
  "Kryspin Bartoszek": [1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
  "Antoni Maćkowiak": [1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
  "takzwany maciej": [0, 1, 1, 1, 1, 0, 0, 1, 1, 1],
  "Olek pindolek": [1, 1, 1, 1, 0, 1, 0, 0, 0, 1],
  marek: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  "Kajtek 😎😎😎😎🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐": [1, 1, 0, 0, 0, 1, 1, 1, 0, 1],
  MaksŻelazowski: [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  nino: [1, 1, 1, 0, 0, 0, 1, 0, 0, 1],
};

/* ---------- derived (pure arithmetic on the data above) ---------- */

const TOTAL = ANDROID.count + APPLE.count; // 19
const PLAYER_COUNT = LEADERBOARD.reduce((n, row) => n + row.names.length, 0); // 19
const ANDROID_PCT = Math.round((ANDROID.count / TOTAL) * 100); // 53
const APPLE_PCT = Math.round((APPLE.count / TOTAL) * 100); // 47
const CHAMPS = LEADERBOARD[0];

const round1 = (v: number) => Math.round(v * 10) / 10;
const pl = (v: number) => v.toFixed(1).replace(".", ",");

const DIFFS = [
  `+${ANDROID.score - APPLE.score} pkt łącznie`,
  `+${pl(round1(ANDROID.avg - APPLE.avg))} średniej`,
  `+${pl(round1(ANDROID.median - APPLE.median))} mediany`,
];

type MetricKey = "score" | "avg" | "median";
const METRIC_KEYS = ["score", "avg", "median"] as const;
const METRICS: Record<
  MetricKey,
  { label: string; note: string; android: number; apple: number; fmt: (v: number) => string }
> = {
  score: {
    label: "Punkty",
    note: "suma punktów ekip",
    android: ANDROID.score,
    apple: APPLE.score,
    fmt: (v) => `${v} pkt`,
  },
  avg: {
    label: "Średnia",
    note: "na gracza",
    android: ANDROID.avg,
    apple: APPLE.avg,
    fmt: (v) => pl(v),
  },
  median: {
    label: "Mediana",
    note: "na gracza",
    android: ANDROID.median,
    apple: APPLE.median,
    fmt: (v) => pl(v),
  },
};

/** Splits "Title: detail" into two parts (first colon only). */
function splitSpecific(text: string): [string, string] {
  const i = text.indexOf(":");
  return i === -1 ? [text, ""] : [text.slice(0, i), text.slice(i + 1).trim()];
}

/** Deterministic confetti — fixed values, no Math.random (hydration safety). */
const CONFETTI = [
  { left: "3%", delay: "0s", dur: "7s", w: 10, h: 14, round: false, color: "bg-accent" },
  { left: "9%", delay: "2.2s", dur: "8.5s", w: 8, h: 12, round: true, color: "bg-ink" },
  { left: "16%", delay: "1.1s", dur: "6.8s", w: 12, h: 16, round: false, color: "bg-redline" },
  { left: "23%", delay: "3.4s", dur: "7.6s", w: 9, h: 13, round: false, color: "bg-accent-deep" },
  { left: "31%", delay: "0.6s", dur: "8.9s", w: 11, h: 11, round: true, color: "bg-ink-soft" },
  { left: "38%", delay: "4.1s", dur: "6.4s", w: 8, h: 14, round: false, color: "bg-accent" },
  { left: "46%", delay: "1.8s", dur: "8.1s", w: 13, h: 13, round: true, color: "bg-redline" },
  { left: "54%", delay: "2.9s", dur: "7.2s", w: 9, h: 15, round: false, color: "bg-ink" },
  { left: "61%", delay: "0.3s", dur: "9.2s", w: 10, h: 10, round: true, color: "bg-accent-deep" },
  { left: "69%", delay: "3.7s", dur: "6.9s", w: 12, h: 14, round: false, color: "bg-accent" },
  { left: "77%", delay: "1.5s", dur: "7.9s", w: 8, h: 12, round: false, color: "bg-ink-soft" },
  { left: "85%", delay: "4.5s", dur: "6.6s", w: 11, h: 16, round: true, color: "bg-redline" },
  { left: "92%", delay: "2.5s", dur: "8.3s", w: 9, h: 13, round: false, color: "bg-ink" },
  { left: "97%", delay: "0.9s", dur: "7.4s", w: 10, h: 15, round: false, color: "bg-accent" },
];

/* ---------- little building blocks ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      <OrangeDot className="absolute -left-6 top-1.5 h-4 w-4 max-sm:hidden" />
      <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{children}</h2>
    </div>
  );
}

function VersusBar({
  emoji,
  label,
  valueText,
  widthPct,
  barClass,
  delay,
}: {
  emoji: string;
  label: string;
  valueText: string;
  widthPct: number;
  barClass: string;
  delay: string;
}) {
  return (
    <div className="pop-in" style={{ animationDelay: delay }}>
      <div className="mb-1 flex items-baseline justify-between text-sm font-bold text-ink sm:text-base">
        <span>
          {emoji} {label}
        </span>
        <span className="tabular-nums">{valueText}</span>
      </div>
      <div className="h-6 overflow-hidden rounded-full border-2 border-ink/25 bg-cream sm:h-7">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function RevealCard({
  text,
  index,
  flipped,
  onFlip,
}: {
  text: string;
  index: number;
  flipped: boolean;
  onFlip: () => void;
}) {
  const [title, detail] = splitSpecific(text);
  return (
    <div
      className={`pop-in ${index % 2 ? "sm:rotate-1" : "sm:-rotate-1"} sm:hover:rotate-0`}
      style={{ animationDelay: `${0.1 + index * 0.12}s` }}
    >
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={`Wyróżnienie numer ${index + 1} — ${flipped ? "odkryte" : "kliknij, aby odkryć"}`}
        className="flip-scene relative block w-full cursor-pointer text-left"
      >
        {/* Grid stacking (both faces in cell 1/1) instead of fixed heights: the
            card grows with the longer face, so long Polish facts can't overflow
            the card on narrow phone screens. */}
        <div className={`flip-inner grid ${flipped ? "flipped" : ""}`}>
          <div className="col-start-1 row-start-1" aria-hidden>
            <div className="flip-face rounded-3xl border-2 border-transparent p-4 opacity-0">
              {/* back — the fact (invisible sizer: keeps mobile card height stable) */}
              <p className="text-sm font-bold leading-snug text-accent-deep">{title}</p>
              <p className="mt-2 text-lg font-extrabold leading-snug text-ink">{detail}</p>
            </div>
          </div>
          {/* front — mystery */}
          <div className="flip-face col-start-1 row-start-1 rounded-3xl border-2 border-ink/15 bg-card p-4 shadow-[5px_5px_0_rgba(36,64,110,0.12)]">
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-3 rounded-sm border border-ink/10 bg-cream/90 shadow-sm"
            />
            <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
              Wyróżnienie #{index + 1}
            </p>
            <div className="pulse-urgent mt-4 text-center text-5xl" aria-hidden>
              ❓
            </div>
            <p className="mt-4 text-center text-sm font-semibold text-cocoa/70">
              {flipped ? "odkryte ✅" : "kliknij, aby odkryć"}
            </p>
          </div>
          {/* back — the fact */}
          <div className="flip-face flip-back col-start-1 row-start-1 rounded-3xl border-2 border-ink bg-cream p-4 shadow-[5px_5px_0_rgba(242,128,62,0.4)]">
            <p className="text-sm font-bold leading-snug text-accent-deep">{title}</p>
            <p className="mt-2 text-lg font-extrabold leading-snug text-ink">{detail}</p>
          </div>
        </div>
      </button>
    </div>
  );
}

/** Clickable player chip — dark/orange when its answer report is open. */
function PlayerChip({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold break-words transition active:translate-y-0 ${
        selected
          ? "border-ink bg-accent text-white shadow-[2px_2px_0_rgba(36,64,110,0.3)]"
          : "border-ink/20 bg-card text-cocoa hover:-translate-y-0.5 hover:border-accent hover:shadow-[2px_2px_0_rgba(242,128,62,0.35)]"
      }`}
    >
      {name}
    </button>
  );
}

/** Landing offset so the report header isn't flush with the viewport top. */
const SCROLL_MARGIN_PX = 88;

/**
 * Per-player answer report: one ✓/✕ row per quiz question, in quiz order.
 * Scroll-into-view fires on mount and whenever the selected player changes
 * (the parent remounts it via key={name}).
 */
function AnswerReport({ name, onClose }: { name: string; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect users who opt out of motion (also covers shaky mobile scroll).
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Double rAF: let the freshly mounted report settle its layout first —
    // scrolling in the same frame as the insert can land short of the target.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_MARGIN_PX;
        window.scrollTo({ top: Math.max(top, 0), behavior: reduced ? "auto" : "smooth" });
      });
    });
  }, []);

  const answers = USER_ANSWERS[name];
  if (!answers) return null;
  const correct = answers.reduce((n, v) => n + v, 0);

  return (
    <section
      ref={ref}
      aria-label={`Raport odpowiedzi: ${name}`}
      className="pop-in mt-5 rounded-2xl border-2 border-dashed border-ink/40 bg-cream/80 p-4 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-ink">
          📋 Raporcik: <span className="break-words text-accent-deep">{name}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border-2 border-ink/30 bg-card px-3 py-1 text-xs font-bold text-ink-soft transition hover:border-redline hover:text-redline"
        >
          zamknij ✕
        </button>
      </div>
      <p className="mb-3 text-sm font-semibold text-cocoa/65 tabular-nums">
        {correct}/{QUESTIONS.length} poprawnych — pytanie po pytaniu:
      </p>
      <ol className="grid gap-1.5">
        {QUESTIONS.map((q, i) => {
          const ok = answers[i] === 1;
          return (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-xl border-2 px-3 py-2 text-sm ${
                ok ? "border-ok/35 bg-ok/10" : "border-redline/40 bg-redline/10"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-extrabold text-white ${
                  ok ? "border-ok bg-ok" : "border-redline bg-redline"
                }`}
              >
                {ok ? "✓" : "✕"}
              </span>
              <span className="font-medium text-cocoa">
                <span className="font-bold tabular-nums text-ink-soft">{i + 1}. </span>
                {q}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- the page ---------- */

export function ResultsBoard() {
  const [metric, setMetric] = useState<MetricKey>("score");
  const [flipped, setFlipped] = useState<boolean[]>(() => SPECIFICS.map(() => false));
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  /** Clicking a player toggles their answer report (only one open at a time). */
  const togglePlayer = useCallback((name: string) => {
    setSelectedPlayer((prev) => (prev === name ? null : name));
  }, []);

  const flippedCount = flipped.filter(Boolean).length;
  const allFlipped = flippedCount === SPECIFICS.length;

  const m = METRICS[metric];
  const maxVal = Math.max(m.android, m.apple);
  const androidWidth = (m.android / maxVal) * 100;
  const appleWidth = (m.apple / maxVal) * 100;

  const flip = (i: number) =>
    setFlipped((prev) => prev.map((v, j) => (j === i ? !v : v)));

  return (
    <div>
      {/* confetti behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`confetti-piece absolute top-[-5vh] ${c.color} ${c.round ? "rounded-full" : "rounded-[2px]"}`}
            style={{
              left: c.left,
              width: c.w,
              height: c.h,
              animation: `confetti-fall ${c.dur} linear ${c.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ---------- hero ---------- */}
      <header className="relative z-10 mx-auto max-w-3xl px-4 pt-14 text-center sm:pt-20">
        <SquigglyArrow className="float-squiggle absolute -top-4 left-4 hidden h-24 w-12 rotate-12 text-ink sm:block" />
        <p className="mb-3 inline-block rounded-full border-2 border-ink bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink-soft shadow-[3px_3px_0_rgba(36,64,110,0.15)] sm:text-sm">
          🏁 Koniec quizu · {PLAYER_COUNT} graczy 
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          <OrangeDot className="absolute -left-2 top-3 h-9 w-9 max-sm:hidden" />
          Wyniki <Wavy>quizu</Wavy>
        </h1>
        <p className="mt-4 text-base font-medium text-cocoa/70 sm:text-lg">
          Wszystko policzone na prawdziwych danych.
        </p>
      </header>

      {/* ---------- android vs ios showdown ---------- */}
      <section className="relative z-10 mx-auto mt-12 max-w-3xl px-4 sm:mt-16">
        <div className="relative rounded-3xl border-2 border-ink/15 bg-card p-5 shadow-[6px_6px_0_rgba(36,64,110,0.12)] sm:p-7">
          <SectionTitle>
            Android <span className="text-ink-soft">vs</span> iOS
          </SectionTitle>
          <p className="mt-1 text-sm font-medium text-cocoa/65">
            pojedynek  — zestawienie liczb prosto z ankiety
          </p>

          {/* user share */}
          <p className="mt-6 text-sm font-bold text-ink-soft">
            Kto grał na czym ({TOTAL} graczy)
          </p>
          <div className="mt-2 flex h-10 overflow-hidden rounded-full border-2 border-ink bg-cream shadow-[3px_3px_0_rgba(36,64,110,0.12)]">
            <div
              className="flex items-center justify-center bg-accent text-sm font-extrabold text-white transition-all duration-700"
              style={{ width: `${ANDROID_PCT}%` }}
            >
              🤖 {ANDROID_PCT}%
            </div>
            <div
              className="flex items-center justify-center bg-ink text-sm font-extrabold text-cream transition-all duration-700"
              style={{ width: `${APPLE_PCT}%` }}
            >
              🍎 {APPLE_PCT}%
            </div>
          </div>
          <p className="mt-1.5 text-xs font-medium text-cocoa/60 tabular-nums">
            {ANDROID.count} Androidów · {APPLE.count} iOS-ów
          </p>

          {/* metric toggle */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink-soft">
              Porównanie: <span className="text-cocoa/55">{m.note}</span>
            </p>
            <div
              role="group"
              aria-label="Wybierz metrykę porównania"
              className="inline-flex rounded-full border-2 border-ink bg-cream p-1 shadow-[3px_3px_0_rgba(36,64,110,0.12)]"
            >
              {METRIC_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  aria-pressed={metric === key}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                    metric === key
                      ? "bg-ink text-cream shadow-[2px_2px_0_rgba(36,64,110,0.3)]"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {METRICS[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* animated bars */}
          <div className="mt-4 grid gap-4">
            <VersusBar
              emoji="🤖"
              label="Android"
              valueText={m.fmt(m.android)}
              widthPct={androidWidth}
              barClass="bg-accent"
              delay="0.15s"
            />
            <VersusBar
              emoji="🍎"
              label="iOS"
              valueText={m.fmt(m.apple)}
              widthPct={appleWidth}
              barClass="bg-ink"
              delay="0.3s"
            />
          </div>

          {/* verdict — android wins */}
          <div className="mt-6 -rotate-1 rounded-2xl border-2 border-ink bg-accent px-4 py-4 text-white shadow-[4px_4px_0_rgba(36,64,110,0.25)]">
            <p className="text-lg font-extrabold sm:text-xl">
              🏆 Werdykt: Android wygrywa ten quiz!
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIFFS.map((d) => (
                <span
                  key={d}
                  className="rounded-full border-2 border-white/70 bg-white/15 px-3 py-1 text-xs font-bold tabular-nums sm:text-sm"
                >
                  {d}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-white/85">
              iOS walczył dzielnie, ale fakty są faktami 🤖✌️
            </p>
          </div>
        </div>
      </section>

      {/* ---------- leaderboard ---------- */}
      <section className="relative z-10 mx-auto mt-12 max-w-3xl px-4 sm:mt-16">
        <div className="relative rounded-3xl border-2 border-ink/15 bg-card p-5 shadow-[6px_6px_0_rgba(36,64,110,0.12)] sm:p-7">
          <SectionTitle>
            Tablica <Wavy className="text-accent-deep">wyników</Wavy>
          </SectionTitle>
          <p className="mt-1 text-sm font-medium text-cocoa/65">
            {PLAYER_COUNT} graczy
          </p>

          {/* two best — champions */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {CHAMPS.names.map((name, i) => (
              <div
                key={name}
                className="pop-in"
                style={{ animationDelay: `${0.15 + i * 0.18}s` }}
              >
                <div className="shimmer relative overflow-hidden rounded-2xl border-2 border-accent-deep bg-gradient-to-br from-cream via-card to-cream p-5 text-center shadow-[5px_5px_0_rgba(226,98,43,0.35)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-[-1deg]">
                  <div className="crown-bob text-4xl" aria-hidden>
                    👑
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-accent-deep">
                    Współkról quizu #{i + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => togglePlayer(name)}
                    aria-pressed={selectedPlayer === name}
                    title="Pokaż odpowiedzi tego gracza"
                    className={`cursor-pointer break-words text-2xl font-extrabold transition ${
                      selectedPlayer === name
                        ? "text-accent-deep"
                        : "text-ink hover:text-accent"
                    }`}
                  >
                    {name}
                  </button>
                  <span className="mt-3 inline-block rounded-full border-2 border-ink bg-accent px-4 py-1 text-sm font-extrabold text-white tabular-nums">
                    {CHAMPS.score} pkt
                  </span>
                  <p className="mt-2 text-xs font-semibold text-cocoa/55">ex aequo na tronie</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-medium text-cocoa/55">
            dwójka najlepszych — wynik nie do pobicia
          </p>
          <p className="mt-1 text-center text-xs font-medium text-cocoa/55">
            💡 kliknij na gracza, żeby zobaczyć jego odpowiedzi pytanie po pytaniu 💡
          </p>

          {selectedPlayer && CHAMPS.names.includes(selectedPlayer) && (
            <AnswerReport
              key={selectedPlayer}
              name={selectedPlayer}
              onClose={() => setSelectedPlayer(null)}
            />
          )}

          {/* everyone else, grouped by score */}
          <div className="mt-5 grid gap-3">
            {LEADERBOARD.slice(1).map((row, i) => (
              <Fragment key={row.score}>
                <div
                  className="pop-in flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink/15 bg-cream/70 px-3 py-2.5"
                  style={{ animationDelay: `${0.4 + i * 0.12}s` }}
                >
                  <span className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-sm font-extrabold text-cream tabular-nums">
                    {row.score} pkt
                  </span>
                  {row.names.map((n) => (
                    <PlayerChip
                      key={n}
                      name={n}
                      selected={selectedPlayer === n}
                      onSelect={() => togglePlayer(n)}
                    />
                  ))}
                </div>

                {selectedPlayer && row.names.includes(selectedPlayer) && (
                  <AnswerReport
                    key={selectedPlayer}
                    name={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- WYRÓŻNIENIA reveal cards ---------- */}
      <section className="relative z-10 mx-auto mt-12 max-w-3xl px-4 sm:mt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>
            <Wavy className="text-accent-deep">WYRÓŻNIENIA</Wavy>
          </SectionTitle>
          <span
            role="status"
            className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold text-ink-soft tabular-nums shadow-[3px_3px_0_rgba(36,64,110,0.12)]"
          >
            odkryto {flippedCount}/{SPECIFICS.length}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-cocoa/65">
          kliknij kartę, aby odkryć
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {SPECIFICS.map((s, i) => (
            <RevealCard
              key={s}
              text={s}
              index={i}
              flipped={flipped[i]}
              onFlip={() => flip(i)}
            />
          ))}
        </div>

        {allFlipped && (
          <div
            role="status"
            className="pop-in mt-6 rotate-1 rounded-2xl border-2 border-ink bg-accent px-4 py-3 text-center text-base font-bold text-white shadow-[4px_4px_0_rgba(36,64,110,0.25)]"
          >
            🏆 Komplet! Wszystkie WYRÓŻNIENIA odkryte. Szacuneczek.
          </div>
        )}
      </section>

      {/* ---------- footer ---------- */}
      <footer className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-12 text-center">
        <SquigglyArrow className="float-squiggle mx-auto h-16 w-8 rotate-180 text-ink" />
        <p className="mt-4 text-sm font-medium text-cocoa/65">
          P.S. marek miał 49% baterii i tak wygrał. Legenda. 🔋
        </p>
        <p className="mt-1 text-sm font-medium text-cocoa/65">
          P.P.S. Kajtek dowie się o tych wynikach za ~3 godziny — 0,15 mb/s robi swoje 📡
        </p>
        <p className="mt-3 text-xs text-cocoa/45">
          Dane prosto z ankiety — nic nie zmyślone trust me.
        </p>
      </footer>
    </div>
  );
}