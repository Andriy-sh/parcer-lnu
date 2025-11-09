'use client';

import { useMemo, useState } from "react";
import type { Post } from "@/lib/posts";

type PostExplorerProps = {
  posts: Post[];
};

type SelectOption = {
  label: string;
  value: string;
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getPlatformOptions(posts: Post[]): SelectOption[] {
  const uniquePlatforms = new Set(
    posts.map((post) => post.platform.trim()).filter(Boolean),
  );

  return ["all", ...Array.from(uniquePlatforms).sort()].map((platform) => ({
    label: platform === "all" ? "Усі платформи" : platform,
    value: platform,
  }));
}

function getYearOptions(posts: Post[]): SelectOption[] {
  const yearSet = posts.reduce<Set<string>>((accumulator, post) => {
    if (typeof post.timestamp === "number") {
      const year = new Date(post.timestamp).getFullYear();
      if (!Number.isNaN(year)) {
        accumulator.add(String(year));
      }
    }

    return accumulator;
  }, new Set());

  const sortedYears = Array.from(yearSet).sort((yearA, yearB) =>
    Number(yearB) - Number(yearA),
  );

  return ["all", ...sortedYears].map((yearValue) => ({
    label: yearValue === "all" ? "Усі роки" : yearValue,
    value: yearValue,
  }));
}

function formatDateLabel(post: Post): string {
  if (post.dateISO) {
    return dateFormatter.format(new Date(post.dateISO));
  }

  if (post.date.trim()) {
    return post.date.trim();
  }

  return "Дата невідома";
}

export default function PostExplorer({ posts }: PostExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [minimumReactions, setMinimumReactions] = useState(0);

  const platformOptions = useMemo(
    () => getPlatformOptions(posts),
    [posts],
  );

  const yearOptions = useMemo(() => getYearOptions(posts), [posts]);

  const preparedPosts = useMemo(() => {
    return [...posts].sort(
      (firstPost, secondPost) =>
        (secondPost.timestamp ?? 0) - (firstPost.timestamp ?? 0),
    );
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return preparedPosts.filter((post) => {
      if (selectedPlatform !== "all") {
        if (post.platform.trim().toLowerCase() !== selectedPlatform.toLowerCase()) {
          return false;
        }
      }

      if (selectedYear !== "all") {
        if (typeof post.timestamp !== "number") {
          return false;
        }

        const postYear = new Date(post.timestamp).getFullYear();
        if (Number.isNaN(postYear) || String(postYear) !== selectedYear) {
          return false;
        }
      }

      if (
        minimumReactions > 0 &&
        post.reactionsCount < minimumReactions
      ) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const normalizedQuery = searchTerm.toLowerCase();
      const candidateText = [
        post.text,
        post.author ?? "",
        post.url ?? "",
        post.matchedQuery ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return candidateText.includes(normalizedQuery);
    });
  }, [preparedPosts, selectedPlatform, selectedYear, minimumReactions, searchTerm]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Пошук
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Пошук за текстом, автором або посиланням..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </label>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Платформа
              </span>
              <select
                value={selectedPlatform}
                onChange={(event) => setSelectedPlatform(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Рік
              </span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Мін. реакцій
              </span>
              <input
                type="number"
                min={0}
                value={minimumReactions}
                onChange={(event) =>
                  setMinimumReactions(
                    Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                  )
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Знайдено {filteredPosts.length} постів
        {minimumReactions > 0 && (
          <span className="text-slate-500">
            {" "}
            (мінімум {minimumReactions} реакцій)
          </span>
        )}
      </p>

      <div className="flex flex-col gap-6">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition hover:border-cyan-400/60 hover:shadow-cyan-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                {post.platform || "Невідомо"}
              </span>
              <time
                className="text-sm text-slate-400"
                dateTime={post.dateISO ?? undefined}
              >
                {formatDateLabel(post)}
              </time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-100">
              {post.text}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="rounded-full bg-slate-800/70 px-3 py-1 text-slate-400">
                Джерело: {post.sourceFile}
              </span>
              {post.author && (
                <span className="rounded-full bg-slate-800/70 px-3 py-1">
                  Автор: {post.author}
                </span>
              )}
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-cyan-500/40 px-3 py-1 text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
                >
                  Відкрити пост
                </a>
              )}
            </div>
            {post.matchedQuery && (
              <p className="mt-4 text-sm italic text-slate-400">
                Запит збігу: {post.matchedQuery}
              </p>
            )}
            <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-800/60 p-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Реакції
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {post.reactionsCount.toLocaleString("uk-UA")}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Коментарі
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {post.commentsCount.toLocaleString("uk-UA")}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400">
                  Репости
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {post.repostsCount.toLocaleString("uk-UA")}
                </dd>
              </div>
            </dl>
          </article>
        ))}

        {filteredPosts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            Нічого не знайдено. Спробуйте змінити умови пошуку або фільтри.
          </div>
        )}
      </div>
    </section>
  );
}

