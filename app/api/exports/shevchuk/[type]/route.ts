import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const EXPORT_TYPES = [
  "keywords",
  "x",
  "facebook",
  "combined",
  "telegram",
] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

function isExportType(value: string): value is ExportType {
  return EXPORT_TYPES.includes(value as ExportType);
}

async function streamFile(
  filePath: string,
  fileName: string,
  contentType: string,
) {
  const fileHandle = await fs.open(filePath, "r");
  const stream = fileHandle.createReadStream();

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { type: string } },
) {
  const { type } = params;

  if (!isExportType(type)) {
    return NextResponse.json(
      { error: "Непідтримуваний тип експорту" },
      { status: 400 },
    );
  }

  const dataDir = path.join(process.cwd(), "data");

  if (type === "telegram") {
    return NextResponse.json(
      { error: "Експорт Telegram недоступний наразі" },
      { status: 501 },
    );
  }

  if (type === "keywords") {
    const keywordsPath = path.join(dataDir, "key-words-shevchyk.json");
    try {
      await fs.access(keywordsPath);
      return streamFile(
        keywordsPath,
        "key-words-shevchyk.json",
        "application/json",
      );
  } catch {
      return NextResponse.json(
        { error: "Файл keywords не знайдено" },
        { status: 404 },
      );
    }
  }

  if (type === "x" || type === "combined") {
    const xPath = path.join(dataDir, "x_posts.csv");
    try {
      await fs.access(xPath);
      if (type === "x") {
        return streamFile(
          xPath,
          "x_posts.csv",
          "text/csv; charset=utf-8",
        );
      }
  } catch {
      if (type === "x") {
        return NextResponse.json(
          { error: "CSV X не знайдено" },
          { status: 404 },
        );
      }
    }
  }

  if (type === "facebook" || type === "combined") {
    const fbPath = path.join(dataDir, "facebook_posts.csv");
    try {
      await fs.access(fbPath);
      if (type === "facebook") {
        return streamFile(
          fbPath,
          "facebook_posts.csv",
          "text/csv; charset=utf-8",
        );
      }
  } catch {
      if (type === "facebook") {
        return NextResponse.json(
          { error: "CSV Facebook не знайдено" },
          { status: 404 },
        );
      }
    }
  }

  if (type === "combined") {
    const xPath = path.join(dataDir, "x_posts.csv");
    const fbPath = path.join(dataDir, "facebook_posts.csv");

    try {
      const [xContent, fbContent] = await Promise.all([
        fs.readFile(xPath, "utf-8"),
        fs.readFile(fbPath, "utf-8"),
      ]);

      const combined = `${xContent.trim()}\n${fbContent.trim()}`;
      return new NextResponse(combined, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="combined_posts.csv"',
        },
      });
  } catch {
      return NextResponse.json(
        { error: "Не вдалося зчитати CSV файли" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Ресурс недоступний" },
    { status: 404 },
  );
}

