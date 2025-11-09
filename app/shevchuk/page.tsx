import Link from "next/link";
import PostExplorer from "@/components/PostExplorer";
import { loadAccountPosts } from "@/lib/posts";

export const metadata = {
  title: "Шевчук Богданна — Стрічка постів",
};

export default async function ShevchukPage() {
  const posts = await loadAccountPosts("shevchuk");

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
                Шевчук Богданна
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
            Переглядай усі знайдені публікації з X та Facebook. Використовуй
            пошук і фільтри, щоб швидко знайти потрібні згадки.
          </p>
        </header>
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/shevchuk/analytics"
            className="group rounded-3xl border border-cyan-500/40 bg-slate-900/60 p-6 transition hover:border-cyan-400/70 hover:shadow-cyan-500/10"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              Аналітика
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Перейти до дашборду
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Зведені показники, графіки, аналіз matched_query та шумових
              маркерів.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
              Відкрити аналітику →
            </span>
          </Link>
          <Link
            href="/shevchuk/keywords"
            className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-cyan-400/60 hover:shadow-cyan-500/10"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Ключові слова
            </p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              Переглянути словник
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Повний список пошукових фраз, категорій та негативних маркерів із
              поясненнями.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
              Відкрити словник →
            </span>
          </Link>
        </section>
        <PostExplorer posts={posts} />
      </div>
    </div>
  );
}

