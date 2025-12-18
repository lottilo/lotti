import { useEffect, useMemo, useState } from "react";

const API = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ClientHome({ onSalonLoginClick }) {
  const [q, setQ] = useState("");

  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [selected, setSelected] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // booking modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState(null);

  const [bookingDate, setBookingDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [chosenSlot, setChosenSlot] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // Load providers
  useEffect(() => {
    (async () => {
      setLoadingProviders(true);
      setError("");
      try {
        const res = await fetch(`${API}/providers`);
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Не успях да заредя салоните. Опитай пак след малко.");
      } finally {
        setLoadingProviders(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return providers;
    return providers.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [providers, q]);

  async function openProvider(p) {
    setSelected(p);
    setServices([]);
    setLoadingServices(true);
    setError("");

    try {
      const res = await fetch(`${API}/providers/${p.id}/services`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Не успях да заредя услугите на салона.");
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  function closeProvider() {
    setSelected(null);
    setServices([]);
    setError("");
  }

  // Booking modal open
  async function startBooking(service) {
    if (!selected) return;
    setBookingService(service);
    setBookingDate(todayISO());
    setSlots([]);
    setChosenSlot("");
    setCustomerName("");
    setCustomerPhone("");
    setError("");
    setBookingOpen(true);
  }

  async function loadSlots(date, service) {
    if (!selected || !service) return;
    setLoadingSlots(true);
    setError("");
    setSlots([]);
    setChosenSlot("");

    try {
      const url = `${API}/providers/${selected.id}/availability?date=${encodeURIComponent(
        date
      )}&serviceId=${encodeURIComponent(service.id)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Грешка при зареждане на свободни часове");

      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (e) {
      setError(e.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // whenever modal opens or date changes -> fetch slots
  useEffect(() => {
    if (!bookingOpen || !bookingService) return;
    loadSlots(bookingDate, bookingService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingOpen, bookingDate, bookingService?.id]);

  async function submitBooking() {
    if (!selected || !bookingService || !chosenSlot) {
      setError("Избери услуга и час.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Моля, въведи име и телефон.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selected.id,
          serviceId: bookingService.id,
          startAt: chosenSlot, // ISO string от slots
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Неуспешна резервация");
      }

      showToast("✅ Резервацията е създадена!");
      setBookingOpen(false);

      // refresh slots after booking (за да изчезне часът)
      await loadSlots(bookingDate, bookingService);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-2xl bg-white text-neutral-900 border border-white/10 shadow px-4 py-3 text-sm font-medium">
            {toast}
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">LOTTI</div>
            <div className="text-xs text-white/60">Каталог • Резервации</div>
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Резервирай онлайн
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold leading-tight">
              Намери салон и запази час{" "}
              <span className="text-white/60">за секунди</span>
            </h1>

            <p className="mt-3 text-white/70 max-w-prose">
              Избираш салон → услуга → свободен час → оставяш име и телефон.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/60 mb-1">Търси салон</label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Пример: Салон Красота…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="rounded-2xl px-5 py-3 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
                onClick={() => {
                  const el = document.getElementById("catalog");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Каталог
              </button>
            </div>

            {error && <div className="mt-4 text-sm text-red-300">{error}</div>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="text-sm text-white/70">Как работи</div>
            <div className="mt-4 grid gap-3">
              {[
                ["1", "Избираш салон"],
                ["2", "Избираш услуга"],
                ["3", "Избираш свободен час"],
                ["4", "Потвърждаваш резервация"],
              ].map(([n, t]) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 grid place-items-center font-semibold text-emerald-300">
                      {n}
                    </div>
                    <div className="font-semibold">{t}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-white/50">
              Ако първото зареждане е по-бавно — нормално е (Azure cold start).
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Салони</h2>
            <p className="text-sm text-white/70 mt-1">Избери салон, за да видиш услугите му.</p>
          </div>

          <div className="text-xs text-white/50">
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
                  <div className="mt-1 text-sm text-white/70">{p.phone ? `Тел: ${p.phone}` : " "}</div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 grid place-items-center font-bold text-emerald-300">
                  →
                </div>
              </div>
              <div className="mt-4 text-sm text-white/70">Виж услуги и резервирай онлайн</div>
            </button>
          ))}
        </div>

        {/* Selected provider */}
        {selected && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                <p className="text-sm text-white/70">{selected.phone ? `Тел: ${selected.phone}` : " "}</p>
              </div>

              <button
                onClick={closeProvider}
                className="text-sm px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition"
              >
                Затвори
              </button>
            </div>

            <div className="mt-5">
              <div className="font-semibold">Услуги</div>

              {loadingServices && <div className="mt-2 text-sm text-white/70">Зареждане…</div>}

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
                        className="rounded-2xl bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-600 transition"
                        onClick={() => startBooking(s)}
                      >
                        Резервирай
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Lotti
        </div>
      </section>

      {/* Booking modal */}
      {bookingOpen && bookingService && selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !submitting && setBookingOpen(false)}
          />
          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <div className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border border-white/10 bg-neutral-950 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white/60">Резервация</div>
                  <div className="text-lg font-semibold mt-1">{selected.name}</div>
                  <div className="text-sm text-white/70 mt-1">
                    {bookingService.name} · {Number(bookingService.price).toFixed(2)} лв · {(bookingService.duration_min ?? 60)} мин
                  </div>
                </div>

                <button
                  className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                  onClick={() => !submitting && setBookingOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="p-5 grid gap-4">
                {error && <div className="text-sm text-red-300">{error}</div>}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Дата</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">Свободни часове</label>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 min-h-[52px]">
                      {loadingSlots ? (
                        <div className="text-sm text-white/70">Зареждане…</div>
                      ) : slots.length === 0 ? (
                        <div className="text-sm text-white/70">Няма свободни часове.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((iso) => (
                            <button
                              key={iso}
                              onClick={() => setChosenSlot(iso)}
                              className={
                                "px-3 py-2 rounded-xl text-sm border transition " +
                                (chosenSlot === iso
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-black/30 border-white/10 text-white/80 hover:bg-white/10")
                              }
                            >
                              {formatBG(iso).split(" ").pop()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Име</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Телефон</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      placeholder="0888 123 456"
                    />
                  </div>
                </div>

                <button
                  onClick={submitBooking}
                  disabled={submitting || !chosenSlot}
                  className="w-full rounded-2xl px-4 py-3 bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition disabled:opacity-60"
                >
                  {submitting
                    ? "Запазване…"
                    : chosenSlot
                    ? `Потвърди за ${formatBG(chosenSlot)}`
                    : "Избери час"}
                </button>

                <div className="text-xs text-white/50">
                  След потвърждение резервацията се записва в системата на салона.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


