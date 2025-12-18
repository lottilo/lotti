import { useEffect, useMemo, useState } from "react";

const API = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

const DOW = [
  { id: 0, label: "Неделя" },
  { id: 1, label: "Понеделник" },
  { id: 2, label: "Вторник" },
  { id: 3, label: "Сряда" },
  { id: 4, label: "Четвъртък" },
  { id: 5, label: "Петък" },
  { id: 6, label: "Събота" },
];

export default function Dashboard({ token, logout }) {
  const [tab, setTab] = useState("bookings"); // bookings | services | hours

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hours, setHours] = useState(() =>
    DOW.map((d) => ({ day_of_week: d.id, enabled: d.id >= 1 && d.id <= 5, start_time: "09:00", end_time: "18:00" }))
  );

  const [newService, setNewService] = useState({ name: "", price: "", duration_min: 60 });

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingHours, setLoadingHours] = useState(false);

  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const apiHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const bookingsUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    return `${API}/my/bookings${qs ? `?${qs}` : ""}`;
  }, [from, to]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadServices() {
    setLoadingServices(true);
    setError(null);
    try {
      const res = await fetch(`${API}/my/services`, { headers: apiHeaders });
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadBookings() {
    setLoadingBookings(true);
    setError(null);
    try {
      const res = await fetch(bookingsUrl, { headers: apiHeaders });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadHours() {
    setLoadingHours(true);
    setError(null);
    try {
      const res = await fetch(`${API}/my/working-hours`, { headers: apiHeaders });
      const data = await res.json();

      // normalize into UI model (enabled + HH:mm strings)
      const map = new Map((Array.isArray(data) ? data : []).map((x) => [Number(x.day_of_week), x]));
      const next = DOW.map((d) => {
        const row = map.get(d.id);
        return {
          day_of_week: d.id,
          enabled: !!row,
          start_time: row ? String(row.start_time).slice(0, 5) : "09:00",
          end_time: row ? String(row.end_time).slice(0, 5) : "18:00",
        };
      });

      setHours(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingHours(false);
    }
  }

  useEffect(() => {
    loadServices();
    loadBookings();
    loadHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsUrl]);

  async function addService(e) {
    e.preventDefault();
    setError(null);

    if (!newService.name || newService.price === "") {
      setError("Моля, въведи име и цена.");
      return;
    }

    try {
      const res = await fetch(`${API}/my/services`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          name: newService.name,
          price: Number(newService.price),
          duration_min: Number(newService.duration_min || 60),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при добавяне на услуга");

      setNewService({ name: "", price: "", duration_min: 60 });
      await loadServices();
      showToast("✅ Услугата е добавена");
      setTab("services");
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveHours() {
    setLoadingHours(true);
    setError(null);
    try {
      const payload = hours
        .filter((h) => h.enabled)
        .map((h) => ({ day_of_week: h.day_of_week, start_time: h.start_time, end_time: h.end_time }));

      const res = await fetch(`${API}/my/working-hours`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify({ hours: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при запис");

      showToast("✅ Работното време е запазено");
      await loadHours();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingHours(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-emerald-50 to-lime-50 text-neutral-900">
      {/* toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="rounded-2xl bg-white border border-neutral-200 shadow px-4 py-3 text-sm font-medium">
            {toast}
          </div>
        </div>
      )}

      <div className="border-b border-neutral-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold tracking-tight">Дашборд на салона</div>
            <div className="text-xs text-neutral-600">Услуги • Резервации • Работно време</div>
          </div>

          <button
            onClick={logout}
            className="text-sm px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 transition shadow-sm"
          >
            Изход
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "bookings", label: "Резервации" },
            { id: "services", label: "Услуги" },
            { id: "hours", label: "Работно време" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-4 py-2 rounded-2xl border text-sm font-semibold transition shadow-sm " +
                (tab === t.id
                  ? "bg-yellow-400 border-yellow-300"
                  : "bg-white border-neutral-200 hover:bg-neutral-50")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-white/80 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200">
              <div>
                <div className="font-semibold text-lg">Резервации</div>
                <div className="text-sm text-neutral-600">
                  {loadingBookings ? "Зареждане…" : `${bookings.length} бр.`}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">От</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="rounded-2xl border border-neutral-200 bg-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">До</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="rounded-2xl border border-neutral-200 bg-white px-3 py-2"
                  />
                </div>
                <button
                  onClick={loadBookings}
                  className="rounded-2xl px-4 py-2 bg-emerald-400 text-white font-semibold hover:bg-emerald-500 transition shadow"
                >
                  Обнови
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left">
                  <tr>
                    <th className="p-4 border-b border-neutral-200">Дата/час</th>
                    <th className="p-4 border-b border-neutral-200">Услуга</th>
                    <th className="p-4 border-b border-neutral-200">Клиент</th>
                    <th className="p-4 border-b border-neutral-200">Телефон</th>
                    <th className="p-4 border-b border-neutral-200">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingBookings && bookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-5 text-neutral-600">
                        Няма резервации за избрания период.
                      </td>
                    </tr>
                  )}

                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50">
                      <td className="p-4 border-b border-neutral-100">{formatBG(b.start_at)}</td>
                      <td className="p-4 border-b border-neutral-100">
                        <div className="font-semibold">{b.service_name}</div>
                        <div className="text-xs text-neutral-600 mt-1">
                          {b.duration_min} мин · {Number(b.price).toFixed(2)} лв
                        </div>
                      </td>
                      <td className="p-4 border-b border-neutral-100">{b.customer_name}</td>
                      <td className="p-4 border-b border-neutral-100">{b.customer_phone}</td>
                      <td className="p-4 border-b border-neutral-100">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs bg-emerald-50 border border-emerald-200 text-emerald-700">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2 rounded-3xl border border-neutral-200 bg-white/80 shadow-sm p-5">
              <div className="font-semibold text-lg">Добави услуга</div>
              <div className="text-sm text-neutral-600 mt-1">Име, цена и време за изпълнение.</div>

              <form onSubmit={addService} className="mt-4 grid gap-3">
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">Име</label>
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Маникюр…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Цена (лв)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                      value={newService.price}
                      onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Време (мин)</label>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                      value={newService.duration_min}
                      onChange={(e) => setNewService((s) => ({ ...s, duration_min: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>

                <button className="rounded-2xl px-4 py-3 bg-yellow-400 border border-yellow-300 font-semibold hover:bg-yellow-300 transition shadow">
                  Добави услуга
                </button>
              </form>
            </div>

            <div className="lg:col-span-3 rounded-3xl border border-neutral-200 bg-white/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-200">
                <div>
                  <div className="font-semibold text-lg">Твоите услуги</div>
                  <div className="text-sm text-neutral-600">
                    {loadingServices ? "Зареждане…" : `${services.length} бр.`}
                  </div>
                </div>
                <button
                  onClick={loadServices}
                  className="rounded-2xl px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 transition shadow-sm text-sm font-semibold"
                >
                  Обнови
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-left">
                    <tr>
                      <th className="p-4 border-b border-neutral-200">Име</th>
                      <th className="p-4 border-b border-neutral-200">Цена</th>
                      <th className="p-4 border-b border-neutral-200">Време</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingServices && services.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-5 text-neutral-600">
                          Няма услуги.
                        </td>
                      </tr>
                    )}

                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50">
                        <td className="p-4 border-b border-neutral-100 font-semibold">{s.name}</td>
                        <td className="p-4 border-b border-neutral-100">{Number(s.price).toFixed(2)} лв</td>
                        <td className="p-4 border-b border-neutral-100">{(s.duration_min ?? 60)} мин</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HOURS */}
        {tab === "hours" && (
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/80 shadow-sm p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">Работно време</div>
                <div className="text-sm text-neutral-600 mt-1">Това определя свободните часове за онлайн резервации.</div>
              </div>

              <button
                onClick={saveHours}
                disabled={loadingHours}
                className="rounded-2xl px-4 py-2 bg-emerald-400 text-white font-semibold hover:bg-emerald-500 transition shadow disabled:opacity-60"
              >
                {loadingHours ? "Запазване…" : "Запази"}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {hours.map((h) => (
                <div key={h.day_of_week} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((x) =>
                              x.day_of_week === h.day_of_week ? { ...x, enabled: e.target.checked } : x
                            )
                          )
                        }
                        className="h-4 w-4"
                      />
                      <div className="font-semibold">{DOW.find((d) => d.id === h.day_of_week)?.label}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">От</label>
                        <input
                          type="time"
                          value={h.start_time}
                          disabled={!h.enabled}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((x) =>
                                x.day_of_week === h.day_of_week ? { ...x, start_time: e.target.value } : x
                              )
                            )
                          }
                          className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">До</label>
                        <input
                          type="time"
                          value={h.end_time}
                          disabled={!h.enabled}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((x) =>
                                x.day_of_week === h.day_of_week ? { ...x, end_time: e.target.value } : x
                              )
                            )
                          }
                          className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-neutral-600">
              Съвет: изключи дни, в които салонът не работи — така няма да се показват свободни часове.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
