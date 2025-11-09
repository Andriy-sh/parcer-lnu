import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";

type LocaleStrings = Record<string, string[]>;

type KeywordFile = {
  x_search: {
    date_filter: string;
    propaganda_phrases: string[];
    include_enemy_narratives: boolean;
    include_justification: boolean;
  };
  facebook_pages: string[];
  telegram_channels: string[];
  heroization: LocaleStrings;
  justification: LocaleStrings;
  values: LocaleStrings;
  enemy_narratives: LocaleStrings;
  peace_narratives: LocaleStrings;
  pro_russia_praise: LocaleStrings;
  pro_russia_hashtags: LocaleStrings;
  propaganda_outlets: LocaleStrings;
  facebook_search: {
    enable_search: boolean;
    num_payloads: number;
    scroll_iterations: number;
    scroll_delay: number;
    search_phrases: string[];
  };
  propaganda_accounts: {
    twitter: string[];
  };
  related_topics: LocaleStrings;
  anti_russia_markers: LocaleStrings;
};

const SECTION_HELPERS = {
  heroization: "Маркери героїзації — слова й фрази, що підкреслюють героїчний образ армії або лідерів.",
  justification: "Тези виправдання — аргументи, якими проросійські джерела обґрунтовують агресію.",
  values: "Цінності — згадки про «традиційні» моральні орієнтири.",
  enemy_narratives: "Наративи супротивника — фрази, які можна відстежувати при увімкненні відповідного прапорця.",
  peace_narratives: "Миротворчі меседжі — усе, що апелює до перемир’я та перемовин.",
  pro_russia_praise: "Похвала Росії — слова підтримки та прославляння.",
  pro_russia_hashtags: "Хештеги з проросійським підтекстом.",
  propaganda_outlets: "Пропагандистські медіа — джерела, які часто поширюють проросійський контент.",
  related_topics: "Дотичні теми — ширші сюжети, в які вбудовується проросійська риторика.",
  anti_russia_markers: "Негативні маркери («шум») — фрази, за якими контент відсікається як проукраїнський чи критичний.",
};

async function loadKeywordFile(): Promise<KeywordFile> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "key-words-shevchyk.json",
  );
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent) as KeywordFile;
}

