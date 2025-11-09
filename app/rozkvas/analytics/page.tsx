import Link from "next/link";
import { loadAccountAnalytics } from "@/lib/analytics";

export const metadata = {
  title: "Аналітика — Розквас Квенія",
};

export default async function RozkvasAnalyticsPage() {
  const analytics = await loadAccountAnalytics("rozkvas");
  const hasPosts = analytics.posts.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Аналітика даних
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Розквас Квенія
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
              Аналітика стане доступною, коли з’являться дані. Поки що ти можеш
              повернутися до вибору акаунтів або додати CSV.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/rozkvas"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              ← До стрічки
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              До вибору акаунтів
            </Link>
          </div>
        </header>

        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
          {hasPosts ? (
            <p>
              Дані знайдено, але аналітика для цього акаунта ще не налаштована.
              Повернись пізніше.
            </p>
          ) : (
            <p>
              Наразі немає постів для побудови аналітики. Додай дані або вибери
              інший акаунт.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

