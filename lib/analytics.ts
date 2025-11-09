import { promises as fs } from "fs";
import path from "path";
import { loadAccountPosts, type AccountId, type Post } from "./posts";

type LocaleStrings = {
  en?: string[];
  ua?: string[];
  [locale: string]: string[] | undefined;
};

export type KeywordConfig = {
  propaganda_phrases?: string[];
  peace_narratives?: LocaleStrings;
  anti_russia_markers?: LocaleStrings;
  pro_russia_praise?: LocaleStrings;
  values?: LocaleStrings;
  heroization?: LocaleStrings;
  justification?: LocaleStrings;
  pro_russia_hashtags?: LocaleStrings;
};

const ACCOUNT_KEYWORD_FILES: Partial<Record<AccountId, string>> = {
  shevchuk: "key-words-shevchyk.json",
};

export type MatchedQueryStat = {
  matchedQuery: string;
  count: number;
  percent: number;
  cumulativePercent: number;
};

export type TimelinePoint = {
  date: string;
  total: number;
  clean: number;
  noise: number;
};

export type ThemeStat = {
  theme: string;
  count: number;
  percent: number;
};

export type AuthorStat = {
  author: string;
  count: number;
  percent: number;
};

export type NoiseMarkerStat = {
  marker: string;
  count: number;
};

export type AnalyticsSummary = {
  totals: {
    totalPosts: number;
    totalClean: number;
    totalNoise: number;
    noiseShare: number;
    byPlatform: Record<string, number>;
  };
  matchedQueries: MatchedQueryStat[];
  timeline: TimelinePoint[];
  themes: ThemeStat[];
  topAuthors: AuthorStat[];
  noiseMarkers: NoiseMarkerStat[];
  filters: {
    matchedQueries: string[];
    authors: string[];
  };
};

export type EnrichedPost = Post & {
  theme: string;
  isNoise: boolean;
  noiseMarkers: string[];
};

export type AccountAnalytics = {
  posts: EnrichedPost[];
  summary: AnalyticsSummary;
};

type AggregateContext = {
  keywordConfig: KeywordConfig | null;
};

type Counters = {
  matchedQueryCounts: Map<string, number>;
  platformCounts: Map<string, number>;
  themeCounts: Map<string, number>;
  authorCounts: Map<string, number>;
  timelineBuckets: Map<
    string,
    { total: number; clean: number; noise: number }
  >;
  noiseMarkerCounts: Map<string, number>;
};

function createCounters(): Counters {
  return {
    matchedQueryCounts: new Map(),
    platformCounts: new Map(),
    themeCounts: new Map(),
    authorCounts: new Map(),
    timelineBuckets: new Map(),
    noiseMarkerCounts: new Map(),
  };
}

function updateCounters(
  post: EnrichedPost,
  counters: Counters,
) {
  const {
    matchedQueryCounts,
    platformCounts,
    themeCounts,
    authorCounts,
    timelineBuckets,
    noiseMarkerCounts,
  } = counters;

  const platform = post.platform || "Невідома платформа";
  platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);

  const normalizedMatchedQuery =
    post.matchedQuery?.trim() || "Без запиту (matched_query)";
  matchedQueryCounts.set(
    normalizedMatchedQuery,
    (matchedQueryCounts.get(normalizedMatchedQuery) ?? 0) + 1,
  );

  themeCounts.set(post.theme, (themeCounts.get(post.theme) ?? 0) + 1);

  if (post.author) {
    authorCounts.set(post.author, (authorCounts.get(post.author) ?? 0) + 1);
  }

  if (post.isNoise) {
    post.noiseMarkers.forEach((marker) => {
      noiseMarkerCounts.set(marker, (noiseMarkerCounts.get(marker) ?? 0) + 1);
    });
  }

  if (post.dateISO) {
    const dayKey = post.dateISO.slice(0, 10);
    const existingBucket = timelineBuckets.get(dayKey) ?? {
      total: 0,
      clean: 0,
      noise: 0,
    };

    existingBucket.total += 1;
    if (post.isNoise) {
      existingBucket.noise += 1;
    } else {
      existingBucket.clean += 1;
    }

    timelineBuckets.set(dayKey, existingBucket);
  }
}

function transformPosts(
  posts: Post[],
  context: AggregateContext,
): { enrichedPosts: EnrichedPost[]; counters: Counters } {
  const counters = createCounters();

  const enrichedPosts: EnrichedPost[] = posts.map((post) => {
    const theme = determineTheme(post, context.keywordConfig);
    const noiseMarkers = detectNoiseMarkers(post, context.keywordConfig);
    const isNoise = noiseMarkers.length > 0;

    const enriched: EnrichedPost = {
      ...post,
      theme,
      isNoise,
      noiseMarkers,
    };

    updateCounters(enriched, counters);

    return enriched;
  });

  return { enrichedPosts, counters };
}

async function loadKeywordConfig(
  account: AccountId,
): Promise<KeywordConfig | null> {
  const keywordFile = ACCOUNT_KEYWORD_FILES[account];
  if (!keywordFile) {
    return null;
  }

  const filePath = path.join(process.cwd(), "data", keywordFile);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent) as KeywordConfig;
  } catch (error) {
    console.error(`Не вдалося завантажити keywords файл ${keywordFile}`, error);
    return null;
  }
}

