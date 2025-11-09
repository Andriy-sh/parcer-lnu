import Link from "next/link";
import { loadAccountPosts } from "@/lib/posts";

export const metadata = {
  title: "Розквас Квенія — Стрічка постів",
};

export default async function RozkvasPage() {
  const posts = await loadAccountPosts("rozkvas");
  const hasPosts = posts.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">
                Обраний акаунт
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Розквас Квенія
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              ← До вибору акаунтів
            </Link>
          </div>
          <p className="text-sm text-slate-300 sm:text-base">
            Тут з’являться публікації щойно вони будуть додані. Поки що стрічка
            пуста, але ти все одно можеш повернутися до вибору акаунтів.
          </p>
        </header>
        <section className="grid gap-4">
          <Link
            href="/rozkvas/analytics"
            className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-cyan-400/60 hover:shadow-cyan-500/10"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Аналітика
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Перейти до аналітичної сторінки
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Коли з’являться дані, саме тут можна буде переглянути графіки та
              підсумки.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
              Відкрити аналітику →
            </span>
          </Link>
        </section>

        {hasPosts ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Пости знайдено, але компонент стрічки ще не налаштований. Спробуй
            пізніше.
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
            Наразі немає постів для цього акаунта. Повернись пізніше або обери
            іншу стрічку.
          </div>
        )}
      </div>
    </div>
  );
}

