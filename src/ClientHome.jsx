import { useEffect, useMemo, useState } from "react";

const API = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

export default function ClientHome({ onSalonLoginClick }) {
  const [q, setQ] = useState("");
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [selected, setSelected] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingProviders(true);
      setError("");
      try {
        const res = await fetch(`${API}/providers`);
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      } catch {
        setError("Не успях да заредя салоните.");
      } finally {
        setLoadingProviders(false);
      }
    })();
  }, []);

  async function openProvider(p) {
    setSelected(p);
    setServices([]);
    setLoadingServices(true);
    setError("");
    try {
      const res = await fetch(`${API}/providers/${p.id}/services`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setError("Не успях да заредя услугите.");
    } finally {
      setLoadingServices(false);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return providers;
    return providers.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [providers, q]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
              <span className="text-lg font-bold">L</span>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">LOTTI</div>
              <div className="text-xs text-white/70">Салони • Услуги • Резервации</div>
            </div>
          </div>

          <button
            onClick={onSalonLoginClick}
            className="text-sm px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition"
          >
            Вход за салони
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
                Открий салон и запази час <span className="text-white/70">за минута</span>
              </h1>
              <p className="mt-3 text-white/70 max-w-prose">
                Търси по име на салон, разгледай услуги и резервирай онлайн. Бързо, удобно и красиво — на телефон и компютър.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-white/60 mb-1">Търсене</label>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Пример: Салон Красота…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-2xl px-5 py-3 bg-white text-black font-medium hover:bg-white/90 transition"
                  onClick={() => {
                    const el = document.getElementById("catalog");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Разгледай салони
                </button>
              </div>

              {error && <div className="mt-4 text-sm text-red-300">{error}</div>}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6">
              <div className="text-sm text-white/70">Как работи</div>
              <div className="mt-4 grid gap-3">
                {[
                  ["1", "Избираш салон", "Разглеждаш наличните салони в каталога."],
                  ["2", "Виждаш услуги", "Цени и време за изпълнение на услугата."],
                  ["3", "Резервираш", "Избираш час и оставяш име и телефон."],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 grid place-items-center font-semibold">
                        {n}
                      </div>
                      <div>
                        <div className="font-semibold">{t}</div>
                        <div className="text-sm text-white/70 mt-1">{d}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/60">
                (Mobile-first дизайн — изглежда добре и на телефон.)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Каталог салони</h2>
              <p className="text-sm text-white/70 mt-1">
                Натисни салон, за да видиш услугите му.
              </p>
            </div>

            <div className="text-xs text-white/60">
              {loadingProviders ? "Зареждане…" : `${filtered.length} резултата`}
            </div>
          </div>

          <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProviders && (
              <>
                <div className="h-28 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                <div className="h-28 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
                <div className="h-28 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              </>
            )}

            {!loadingProviders && filtered.length === 0 && (
              <div className="text-sm text-white/70">Няма резултати.</div>
            )}

            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => openProvider(p)}
                className="text-left rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="mt-1 text-sm text-white/70">
                      {p.phone ? `Тел: ${p.phone}` : " "}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
                    →
                  </div>
                </div>

                <div className="mt-4 text-sm text-white/70">
                  Виж услуги и резервирай онлайн
                </div>
              </button>
            ))}
          </div>

          {/* Selected provider */}
          {selected && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-white/70">{selected.phone ? `Тел: ${selected.phone}` : " "}</p>
                </div>
                <button
                  onClick={() => { setSelected(null); setServices([]); }}
                  className="text-sm px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition"
                >
                  Затвори
                </button>
              </div>

              <div className="mt-5">
                <div className="font-semibold">Услуги</div>

                {loadingServices && (
                  <div className="mt-2 text-sm text-white/70">Зареждане…</div>
                )}

                {!loadingServices && services.length === 0 && (
                  <div className="mt-2 text-sm text-white/70">Няма добавени услуги още.</div>
                )}

                <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {services.map((s) => (
                    <div key={s.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="mt-1 text-sm text-white/70">
                            {Number(s.price).toFixed(2)} лв · {(s.duration_min ?? 60)} мин
                          </div>
                        </div>
                        <button
                          className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition"
                          onClick={() => alert("Следва: добавяме красивия booking UI тук 🙂")}
                        >
                          Резервирай
                        </button>
                      </div>

                      <div className="mt-4 text-xs text-white/60">
                        (Следващата стъпка: избор на дата/час + потвърждение)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-white/50">
            © {new Date().getFullYear()} Lotti • made for salons & clients
          </div>
        </div>
      </section>
    </div>
  );
}

