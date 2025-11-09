import Link from "next/link";

const ACCOUNTS = [
  {
    id: "shevchuk",
    name: "Шевчук Богданна",
    description:
      "Зібрані публікації з X та Facebook. Є пошук, фільтри та деталізація метрик.",
    href: "/shevchuk",
  },
  {
    id: "rozkvas",
    name: "Розквас Квенія",
    description:
      "Публікації будуть додані пізніше. Поки що можна переглянути інші акаунти.",
    href: "/rozkvas",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 py-20 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <header className="space-y-5 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Обери акаунт
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Аналітика соціальних мереж
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg">
            Обери профіль, щоб перейти до персоналізованої стрічки постів і
            скористатися зручним пошуком, фільтрами та статистикою.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {ACCOUNTS.map((account) => (
            <Link
              key={account.id}
              href={account.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-8 transition hover:border-cyan-400/60 hover:shadow-cyan-500/10"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 transition group-hover:opacity-100" />
              <div className="flex h-full flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {account.name}
                  </h2>
                  <p className="mt-3 text-sm text-slate-300">
                    {account.description}
                  </p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition group-hover:text-cyan-200">
                  Перейти до стрічки
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
