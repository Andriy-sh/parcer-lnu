import { promises as fs } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type CsvRecord = Partial<{
  platform: string;
  text: string;
  date: string;
  author: string;
  url: string;
  reactions_count: string;
  comments_count: string;
  reposts_count: string;
  matched_query: string;
}>;

export type AccountId = "shevchuk" | "rozkvas";

export type Post = {
  id: string;
  sourceFile: string;
  platform: string;
  text: string;
  date: string;
  dateISO: string | null;
  timestamp: number | null;
  author: string | null;
  url: string | null;
  reactionsCount: number;
  commentsCount: number;
  repostsCount: number;
  matchedQuery: string | null;
};

type AccountConfig = Record<AccountId, string[]>;

const ACCOUNT_FILES: AccountConfig = {
  shevchuk: ["x_posts.csv", "facebook_posts.csv"],
  rozkvas: [],
};

function toNumber(value: string | undefined): number {
  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

async function loadCsvPosts(fileName: string): Promise<Post[]> {
  const filePath = path.join(process.cwd(), "data", fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    const rawRecords = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    }) as CsvRecord[];

    return rawRecords.map((record, recordIndex) => {
      const rawDate = record.date?.trim() ?? "";
      const parsedDate = rawDate ? new Date(rawDate) : null;
      const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());
      const isoDate = isValidDate ? parsedDate.toISOString() : null;
      const timestamp = isValidDate ? parsedDate.getTime() : null;

      return {
        id: `${fileName}-${recordIndex}`,
        sourceFile: fileName,
        platform: record.platform?.trim() || "Невідома платформа",
        text: record.text?.trim() || "",
        date: rawDate,
        dateISO: isoDate,
        timestamp,
        author: record.author?.trim() ? record.author.trim() : null,
        url: record.url?.trim() ? record.url.trim() : null,
        reactionsCount: toNumber(record.reactions_count),
        commentsCount: toNumber(record.comments_count),
        repostsCount: toNumber(record.reposts_count),
        matchedQuery: record.matched_query?.trim()
          ? record.matched_query.trim()
          : null,
      };
    });
  } catch (error) {
    console.error(`Не вдалося завантажити файл ${fileName}`, error);
    return [];
  }
}

export async function loadAccountPosts(account: AccountId): Promise<Post[]> {
  const fileNames = ACCOUNT_FILES[account] ?? [];
  const datasets = await Promise.all(fileNames.map(loadCsvPosts));
  return datasets.flat();
}