function renderList(items: string[]) {
  return (
    <ul className="space-y-2 text-sm text-slate-200">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function renderLocaleGroup(group: LocaleStrings, helperKey: keyof typeof SECTION_HELPERS) {
  const entries = Object.entries(group);
  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        Значення для цього розділу відсутні.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        {SECTION_HELPERS[helperKey]}
      </p>
      {entries.map(([locale, values]) => (
        <div key={locale} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Мова: {locale.toUpperCase()}
          </h3>
          {renderList(values)}
        </div>
      ))}
    </div>
  );
}

export const metadata = {
  title: "Шевчук Богданна — Ключові слова",
};

export default async function ShevchukKeywordsPage() {
  const keywords = await loadKeywordFile();

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Ключові слова
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Словник запитів — Шевчук Богданна
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
              Повний набір пошукових фраз, негативних маркерів та довідкових
              списків, що використовуються під час збору й очищення даних.
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
              href="/shevchuk/analytics"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              До аналітики
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Вибір акаунтів
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-white">Завантаження даних</h2>
            <p className="text-sm text-slate-400">
              Завантаж словник пошукових слів. CSV з постами доступні на сторінці аналітики.
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/api/exports/shevchuk/keywords"
              className="inline-flex items-center justify-center rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
              prefetch={false}
            >
              Завантажити словник (JSON)
            </Link>
            <Link
              href="/shevchuk/analytics"
              className="inline-flex items-center justify-center rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Перейти до CSV
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <header>
            <h2 className="text-lg font-semibold text-white">X / Twitter пошук</h2>
            <p className="text-sm text-slate-400">
              Параметри автоматичного пошуку: дата-фільтр та ключові фрази для
              збору контенту.
            </p>
          </header>
          <dl className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                date_filter
              </dt>
              <dd className="mt-1 font-medium">{keywords.x_search.date_filter}</dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                include_enemy_narratives
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.x_search.include_enemy_narratives ? "Так" : "Ні"}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                include_justification
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.x_search.include_justification ? "Так" : "Ні"}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Пропагандистські фрази
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Розширені запити, що визначають ключові меседжі для збору даних.
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto pr-1">
              {renderList(keywords.x_search.propaganda_phrases)}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Facebook сторінки</h2>
              <p className="text-sm text-slate-400">
                Офіційні акаунти та групи, з яких збирається контент.
              </p>
            </header>
            <div className="max-h-64 overflow-y-auto pr-1">{renderList(keywords.facebook_pages)}</div>
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Telegram канали</h2>
              <p className="text-sm text-slate-400">
                Публічні канали, що відстежуються додатково.
              </p>
            </header>
            {keywords.telegram_channels.length ? (
              renderList(keywords.telegram_channels)
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
                Канали для цього акаунта не зазначені.
              </p>
            )}
          </article>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <header>
            <h2 className="text-lg font-semibold text-white">Facebook пошук</h2>
            <p className="text-sm text-slate-400">
              Параметри скролу та список фраз для пошуку у Facebook.
            </p>
          </header>
          <dl className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                enable_search
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.facebook_search.enable_search ? "Так" : "Ні"}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                num_payloads
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.facebook_search.num_payloads.toLocaleString("uk-UA")}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                scroll_iterations
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.facebook_search.scroll_iterations}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                scroll_delay (сек)
              </dt>
              <dd className="mt-1 font-medium">
                {keywords.facebook_search.scroll_delay}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Пошукові фрази
            </h3>
            <div className="mt-3 max-h-64 overflow-y-auto pr-1">
              {renderList(keywords.facebook_search.search_phrases)}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <header>
            <h2 className="text-lg font-semibold text-white">
              Пропагандистські акаунти
            </h2>
            <p className="text-sm text-slate-400">
              Відомі акаунти, які регулярно поширюють проросійську риторику.
            </p>
          </header>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              X / Twitter
            </h3>
            <div className="max-h-64 overflow-y-auto pr-1">
              {renderList(keywords.propaganda_accounts.twitter)}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">
                Пропагандистські медіа
              </h2>
              <p className="text-sm text-slate-400">
                Ресурси, що часто транслюють проросійські меседжі.
              </p>
            </header>
            {renderLocaleGroup(keywords.propaganda_outlets, "propaganda_outlets")}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Героїзація</h2>
            </header>
            {renderLocaleGroup(keywords.heroization, "heroization")}
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Виправдання агресії</h2>
            </header>
            {renderLocaleGroup(keywords.justification, "justification")}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Традиційні цінності</h2>
            </header>
            {renderLocaleGroup(keywords.values, "values")}
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Миротворчі меседжі</h2>
            </header>
            {renderLocaleGroup(keywords.peace_narratives, "peace_narratives")}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Похвала Росії</h2>
            </header>
            {renderLocaleGroup(keywords.pro_russia_praise, "pro_russia_praise")}
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Проросійські хештеги</h2>
            </header>
            {renderLocaleGroup(
              keywords.pro_russia_hashtags,
              "pro_russia_hashtags",
            )}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Наративи супротивника</h2>
            </header>
            {renderLocaleGroup(keywords.enemy_narratives, "enemy_narratives")}
          </article>
          <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-white">Дотичні теми</h2>
            </header>
            {renderLocaleGroup(keywords.related_topics, "related_topics")}
          </article>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <header>
            <h2 className="text-lg font-semibold text-white">Негативні маркери («шум»)</h2>
            <p className="text-sm text-slate-400">
              Слова та фрази, що сигналізують про критичний контент та
              відсікаються під час фільтрації.
            </p>
          </header>
          {renderLocaleGroup(keywords.anti_russia_markers, "anti_russia_markers")}
        </section>
      </div>
    </div>
  );
}

