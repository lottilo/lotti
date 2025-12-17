export default function ClientHome({ onSalonLoginClick }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Lotti</h1>
            <p className="text-sm text-neutral-500">
              Открий салон и запази час онлайн
            </p>
          </div>

          <button
            onClick={onSalonLoginClick}
            className="text-sm px-4 py-2 rounded-xl border hover:bg-neutral-100 transition"
          >
            Вход за салони
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Търсене</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Следващата стъпка: филтри по град, услуга, цена, свободни часове.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input className="border rounded-xl px-4 py-3" placeholder="Град (пример: Варна)" />
            <input className="border rounded-xl px-4 py-3" placeholder="Услуга (пример: маникюр)" />
            <input className="border rounded-xl px-4 py-3" placeholder="Макс цена (лв)" />
          </div>

          <button className="mt-4 px-4 py-3 rounded-xl bg-black text-white">
            Търси
          </button>
        </div>

        <div className="mt-8 text-sm text-neutral-500">
          След като направим клиентския поток, тук ще показваме “cards” със салони.
        </div>
      </div>
    </div>
  );
}