function normalizeValue(value: string | null): string {
  return value ? value.toLowerCase() : "";
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function extractLocalizedKeywords(
  dictionary: LocaleStrings | undefined,
): string[] {
  if (!dictionary) {
    return [];
  }

  return Object.values(dictionary)
    .filter(Array.isArray)
    .flatMap((entries) => entries ?? []);
}

function determineTheme(
  post: Post,
  keywordConfig: KeywordConfig | null,
): string {
  const text = normalizeValue(post.text);
  const matchedQuery = normalizeValue(post.matchedQuery);

  const peaceKeywords = [
    ...(keywordConfig?.propaganda_phrases?.filter((entry) =>
      entry.toLowerCase().includes("peace"),
    ) ?? []),
    ...extractLocalizedKeywords(keywordConfig?.peace_narratives),
    "ceasefire",
    "dialogue",
    "peace",
    "reconciliation",
  ].map((entry) => entry.toLowerCase());

  const humanitarianKeywords = [
    "humanitarian",
    "aid",
    "volunteer",
    "rescue",
    "help",
    "mission",
    "civilians",
    "children",
    "families",
    ...extractLocalizedKeywords(keywordConfig?.pro_russia_praise).filter(
      (entry) => entry.toLowerCase().includes("help"),
    ),
  ].map((entry) => entry.toLowerCase());

  const valuesKeywords = [
    ...extractLocalizedKeywords(keywordConfig?.values),
    "tradition",
    "traditional values",
    "morality",
    "culture",
    "faith",
    "family",
    "spiritual",
  ].map((entry) => entry.toLowerCase());

  const sovereigntyKeywords = [
    "sovereignty",
    "multipolar",
    "security",
    "justice",
    "order",
    "rights",
  ];

  const targetString = `${matchedQuery} ${text}`;

  if (peaceKeywords.some((keyword) => targetString.includes(keyword))) {
    return "Миротворчість";
  }

  if (
    humanitarianKeywords.some((keyword) => targetString.includes(keyword))
  ) {
    return "Гуманітарка";
  }

  if (valuesKeywords.some((keyword) => targetString.includes(keyword))) {
    return "Традиційні цінності";
  }

  if (
    sovereigntyKeywords.some((keyword) =>
      targetString.includes(keyword.toLowerCase()),
    )
  ) {
    return "Суверенітет";
  }

  return "Інше";
}

function detectNoiseMarkers(
  post: Post,
  keywordConfig: KeywordConfig | null,
): string[] {
  if (!keywordConfig) {
    return [];
  }

  const text = normalizeValue(post.text);
  const markers = extractLocalizedKeywords(keywordConfig.anti_russia_markers)
    .map((marker) => marker.toLowerCase())
    .filter(Boolean);

  const matchedMarkers: string[] = [];

  markers.forEach((marker) => {
    if (text.includes(marker)) {
      matchedMarkers.push(marker);
    }
  });

  return matchedMarkers;
}

function buildMatchedQueryStats(
  counts: Map<string, number>,
  totalPosts: number,
): MatchedQueryStat[] {
  const items = Array.from(counts.entries())
    .map(([matchedQuery, count]) => ({
      matchedQuery,
      count,
      percent: totalPosts ? (count / totalPosts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  let cumulative = 0;
  return items.map((item) => {
    cumulative += item.percent;
    return {
      ...item,
      cumulativePercent: Math.min(cumulative, 100),
    };
  });
}

function buildTimeline(
  buckets: Map<string, { total: number; clean: number; noise: number }>,
): TimelinePoint[] {
  return Array.from(buckets.entries())
    .map(([date, values]) => ({
      date,
      ...values,
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function buildThemeStats(
  counts: Map<string, number>,
  total: number,
): ThemeStat[] {
  return Array.from(counts.entries())
    .map(([theme, count]) => ({
      theme,
      count,
      percent: total ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildAuthorStats(
  counts: Map<string, number>,
  total: number,
): AuthorStat[] {
  return Array.from(counts.entries())
    .map(([author, count]) => ({
      author,
      count,
      percent: total ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function loadAccountAnalytics(
  account: AccountId,
): Promise<AccountAnalytics> {
  const [rawPosts, keywordConfig] = await Promise.all([
    loadAccountPosts(account),
    loadKeywordConfig(account),
  ]);

  const { enrichedPosts, counters } = transformPosts(rawPosts, {
    keywordConfig,
  });

  const totalPosts = enrichedPosts.length;
  const totalNoise = enrichedPosts.filter((post) => post.isNoise).length;
  const totalClean = totalPosts - totalNoise;
  const noiseShare = totalPosts ? (totalNoise / totalPosts) * 100 : 0;

  const summary: AnalyticsSummary = {
    totals: {
      totalPosts,
      totalClean,
      totalNoise,
      noiseShare,
      byPlatform: Object.fromEntries(counters.platformCounts),
    },
    matchedQueries: buildMatchedQueryStats(
      counters.matchedQueryCounts,
      totalPosts,
    ),
    timeline: buildTimeline(counters.timelineBuckets),
    themes: buildThemeStats(counters.themeCounts, totalPosts),
    topAuthors: buildAuthorStats(counters.authorCounts, totalPosts),
    noiseMarkers: Array.from(counters.noiseMarkerCounts.entries())
      .map(([marker, count]) => ({ marker, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    filters: {
      matchedQueries: dedupeStrings(
        enrichedPosts
          .map((post) => post.matchedQuery?.trim())
          .filter((value): value is string => Boolean(value)),
      ).sort(),
      authors: dedupeStrings(
        enrichedPosts
          .map((post) => post.author?.trim())
          .filter((value): value is string => Boolean(value)),
      ).sort(),
    },
  };

  return {
    posts: enrichedPosts,
    summary,
  };
}

