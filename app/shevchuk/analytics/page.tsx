import Link from "next/link";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { loadAccountAnalytics } from "@/lib/analytics";

export const metadata = {
  title: "Аналітика — Шевчук Богданна",
};

export default async function ShevchukAnalyticsPage() {
  const analytics = await loadAccountAnalytics("shevchuk");

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Аналітика даних
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Шевчук Богданна
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
              Зведені показники та візуалізації по зібраних постах з X та
              Facebook. Використовуй фільтри, щоб дослідити matched_query,
              відстежити динаміку чи завантажити CSV.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shevchuk"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              ← До стрічки
            </Link>
            <Link
              href="/shevchuk/keywords"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Словник ключових слів
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              До вибору акаунтів
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Завантаження даних про пости
            </h2>
            <p className="text-sm text-slate-400">
              Вигрузи CSV зі зібраними постами з X, Facebook або об’єднаний файл.
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/api/exports/shevchuk/x"
              className="inline-flex items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              prefetch={false}
            >
              CSV X
            </Link>
            <Link
              href="/api/exports/shevchuk/facebook"
              className="inline-flex items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              prefetch={false}
            >
              CSV Facebook
            </Link>
            <Link
              href="/api/exports/shevchuk/combined"
              className="inline-flex items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover-border-cyan-400 hover-text-cyan-200"
              prefetch={false}
            >
              CSV (об’єднаний)
            </Link>
            <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-600">
              CSV Telegram (недоступно)
            </span>
          </div>
        </section>

        <AnalyticsDashboard
          accountName="Шевчук Богданна"
          posts={analytics.posts}
          summary={analytics.summary}
        />
      </div>
    </div>
  );
}

