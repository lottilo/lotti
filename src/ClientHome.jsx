import { useEffect, useMemo, useState } from "react";

const API = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

function fmtBGTime(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("bg-BG", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function ClientHome({ onSalonLoginClick }) {
  const [q, setQ] = useState("");
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [selected, setSelected] = useState(null); // provider
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [error, setError] = useState("");

  // booking UI state
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [startAt, setStartAt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState("");

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

    // reset booking states
    setActiveServiceId(null);
    setSlots([]);
    setStartAt("");
    setCustomerName("");
    setCustomerPhone("");
    setBookingMsg("");
    setSlotError("");

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

  async function loadSlots(providerId, serviceId, chosenDate) {
    setLoadingSlots(true);
    setSlotError("");
    setSlots([]);
    setStartAt("");
    setBookingMsg("");

    try {
      const url = `${API}/providers/${providerId}/availability?date=${encodeURIComponent(chosenDate)}&serviceId=${encodeURIComponent(serviceId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при зареждане на слотове");
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (e) {
      setSlotError(e.message || "Не успях да заредя свободните часове.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function startBooking(svc) {
    if (!selected) return;
    setActiveServiceId(svc.id);
    setBookingMsg("");
    setCustomerName("");
    setCustomerPhone("");
    setStartAt("");
    await loadSlots(selected.id, svc.id, date);
  }

  async function submitBooking() {
    if (!selected || !activeServiceId) return;

    setBookingLoading(true);
    setBookingMsg("");
    setSlotError("");

    try {
      if (!startAt) throw new Error("Моля, избери час.");
      if (!customerName.trim()) throw new Error("Моля, въведи име.");
      if (!customerPhone.trim()) throw new Error("Моля, въведи телефон.");

      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selected.id,
          serviceId: activeServiceId,
          startAt,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Неуспешна резервация");

      setBookingMsg("✅ Резервацията е създадена! Ще се свържем с вас при нужда.");
      // refresh slots (да не остане избрания час)
      await loadSlots(selected.id, activeServiceId, date);
      setStartAt("");
    } catch (e) {
      setBookingMsg(`❌ ${e.message}`);
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">LOTTI</h1>
            <p className="text-sm text-neutral-500">Открий салон и запази час онлайн</p>
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
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Салони</h2>
              <p className="text-sm text-neutral-500 mt-1">Избери салон → услуга → час → резервация.</p>
            </div>

            <input
              className="w-full sm:w-80 rounded-xl border px-4 py-3"
              placeholder="Търси по име на салон…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProviders && <div className="text-sm text-neutral-500">Зареждане…</div>}
            {!loadingProviders && filtered.length === 0 && <div className="text-sm text-neutral-500">Няма резултати.</div>}

            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => openProvider(p)}
                className="text-left rounded-2xl border bg-white p-4 hover:shadow-sm hover:border-neutral-300 transition"
              >
                <div className="font-semibold">{p.name}</div>
                <div className="mt-1 text-sm text-neutral-500">{p.phone ? `Тел: ${p.phone}` : " "}</div>
                <div className="mt-3 text-sm underline text-neutral-700">Виж услуги →</div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-neutral-500">{selected.phone ? `Тел: ${selected.phone}` : " "}</p>
              </div>

              <button
                onClick={() => { setSelected(null); setServices([]); setActiveServiceId(null); }}
                className="text-sm px-3 py-2 rounded-xl border hover:bg-neutral-100"
              >
                Затвори
              </button>
            </div>

            <div className="mt-4">
              <div className="font-semibold">Услуги</div>

              {loadingServices && <div className="mt-2 text-sm text-neutral-500">Зареждане…</div>}
              {!loadingServices && services.length === 0 && (
                <div className="mt-2 text-sm text-neutral-500">Няма добавени услуги още.</div>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {services.map((s) => {
                  const isActive = activeServiceId === s.id;

                  return (
                    <div key={s.id} className="rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="mt-1 text-sm text-neutral-500">
                            {Number(s.price).toFixed(2)} лв · {(s.duration_min ?? 60)} мин
                          </div>
                        </div>

                        <button
                          className="rounded-xl bg-black text-white px-4 py-2 text-sm"
                          onClick={() => startBooking(s)}
                        >
                          Резервирай
                        </button>
                      </div>

                      {isActive && (
                        <div className="mt-4 rounded-2xl bg-neutral-50 border p-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                              <label className="block text-xs text-neutral-500 mb-1">Дата</label>
                              <input
                                type="date"
                                className="w-full rounded-xl border px-3 py-2"
                                value={date}
                                onChange={async (e) => {
                                  const d = e.target.value;
                                  setDate(d);
                                  if (selected && activeServiceId) {
                                    await loadSlots(selected.id, activeServiceId, d);
                                  }
                                }}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs text-neutral-500 mb-1">Свободни часове</label>

                              {loadingSlots && <div className="text-sm text-neutral-500">Зареждане…</div>}

                              {slotError && <div className="text-sm text-red-600">{slotError}</div>}

                              {!loadingSlots && !slotError && slots.length === 0 && (
                                <div className="text-sm text-neutral-500">Няма свободни часове за тази дата.</div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {slots.map((iso) => (
                                  <button
                                    key={iso}
                                    type="button"
                                    onClick={() => setStartAt(iso)}
                                    className={
                                      "px-3 py-2 rounded-xl border text-sm " +
                                      (startAt === iso ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100")
                                    }
                                  >
                                    {fmtBGTime(iso)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                              <label className="block text-xs text-neutral-500 mb-1">Име</label>
                              <input
                                className="w-full rounded-xl border px-3 py-2"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Иван Иванов"
                              />
                            </div>

                            <div className="sm:col-span-1">
                              <label className="block text-xs text-neutral-500 mb-1">Телефон</label>
                              <input
                                className="w-full rounded-xl border px-3 py-2"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="0888123456"
                              />
                            </div>

                            <div className="sm:col-span-1 flex items-end">
                              <button
                                onClick={submitBooking}
                                disabled={bookingLoading}
                                className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-60"
                              >
                                {bookingLoading ? "Запазване..." : "Потвърди резервация"}
                              </button>
                            </div>
                          </div>

                          {bookingMsg && (
                            <div className="mt-3 text-sm">{bookingMsg}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

