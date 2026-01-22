// src/components/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import CalendarMonth from "./CalendarMonth";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function ymdFromISO(dt) {
  // stable: YYYY-MM-DD
  const d = new Date(dt);
  return d.toISOString().slice(0, 10);
}

function ymdTodayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function roleLabel(role) {
  const map = {
    manicurist: "Маникюрист",
    pedicurist: "Педикюрист",
    hairdresser: "Фризьор",
    cosmetician: "Козметик",
    barber: "Бръснар",
    makeup: "Грим",
    lashes: "Мигли/Вежди",
    massage: "Масаж",
    other: "Друго",
  };
  return map[role] || role || "—";
}

/**
 * NOTE:
 * - Frontend expects backend endpoints:
 *   GET    /my/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   PATCH  /my/bookings/:id/cancel
 *   GET    /my/services
 *   POST   /my/services
 *   GET    /my/staff
 *   POST   /my/staff
 *
 * For "create booking from dashboard":
 * - Recommended endpoint (auth): POST /my/bookings
 *   Body: { serviceId, startAt, endAt, customerName, customerPhone }
 *   (You asked endAt to be entered manually.)
 */
export default function Dashboard({ token, logout }) {
  const API_BASE = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

  const [tab, setTab] = useState("bookings"); // "bookings" | "services" | "staff"

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration_min: 60,
    staff_id: "",
  });

  const [newStaff, setNewStaff] = useState({
    full_name: "",
    role: "manicurist",
    phone: "",
  });

  // global UI state
  const [error, setError] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // bookings controls
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => ymdTodayLocal());

  const [busyBookingId, setBusyBookingId] = useState(null);

  // create booking modal (dashboard)
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(() => ({
    serviceId: "",
    customerName: "",
    customerPhone: "",
    date: ymdTodayLocal(), // YYYY-MM-DD
    startTime: "10:00", // HH:MM
    endTime: "11:00", // HH:MM (manual)
  }));

  const apiHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  function monthRange(date) {
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const fromYMD = from.toISOString().slice(0, 10);
    const toYMD = to.toISOString().slice(0, 10);
    return { fromYMD, toYMD };
  }

  const { fromYMD, toYMD } = useMemo(() => monthRange(monthDate), [monthDate]);

  const bookingsUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", fromYMD);
    p.set("to", toYMD);
    return `${API_BASE}/my/bookings?${p.toString()}`;
  }, [API_BASE, fromYMD, toYMD]);

  async function safeJson(res) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return { raw: text };
    }
  }

  async function loadServices() {
    setLoadingServices(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/services`, { headers: apiHeaders });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на услуги");
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
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на резервации");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadStaff() {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/staff`, { headers: apiHeaders });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на екип");
      setStaff(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }

  // initial load
  useEffect(() => {
    loadServices();
    loadBookings();
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload bookings when month changes
  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsUrl]);

  // keep create form date in sync with selectedDay (when switching days)
  useEffect(() => {
    setCreateForm((s) => ({ ...s, date: selectedDay || ymdTodayLocal() }));
  }, [selectedDay]);

  async function addService(e) {
    e.preventDefault();
    setError(null);

    if (!newService.name || newService.price === "") {
      setError("Моля, въведи име и цена.");
      return;
    }

    try {
      const payload = {
        name: newService.name,
        price: Number(newService.price),
        duration_min: Number(newService.duration_min || 60),
        staff_id: newService.staff_id === "" ? null : Number(newService.staff_id),
      };

      const res = await fetch(`${API_BASE}/my/services`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при добавяне на услуга");

      setNewService({ name: "", price: "", duration_min: 60, staff_id: "" });
      await loadServices();
      setTab("services");
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function addStaff(e) {
    e.preventDefault();
    setError(null);

    if (!newStaff.full_name || !newStaff.role) {
      setError("Моля, въведи име и роля.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/my/staff`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          full_name: newStaff.full_name,
          role: newStaff.role,
          phone: newStaff.phone || null,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при добавяне на специалист");

      setNewStaff({ full_name: "", role: "manicurist", phone: "" });
      await loadStaff();
      setTab("staff");
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function cancelBooking(bookingId) {
    const reason = prompt("Причина за отказ (по желание):", "");
    if (reason === null) return;

    setBusyBookingId(bookingId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: apiHeaders,
        body: JSON.stringify({ reason }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Неуспешно отказване");

      await loadBookings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyBookingId(null);
    }
  }

  function openCreateBooking() {
    setError(null);
    setCreateForm((s) => ({
      ...s,
      date: selectedDay || ymdTodayLocal(),
      // best default times
      startTime: s.startTime || "10:00",
      endTime: s.endTime || "11:00",
    }));
    setCreateOpen(true);
  }

  function closeCreateBooking() {
    if (creating) return;
    setCreateOpen(false);
  }

  function validateTimeHHMM(v) {
    return /^\d{2}:\d{2}$/.test(v);
  }

  function combineLocal(dateYMD, timeHHMM) {
    // produce local datetime ISO-ish: "YYYY-MM-DDTHH:mm:00"
    return `${dateYMD}T${timeHHMM}:00`;
  }

  async function createBooking(e) {
    e.preventDefault();
    setError(null);

    const { serviceId, customerName, customerPhone, date, startTime, endTime } = createForm;

    if (!serviceId) return setError("Избери услуга.");
    if (!customerName.trim()) return setError("Въведи име на клиент.");
    if (!customerPhone.trim()) return setError("Въведи телефон на клиент.");
    if (!date) return setError("Избери дата.");
    if (!validateTimeHHMM(startTime) || !validateTimeHHMM(endTime)) return setError("Часът трябва да е във формат HH:MM.");

    const startAt = new Date(combineLocal(date, startTime));
    const endAt = new Date(combineLocal(date, endTime));

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return setError("Невалидна дата/час.");
    if (endAt <= startAt) return setError("Крайният час трябва да е след началния.");

    setCreating(true);
    try {
      // IMPORTANT: this requires backend endpoint POST /my/bookings (auth)
      const res = await fetch(`${API_BASE}/my/bookings`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          serviceId: Number(serviceId),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Неуспешно записване на час");

      setCreateOpen(false);
      await loadBookings();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setCreating(false);
    }
  }

  // calendar counts & day list
  const countsByDay = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const key = ymdFromISO(b.start_at);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [bookings]);

  const bookingsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return bookings
      .filter((b) => ymdFromISO(b.start_at) === selectedDay)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [bookings, selectedDay]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Дашборд</h2>
            <div style={{ opacity: 0.7, marginTop: 6 }}>Управление на резервации, услуги и екип</div>
          </div>

          <button
            onClick={logout}
            style={{
              border: "1px solid #ddd",
              padding: "10px 12px",
              borderRadius: 12,
              background: "white",
              cursor: "pointer",
            }}
          >
            Изход
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 14, flexWrap: "wrap" }}>
          <button
            onClick={() => setTab("bookings")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: tab === "bookings" ? "#111" : "white",
              color: tab === "bookings" ? "white" : "#111",
              cursor: "pointer",
            }}
          >
            Резервации
          </button>

          <button
            onClick={() => setTab("services")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: tab === "services" ? "#111" : "white",
              color: tab === "services" ? "white" : "#111",
              cursor: "pointer",
            }}
          >
            Услуги
          </button>

          <button
            onClick={() => setTab("staff")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: tab === "staff" ? "#111" : "white",
              color: tab === "staff" ? "white" : "#111",
              cursor: "pointer",
            }}
          >
            Екип
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 12,
              border: "1px solid #f2c6c6",
              background: "#fff5f5",
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 14, alignItems: "start" }}>
            {/* Calendar */}
            <div>
              <CalendarMonth
                monthDate={monthDate}
                countsByDay={countsByDay}
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay(day)}
                onPrevMonth={() =>
                  setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                onNextMonth={() =>
                  setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
              />

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={loadBookings}
                  disabled={loadingBookings || busyBookingId != null || creating}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: loadingBookings || busyBookingId != null || creating ? "not-allowed" : "pointer",
                    opacity: loadingBookings || busyBookingId != null || creating ? 0.7 : 1,
                  }}
                >
                  {loadingBookings ? "Зареждам..." : "Обнови месеца"}
                </button>

                <button
                  onClick={openCreateBooking}
                  disabled={busyBookingId != null || creating}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #111",
                    background: "#111",
                    color: "white",
                    cursor: busyBookingId != null || creating ? "not-allowed" : "pointer",
                    opacity: busyBookingId != null || creating ? 0.7 : 1,
                  }}
                >
                  + Запиши час
                </button>
              </div>
            </div>

            {/* Day panel */}
            <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff", overflow: "hidden" }}>
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {selectedDay
                    ? new Intl.DateTimeFormat("bg-BG", { dateStyle: "full" }).format(
                        new Date(`${selectedDay}T00:00:00`)
                      )
                    : "Ден"}
                </div>
                <div style={{ opacity: 0.7 }}>
                  {loadingBookings ? "..." : `${bookingsForSelectedDay.length} бр.`}
                </div>
              </div>

              <div style={{ padding: 12 }}>
                {loadingBookings && (
                  <div style={{ opacity: 0.7, padding: "8px 0" }}>Зареждане…</div>
                )}

                {!loadingBookings && bookingsForSelectedDay.length === 0 && (
                  <div style={{ opacity: 0.7, padding: "8px 0" }}>Няма резервации за този ден.</div>
                )}

                {!loadingBookings &&
                  bookingsForSelectedDay.map((b) => {
                    const cancelled = String(b.status || "").toLowerCase() === "cancelled";
                    const isBusy = busyBookingId === b.id;

                    return (
                      <div
                        key={b.id}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 14,
                          padding: 12,
                          marginBottom: 10,
                          background: cancelled ? "#fafafa" : "white",
                          opacity: cancelled ? 0.75 : 1,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>{formatBG(b.start_at)}</div>
                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontWeight: 700 }}>{b.service_name}</div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>
                                {b.duration_min} мин · {Number(b.price).toFixed(2)} лв
                              </div>
                            </div>

                            <div style={{ marginTop: 8, fontSize: 13 }}>
                              <div><strong>Клиент:</strong> {b.customer_name}</div>
                              <div><strong>Телефон:</strong> {b.customer_phone}</div>
                              <div style={{ marginTop: 6 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: 999,
                                    border: "1px solid #ddd",
                                    fontSize: 12,
                                  }}
                                >
                                  {b.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                            <button
                              onClick={() => cancelBooking(b.id)}
                              disabled={cancelled || loadingBookings || busyBookingId != null || creating}
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px 10px",
                                borderRadius: 12,
                                background: "white",
                                cursor:
                                  cancelled || loadingBookings || busyBookingId != null || creating
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: cancelled ? 0.6 : 1,
                                whiteSpace: "nowrap",
                              }}
                              title={cancelled ? "Вече е отменена" : "Отмени резервацията"}
                            >
                              {isBusy ? "Отказвам..." : cancelled ? "Отменена" : "Отмени"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Create booking modal */}
            {createOpen && (
              <div
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeCreateBooking();
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  zIndex: 9999,
                }}
              >
                <div
                  style={{
                    width: "min(560px, 100%)",
                    background: "white",
                    borderRadius: 18,
                    border: "1px solid #eee",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800 }}>Запиши час</div>
                    <button
                      onClick={closeCreateBooking}
                      disabled={creating}
                      style={{
                        border: "1px solid #ddd",
                        background: "white",
                        borderRadius: 12,
                        padding: "8px 10px",
                        cursor: creating ? "not-allowed" : "pointer",
                        opacity: creating ? 0.7 : 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={createBooking} style={{ padding: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Услуга
                        </label>
                        <select
                          value={createForm.serviceId}
                          onChange={(e) => setCreateForm((s) => ({ ...s, serviceId: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                        >
                          <option value="">— избери услуга —</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} · {Number(s.price).toFixed(2)} лв
                            </option>
                          ))}
                        </select>
                        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                          Важно: това работи само ако бекендът има <strong>POST /my/bookings</strong>.
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Дата
                        </label>
                        <input
                          type="date"
                          value={createForm.date}
                          onChange={(e) => setCreateForm((s) => ({ ...s, date: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Начален час
                        </label>
                        <input
                          type="time"
                          value={createForm.startTime}
                          onChange={(e) => setCreateForm((s) => ({ ...s, startTime: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Краен час (ръчно)
                        </label>
                        <input
                          type="time"
                          value={createForm.endTime}
                          onChange={(e) => setCreateForm((s) => ({ ...s, endTime: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Име на клиент
                        </label>
                        <input
                          value={createForm.customerName}
                          onChange={(e) => setCreateForm((s) => ({ ...s, customerName: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                          placeholder="Иван Иванов"
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                          Телефон
                        </label>
                        <input
                          value={createForm.customerPhone}
                          onChange={(e) => setCreateForm((s) => ({ ...s, customerPhone: e.target.value }))}
                          style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                          placeholder="08..."
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={closeCreateBooking}
                        disabled={creating}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid #ddd",
                          background: "white",
                          cursor: creating ? "not-allowed" : "pointer",
                          opacity: creating ? 0.7 : 1,
                        }}
                      >
                        Отказ
                      </button>

                      <button
                        type="submit"
                        disabled={creating}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid #111",
                          background: "#111",
                          color: "white",
                          cursor: creating ? "not-allowed" : "pointer",
                          opacity: creating ? 0.85 : 1,
                        }}
                      >
                        {creating ? "Записвам..." : "Запиши"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>Услуги</div>
              <div style={{ opacity: 0.7 }}>{loadingServices ? "Зареждане..." : `${services.length} бр.`}</div>
            </div>

            <div style={{ padding: 12 }}>
              <form onSubmit={addService} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Име</label>
                  <input
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="Маникюр…"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Цена (лв)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="50"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Време (мин)</label>
                  <input
                    type="number"
                    value={newService.duration_min}
                    onChange={(e) => setNewService((s) => ({ ...s, duration_min: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="60"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Специалист (по желание)</label>
                  <select
                    value={newService.staff_id}
                    onChange={(e) => setNewService((s) => ({ ...s, staff_id: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", minWidth: 220 }}
                  >
                    <option value="">Целият салон</option>
                    {staff
                      .filter((st) => st.is_active)
                      .map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.full_name} · {roleLabel(st.role)}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#111",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Добави
                </button>

                <button
                  type="button"
                  onClick={loadServices}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Обнови
                </button>
              </form>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Име</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Цена</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Време</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Кой изпълнява</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingServices && services.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: 18, opacity: 0.7 }}>
                        Няма услуги.
                      </td>
                    </tr>
                  )}

                  {services.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{s.name}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{Number(s.price).toFixed(2)} лв</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{(s.duration_min ?? 60)} мин</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                        {s.staff_name ? (
                          <span>
                            {s.staff_name} · <span style={{ opacity: 0.7 }}>{roleLabel(s.staff_role)}</span>
                          </span>
                        ) : (
                          <span style={{ opacity: 0.8 }}>Целият салон</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: 12, fontSize: 12, opacity: 0.7 }}>
                (Редакция/Изтриване на услуги ще добавим в следващата стъпка с нови endpoints.)
              </div>
            </div>
          </div>
        )}

        {/* STAFF */}
        {tab === "staff" && (
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>Екип</div>
              <div style={{ opacity: 0.7 }}>{loadingStaff ? "Зареждане..." : `${staff.length} бр.`}</div>
            </div>

            <div style={{ padding: 12 }}>
              <form onSubmit={addStaff} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Име</label>
                  <input
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff((s) => ({ ...s, full_name: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="Мария Петрова"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Роля</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff((s) => ({ ...s, role: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", minWidth: 220 }}
                  >
                    <option value="manicurist">Маникюрист</option>
                    <option value="pedicurist">Педикюрист</option>
                    <option value="hairdresser">Фризьор</option>
                    <option value="cosmetician">Козметик</option>
                    <option value="barber">Бръснар</option>
                    <option value="makeup">Грим</option>
                    <option value="lashes">Мигли/Вежди</option>
                    <option value="massage">Масаж</option>
                    <option value="other">Друго</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Телефон</label>
                  <input
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff((s) => ({ ...s, phone: e.target.value }))}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="0888..."
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#111",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Добави
                </button>

                <button
                  type="button"
                  onClick={loadStaff}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Обнови
                </button>
              </form>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Име</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Роля</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Телефон</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingStaff && staff.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: 18, opacity: 0.7 }}>
                        Няма добавени специалисти.
                      </td>
                    </tr>
                  )}

                  {staff.map((st) => (
                    <tr key={st.id}>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{st.full_name}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{roleLabel(st.role)}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{st.phone || "—"}</td>
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{st.is_active ? "Активен" : "Неактивен"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


