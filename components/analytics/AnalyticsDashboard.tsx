'use client';

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AnalyticsSummary,
  EnrichedPost,
  MatchedQueryStat,
  NoiseMarkerStat,
  ThemeStat,
  TimelinePoint,
  AuthorStat,
} from "@/lib/analytics";

type Props = {
  accountName: string;
  posts: EnrichedPost[];
  summary: AnalyticsSummary;
};

type FilterState = {
  matchedQuery: string;
  author: string;
  startDate: string | null;
  endDate: string | null;
  includeNoise: boolean;
  searchTerm: string;
};

type AggregatedData = {
  totals: {
    totalPosts: number;
    totalNoise: number;
    totalClean: number;
    noiseShare: number;
    byPlatform: Record<string, number>;
  };
  matchedQueries: MatchedQueryStat[];
  timeline: TimelinePoint[];
  themes: ThemeStat[];
  topAuthors: AuthorStat[];
  noiseMarkers: NoiseMarkerStat[];
};

const PARETO_COLORS = ["#1ec8ff", "#0ea5e9", "#06b6d4"];
const THEME_COLORS = ["#0ea5e9", "#22d3ee", "#38bdf8", "#6366f1", "#a855f7"];
const AUTHOR_BAR_COLOR = "#22d3ee";
const AREA_COLORS = {
  clean: "#22d3ee",
  noise: "#f97316",
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildAggregates(posts: EnrichedPost[]): AggregatedData {
  const matchedQueryCounts = new Map<string, number>();
  const timelineBuckets = new Map<
    string,
    { total: number; clean: number; noise: number }
  >();
  const themeCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();
  const platformCounts = new Map<string, number>();
  const noiseMarkerCounts = new Map<string, number>();

  posts.forEach((post) => {
    const matchedQuery =
      post.matchedQuery?.trim() || "Без запиту (matched_query)";
    matchedQueryCounts.set(
      matchedQuery,
      (matchedQueryCounts.get(matchedQuery) ?? 0) + 1,
    );

    themeCounts.set(post.theme, (themeCounts.get(post.theme) ?? 0) + 1);

    if (post.author) {
      authorCounts.set(post.author, (authorCounts.get(post.author) ?? 0) + 1);
    }

    const platform = post.platform || "Невідома платформа";
    platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);

    if (post.isNoise) {
      post.noiseMarkers.forEach((marker) => {
        noiseMarkerCounts.set(marker, (noiseMarkerCounts.get(marker) ?? 0) + 1);
      });
    }

    if (post.dateISO) {
      const monthKey = post.dateISO.slice(0, 7);
      const existing = timelineBuckets.get(monthKey) ?? {
        total: 0,
        clean: 0,
        noise: 0,
      };
      existing.total += 1;
      if (post.isNoise) {
        existing.noise += 1;
      } else {
        existing.clean += 1;
      }
      timelineBuckets.set(monthKey, existing);
    }
  });

  const totalPosts = posts.length;
  const totalNoise = posts.filter((post) => post.isNoise).length;
  const totalClean = totalPosts - totalNoise;
  const noiseShare = totalPosts ? (totalNoise / totalPosts) * 100 : 0;

  const matchedQueries = Array.from(matchedQueryCounts.entries())
    .map(([matchedQuery, count]) => ({
      matchedQuery,
      count,
      percent: totalPosts ? (count / totalPosts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  let cumulative = 0;
  const matchedQueriesWithPareto = matchedQueries.map((item) => {
    cumulative += item.percent;
    return {
      matchedQuery: item.matchedQuery,
      count: item.count,
      percent: item.percent,
      cumulativePercent: Math.min(cumulative, 100),
    };
  });

  const timeline = Array.from(timelineBuckets.entries())
    .map(([date, bucket]) => ({
      date,
      ...bucket,
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const themes = Array.from(themeCounts.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percent: totalPosts ? (count / totalPosts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topAuthors = Array.from(authorCounts.entries())
    .map(([author, count]) => ({
      author,
      count,
      percent: totalPosts ? (count / totalPosts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const noiseMarkers = Array.from(noiseMarkerCounts.entries())
    .map(([marker, count]) => ({ marker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totals: {
      totalPosts,
      totalNoise,
      totalClean,
      noiseShare,
      byPlatform: Object.fromEntries(platformCounts),
    },
    matchedQueries: matchedQueriesWithPareto,
    timeline,
    themes,
    topAuthors,
    noiseMarkers,
  };
}

function downloadCsv(posts: EnrichedPost[], accountName: string) {
  if (!posts.length) {
    return;
  }

  const headers = [
    "platform",
    "author",
    "date",
    "matched_query",
    "theme",
    "is_noise",
    "noise_markers",
    "reactions_count",
    "comments_count",
    "reposts_count",
    "text",
    "url",
  ];

  const csvRows = posts.map((post) =>
    [
      post.platform,
      post.author ?? "",
      post.dateISO ?? post.date ?? "",
      post.matchedQuery ?? "",
      post.theme,
      post.isNoise ? "1" : "0",
      post.noiseMarkers.join("|"),
      post.reactionsCount,
      post.commentsCount,
      post.repostsCount,
      JSON.stringify(post.text),
      post.url ?? "",
    ].join(","),
  );

  const now = new Date();
  const fileName = `analytics-${accountName.toLowerCase().replace(/\s+/g, "-")}-${now.toISOString().slice(0, 10)}.csv`;

  const blob = new Blob([`${headers.join(",")}\n${csvRows.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatNumber(value: number): string {
  return value.toLocaleString("uk-UA");
}

function determineInitialDateRange(posts: EnrichedPost[]): {
  startDate: string | null;
  endDate: string | null;
} {
  const timestamps = posts
    .map((post) => post.dateISO)
    .filter((date): date is string => Boolean(date))
    .sort();

  if (!timestamps.length) {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: timestamps[0]?.slice(0, 10) ?? null,
    endDate: timestamps[timestamps.length - 1]?.slice(0, 10) ?? null,
  };
}

export default function AnalyticsDashboard({
  accountName,
  posts,
  summary,
}: Props) {
  const { startDate: initialStart, endDate: initialEnd } =
    useMemo(() => determineInitialDateRange(posts), [posts]);

  const [filters, setFilters] = useState<FilterState>({
    matchedQuery: "all",
    author: "all",
    startDate: initialStart,
    endDate: initialEnd,
    includeNoise: false,
    searchTerm: "",
  });

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (!filters.includeNoise && post.isNoise) {
        return false;
      }

      if (filters.matchedQuery !== "all") {
        if ((post.matchedQuery ?? "") !== filters.matchedQuery) {
          return false;
        }
      }

      if (filters.author !== "all") {
        if ((post.author ?? "") !== filters.author) {
          return false;
        }
      }

      if (filters.startDate && post.dateISO) {
        if (post.dateISO < `${filters.startDate}T00:00:00`) {
          return false;
        }
      }

      if (filters.endDate && post.dateISO) {
        if (post.dateISO > `${filters.endDate}T23:59:59`) {
          return false;
        }
      }

      if (filters.searchTerm.trim()) {
        const query = filters.searchTerm.toLowerCase();
        const target = [
          post.text,
          post.author ?? "",
          post.matchedQuery ?? "",
          post.theme,
        ]
          .join(" ")
          .toLowerCase();
        if (!target.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [posts, filters]);

  const aggregates = useMemo(
    () => buildAggregates(filteredPosts),
    [filteredPosts],
  );

  const matchedQueryOptions = useMemo(() => {
    const options = summary.filters.matchedQueries.map((value) => ({
      value,
      label: value,
    }));
    return [{ value: "all", label: "Усі matched_query" }, ...options];
  }, [summary.filters.matchedQueries]);

  const authorOptions = useMemo(() => {
    const options = summary.filters.authors.map((value) => ({
      value,
      label: value,
    }));
    return [{ value: "all", label: "Усі автори" }, ...options];
  }, [summary.filters.authors]);

  const latestPosts = useMemo(
    () =>
      [...filteredPosts]
        .sort((a, b) => {
          if (!a.dateISO || !b.dateISO) {
            return 0;
          }
          return b.dateISO.localeCompare(a.dateISO);
        })
        .slice(0, 6),
    [filteredPosts],
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Усього постів
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatNumber(aggregates.totals.totalPosts)}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Чисті (без шуму)
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatNumber(aggregates.totals.totalClean)}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Шумові пости
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatNumber(aggregates.totals.totalNoise)}
          </p>
          <p className="text-xs text-slate-400">
            {formatPercent(aggregates.totals.noiseShare)}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Публікації за платформами
          </p>
          <dl className="mt-3 space-y-1 text-sm text-slate-300">
            {Object.entries(aggregates.totals.byPlatform).map(
              ([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <dt>{platform}</dt>
                  <dd>{formatNumber(count)}</dd>
                </div>
              ),
            )}
          </dl>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Фільтри та інструменти
            </h2>
            <p className="text-sm text-slate-400">
              Налаштуй matched_query, авторів, діапазон дат або швидкий пошук.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(filteredPosts, accountName)}
            className="inline-flex items-center justify-center rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            Експорт CSV
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              matched_query
            </span>
            <select
              value={filters.matchedQuery}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  matchedQuery: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              {matchedQueryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Автор
            </span>
            <select
              value={filters.author}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  author: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              {authorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Дата від
            </span>
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: event.target.value || null,
                }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Дата до
            </span>
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: event.target.value || null,
                }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </label>
          <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Пошук по тексту
            </span>
            <input
              type="search"
              placeholder="введіть слово або фразу…"
              value={filters.searchTerm}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  searchTerm: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={filters.includeNoise}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  includeNoise: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-500/50"
            />
            Показувати шумові пости
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Pareto matched_query
          </h3>
          <p className="text-sm text-slate-400">
            ТОП рушіїв пропаганди та їхній внесок у загальний масив.
          </p>
        </header>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={aggregates.matchedQueries.slice(0, 12)}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="matchedQuery" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                label={{ value: "Кількість", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                label={{ value: "% накопичення", angle: 90, position: "insideRight", fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
                formatter={(value: number, name: string) =>
                  name === "cumulativePercent" || name === "percent"
                    ? [formatPercent(value), name]
                    : [value, name]
                }
              />
              <Legend wrapperStyle={{ color: "#e2e8f0" }} />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="Кількість постів"
                fill={PARETO_COLORS[0]}
                radius={[10, 10, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercent"
                name="Кумулятивний %"
                stroke={PARETO_COLORS[2]}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Тематичне охоплення
          </h3>
          <p className="text-sm text-slate-400">
            Співвідношення ключових напрямів.
          </p>
        </header>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row">
          <div className="h-72 lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregates.themes}
                  dataKey="count"
                  nameKey="theme"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {aggregates.themes.map((entry, index) => (
                    <Cell
                      key={entry.theme}
                      fill={THEME_COLORS[index % THEME_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value: number, name: string) => [
                    value,
                    `${name} (${formatPercent(
                      (value as number / Math.max(aggregates.totals.totalPosts, 1)) * 100,
                    )})`,
                  ]}
                />
                <Legend wrapperStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {aggregates.themes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
                Даних для тематичного розподілу наразі немає.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-200">
                {aggregates.themes.map((entry, index) => (
                  <li
                    key={entry.theme}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            THEME_COLORS[index % THEME_COLORS.length],
                        }}
                      />
                      {entry.theme}
                    </span>
                    <span className="font-semibold text-cyan-200">
                      {formatPercent(entry.percent)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-white">
              Динаміка публікацій
            </h3>
            <p className="text-sm text-slate-400">
              Як змінюється кількість чистих та шумових постів.
            </p>
          </header>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregates.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                <Area
                  type="monotone"
                  dataKey="clean"
                  name="Чисті"
                  stroke={AREA_COLORS.clean}
                  fill={AREA_COLORS.clean}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="noise"
                  name="Шум"
                  stroke={AREA_COLORS.noise}
                  fill={AREA_COLORS.noise}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-white">
              Топ авторів
            </h3>
            <p className="text-sm text-slate-400">
              Хто генерує найбільше контенту.
            </p>
          </header>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregates.topAuthors}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="author"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="count" fill={AUTHOR_BAR_COLOR} radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">
            Розподіл matched_query
          </h3>
          <p className="text-sm text-slate-400">
            Основні запити, що тригерять потрапляння постів.
          </p>
          <div className="mt-4 max-h-80 overflow-y-auto">
            <table className="w-full table-fixed text-left text-sm text-slate-300">
              <thead className="sticky top-0 bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-2/3 px-3 py-2">matched_query</th>
                  <th className="w-1/6 px-3 py-2 text-right">К-ть</th>
                  <th className="w-1/6 px-3 py-2 text-right">% від загалу</th>
                </tr>
              </thead>
              <tbody>
                {aggregates.matchedQueries.map((entry) => (
                  <tr key={entry.matchedQuery} className="border-b border-slate-800/80">
                    <td className="px-3 py-2">
                      <span className="line-clamp-2">{entry.matchedQuery}</span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatNumber(entry.count)}</td>
                    <td className="px-3 py-2 text-right">
                      {formatPercent(entry.percent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">
            Негативні маркери (шум)
          </h3>
          <p className="text-sm text-slate-400">
            Які ключі виключають пости зі звіту.
          </p>
          <div className="mt-4 max-h-80 overflow-y-auto">
            <table className="w-full table-fixed text-left text-sm text-slate-300">
              <thead className="sticky top-0 bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-3/4 px-3 py-2">Ключ</th>
                  <th className="w-1/4 px-3 py-2 text-right">К-ть</th>
                </tr>
              </thead>
              <tbody>
                {aggregates.noiseMarkers.length > 0 ? (
                  aggregates.noiseMarkers.map((entry) => (
                    <tr key={entry.marker} className="border-b border-slate-800/80">
                      <td className="px-3 py-2">
                        <span className="line-clamp-2">{entry.marker}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(entry.count)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={2}>
                      Шумові маркери не знайдені.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Останні пости (фільтр застосовано)
          </h3>
          <p className="text-sm text-slate-400">
            Огляд останніх 6 публікацій за вибраними умовами.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {latestPosts.map((post) => (
            <article
              key={`${post.id}-latest`}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-800/70 px-2 py-1 uppercase tracking-wide">
                  {post.platform}
                </span>
                <time dateTime={post.dateISO ?? undefined}>
                  {post.dateISO?.slice(0, 10) ?? post.date}
                </time>
              </div>
              <h4 className="mt-3 text-sm font-medium text-cyan-200">
                {post.matchedQuery ?? "Без matched_query"}
              </h4>
              <p className="mt-2 line-clamp-4 text-sm text-slate-200">
                {post.text}
              </p>
              <dl className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {post.author && (
                  <div className="rounded-full bg-slate-800/60 px-2 py-1">
                    Автор: {post.author}
                  </div>
                )}
                <div className="rounded-full bg-slate-800/60 px-2 py-1">
                  Тема: {post.theme}
                </div>
                {post.isNoise && (
                  <div className="rounded-full bg-rose-500/20 px-2 py-1 text-rose-200">
                    Шум
                  </div>
                )}
              </dl>
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Відкрити оригінал →
                </a>
              )}
            </article>
          ))}
          {latestPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
              За обраними умовами пости відсутні.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

