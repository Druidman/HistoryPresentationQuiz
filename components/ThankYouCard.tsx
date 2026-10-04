"use client";

import { OrangeDot, SquigglyArrow, Wavy } from "@/components/decor";

/** Stage 3: thank-you screen. No way back into the quiz. */
export function ThankYouCard() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 text-center">
      <SquigglyArrow className="float-squiggle absolute top-10 hidden h-20 w-10 text-ink sm:block" />

      <div className="relative">
        <OrangeDot className="absolute -left-16 -top-6 h-10 w-10 max-sm:hidden" />
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          <Wavy>Szacuneczek</Wavy> <Wavy>za</Wavy> <Wavy>odpowiedzi</Wavy>!
        </h1>
      </div>

      <div className="mt-8 rounded-3xl border-2 border-ink/15 bg-card px-6 py-8 shadow-[6px_6px_0_rgba(36,64,110,0.12)] sm:px-10">
        <p className="text-xl font-semibold leading-relaxed text-cocoa sm:text-2xl">
          Twoje odpowiedzi zostały zapisane.
        </p>
        <p className="mt-3 text-base text-cocoa/75 sm:text-lg">
          Możesz już spokojnie zamknąć tę stronę.
        </p>
      </div>

      <p className="mt-8 text-sm text-cocoa/55">💀💀Jutro sprawdzian z matmy...💀💀</p>
    </section>
  );
}
