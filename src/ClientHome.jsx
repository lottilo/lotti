import { useEffect, useMemo, useState } from "react";

const API = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

/* ------------------ helpers ------------------ */
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

function addDaysISO(iso, delta) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addMonths(yyyymmdd, delta) {
  const d = new Date(`${yyyymmdd}T00:00:00`);
  d.setMonth(d.getMonth() + delta);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sameDayISO(a, b) {
  return a === b;
}

function isPastISO(iso) {
  // compare by date only in local time
  const t = new Date(`${todayISO()}T00:00:00`).getTime();
  const x = new Date(`${iso}T00:00:00`).getTime();
  return x < t;
}

function monthLabelBG(yyyymmdd) {
  const d = new Date(`${yyyymmdd}T00:00:00`);
  return new Intl.DateTimeFormat("bg-BG", { month: "long", year: "numeric" }).format(d);
}

const WEEKDAYS_BG = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function CalendarMonth({ valueISO, minISO, onChange }) {
  const [viewISO, setViewISO] = useState(valueISO || todayISO());

  useEffect(() => {
    // keep view month in sync when selected date changes (e.g. +/-)
    if (valueISO) setViewISO(valueISO);
  }, [valueISO]);

  const viewDate = useMemo(() => new Date(`${viewISO}T00:00:00`), [viewISO]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11

  // We want Monday-first calendar
  // JS: 0 Sun..6 Sat; convert to Monday-first index 0..6
  function monFirstIndex(jsDay) {
    // jsDay: 0=Sun => 6, 1=Mon => 0, ... 6=Sat => 5
    return (jsDay + 6) % 7;
  }

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = monFirstIndex(firstOfMonth.getDay()); // 0..6 blanks before day1
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // 6 weeks grid (42 cells) for stable layout
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startOffset + 1; // 1..daysInMonth
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      const d = new Date(year, month, dayNum);
      cells.push(d);
    }
  }

  const canPrev = true;
  const canNext = true;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setViewISO((v) => addMonths(v, -1))}
          className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
          aria-label="Предишен месец"
          disabled={!canPrev}
        >
          ←
        </button>

        <div className="text-sm font-semibold capitalize">{monthLabelBG(viewISO)}</div>

        <button
          type="button"
          onClick={() => setViewISO((v) => addMonths(v, +1))}
          className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
          aria-label="Следващ месец"
          disabled={!canNext}
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2 text-[11px] text-white/50">
        {WEEKDAYS_BG.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} className="h-10" />;

          const iso = toISODate(d);
          const disabled = (minISO && iso < minISO) || isPastISO(iso);
          const selected = valueISO && sameDayISO(iso, valueISO);
          const isToday = sameDayISO(iso, todayISO());

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={[
                "h-10 rounded-2xl border text-sm transition grid place-items-center",
                disabled
                  ? "border-white/5 bg-white/5 text-white/30 cursor-not-allowed"
                  : "border-white/10 bg-black/10 hover:bg-white/10 text-white/85",
                selected
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                  : "",
                !selected && isToday && !disabled
                  ? "ring-2 ring-emerald-500/25"
                  : "",
              ].join(" ")}
              title={iso}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-white/50">
        Избрана дата: <span className="text-white/80 font-medium">{valueISO}</span>
      </div>
    </div>
  );
}

/* ------------------ main ------------------ */
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
      } catch {
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
    } catch {
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

  function startBooking(service) {
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
          startAt: chosenSlot,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Неуспешна резервация");

      showToast("✅ Резервацията е създадена!");
      setBookingOpen(false);

      // refresh slots after booking
      await loadSlots(bookingDate, bookingService);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#0b1411] via-[#0f1f18] to-[#0b1411]">
      {/* soft glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[700px] blur-3xl rounded-full bg-emerald-500/20" />
        <div className="absolute top-52 -left-40 h-72 w-72 blur-3xl rounded-full bg-emerald-400/15" />
        <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 blur-3xl rounded-full bg-emerald-500/15" />
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-2xl bg-white text-neutral-900 border border-white/10 shadow px-4 py-3 text-sm font-medium">
            {toast}
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10 bg-black/10 backdrop-blur">
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
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.55)]" />
              Резервирай онлайн
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold leading-tight">
              Намери салон и запази час{" "}
              <span className="text-white/60">за секунди</span>
            </h1>

            <p className="mt-3 text-white/70 max-w-prose">
              Избираш салон → услуга → дата → свободен час → потвърждение.
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
                className="rounded-2xl px-5 py-3 bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition shadow-[0_0_25px_rgba(16,185,129,0.35)]"
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
                ["3", "Избираш дата от календара"],
                ["4", "Потвърждаваш резервация"],
              ].map(([n, t]) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 grid place-items-center font-semibold text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
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
      <section id="catalog" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
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
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 grid place-items-center font-bold text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
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
                  <div key={s.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="mt-1 text-sm text-white/70">
                          {Number(s.price).toFixed(2)} лв · {(s.duration_min ?? 60)} мин
                        </div>
                      </div>

                      <button
                        className="rounded-2xl bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition shadow-[0_0_25px_rgba(16,185,129,0.35)]"
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
            className="absolute inset-0 bg-black/60"
            onClick={() => !submitting && setBookingOpen(false)}
          />
          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <div className="w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0b1411] shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white/60">Резервация</div>
                  <div className="text-lg font-semibold mt-1">{selected.name}</div>
                  <div className="text-sm text-white/70 mt-1">
                    {bookingService.name} · {Number(bookingService.price).toFixed(2)} лв ·{" "}
                    {(bookingService.duration_min ?? 60)} мин
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

                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Calendar */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-sm font-semibold">Избери дата</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingDate((d) => addDaysISO(d, -1))}
                          className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                        >
                          − ден
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingDate((d) => addDaysISO(d, +1))}
                          className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                        >
                          + ден
                        </button>
                      </div>
                    </div>

                    <CalendarMonth
                      valueISO={bookingDate}
                      minISO={todayISO()}
                      onChange={(iso) => setBookingDate(iso)}
                    />

                    {/* optional date input for power users */}
                    <div className="mt-3">
                      <label className="block text-xs text-white/60 mb-1">Или избери от date picker</label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={todayISO()}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      />
                    </div>
                  </div>

                  {/* Slots */}
                  <div>
                    <div className="text-sm font-semibold mb-2">Свободни часове</div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 min-h-[180px]">
                      {loadingSlots ? (
                        <div className="text-sm text-white/70">Зареждане…</div>
                      ) : slots.length === 0 ? (
                        <div className="text-sm text-white/70">Няма свободни часове за тази дата.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((iso) => (
                            <button
                              key={iso}
                              onClick={() => setChosenSlot(iso)}
                              className={[
                                "px-3 py-2 rounded-2xl text-sm border transition",
                                chosenSlot === iso
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                                  : "bg-black/10 border-white/10 text-white/80 hover:bg-white/10",
                              ].join(" ")}
                              title={formatBG(iso)}
                            >
                              {formatBG(iso).split(" ").pop()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
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
                      className="mt-4 w-full rounded-2xl px-4 py-3 bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition disabled:opacity-60 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                    >
                      {submitting
                        ? "Запазване…"
                        : chosenSlot
                        ? `Потвърди за ${formatBG(chosenSlot)}`
                        : "Избери час"}
                    </button>

                    <div className="mt-2 text-xs text-white/50">
                      След потвърждение резервацията се записва в системата на салона.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


