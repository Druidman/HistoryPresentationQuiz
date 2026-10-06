import type { Metadata } from "next";
import { ResultsBoard } from "@/components/ResultsBoard";

export const metadata: Metadata = {
  title: "Wyniki quizu",
  description:
    "Podsumowanie quizu — tablica wyników, pojedynek Android vs iOS i WYRÓŻNIENIA.",
};

export default function Results() {
  return (
    <main className="min-h-dvh overflow-x-hidden">
      <ResultsBoard />
    </main>
  );
}