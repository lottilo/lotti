import { useEffect, useMemo, useState } from "react";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function toDateInput(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateTimeLocalValue(dt) {
  const d = new Date(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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

function monthLabel(d) {
  return new Intl.DateTimeFormat("bg-BG", { month: "long", year: "numeric" }).format(d);
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function Modal({ title, children, onClose }) {
  return (
    <div
      onMouseDown={onClose}
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
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "white",
          borderRadius: 16,
          border: "1px solid #eee",
          overflow: "hidden",
          boxShadow: "0 15px 45px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #ddd",
              background: "white",
              borderRadius: 12,
              padding: "8px 10px",
              cursor: "pointer",
            }}
          >
            Затвори
          </button>
        </div>
        <div style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ minWidth: 220 }}>
      <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export default function Dashboard({ token, logout }) {
  const API_BASE = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

  const [tab, setTab] = useState("bookings"); // bookings | services | staff

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Calendar state
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  // Filters derived from selected day (list shows that day only)
  const from = useMemo(() => toDateInput(selectedDay), [selectedDay]);
  const to = useMemo(() => toDateInput(selectedDay), [selectedDay]);

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
    return `${API_BASE}/my/bookings${qs ? `?${qs}` : ""}`;
  }, [API_BASE, from, to]);

  async function loadServices() {
    setLoadingServices(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/services`, { headers: apiHeaders });
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на екип");
      setStaff(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }

  useEffect(() => {
    loadServices();
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsUrl]);

  // ---------- BOOKINGS: create/edit/cancel ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [createForm, setCreateForm] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    return {
      serviceId: "",
      customerName: "",
      customerPhone: "",
      startAt: toDateTimeLocalValue(start),
      endAt: toDateTimeLocalValue(end),
    };
  });

  function openCreateForDay(d) {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    setCreateForm((f) => ({
      ...f,
      startAt: toDateTimeLocalValue(start),
      endAt: toDateTimeLocalValue(end),
    }));
    setCreateOpen(true);
  }

  async function createBooking() {
    setBusy(true);
    setError(null);
    try {
      if (!createForm.serviceId) throw new Error("Моля избери услуга.");
      if (!createForm.customerName.trim()) throw new Error("Моля въведи клиент.");
      if (!createForm.customerPhone.trim()) throw new Error("Моля въведи телефон.");

      const res = await fetch(`${API_BASE}/my/bookings`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          serviceId: Number(createForm.serviceId),
          customerName: createForm.customerName.trim(),
          customerPhone: createForm.customerPhone.trim(),
          startAt: new Date(createForm.startAt).toISOString(),
          endAt: new Date(createForm.endAt).toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Неуспешно записване");

      setCreateOpen(false);
      await loadBookings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(id) {
    const reason = prompt("Причина за отказ (по желание):", "");
    if (reason === null) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: apiHeaders,
        body: JSON.stringify({ reason }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Неуспешно отказване");

      await loadBookings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function openEditBooking(row) {
    setEditRow(row);
    setEditOpen(true);
  }

  async function saveEditBooking() {
    if (!editRow) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/bookings/${editRow.id}`, {
        method: "PATCH",
        headers: apiHeaders,
        body: JSON.stringify({
          serviceId: Number(editRow.service_id),
          customerName: editRow.customer_name,
          customerPhone: editRow.customer_phone,
          startAt: new Date(editRow.start_at).toISOString(),
          endAt: new Date(editRow.end_at).toISOString(),
          status: editRow.status,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Неуспешно обновяване");

      setEditOpen(false);
      setEditRow(null);
      await loadBookings();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- SERVICES: add/edit/delete ----------
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration_min: 60,
    staff_id: "",
  });

  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [editService, setEditService] = useState(null);

  async function addService(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (!newService.name.trim() || newService.price === "") {
        throw new Error("Моля, въведи име и цена.");
      }

      const payload = {
        name: newService.name.trim(),
        price: Number(newService.price),
        duration_min: Number(newService.duration_min || 60),
        staff_id: newService.staff_id === "" ? null : Number(newService.staff_id),
      };

      const res = await fetch(`${API_BASE}/my/services`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Грешка при добавяне на услуга");

      setNewService({ name: "", price: "", duration_min: 60, staff_id: "" });
      await loadServices();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  function openEditServiceRow(s) {
    setEditService({
      id: s.id,
      name: s.name,
      price: String(s.price ?? ""),
      duration_min: s.duration_min ?? 60,
      staff_id: s.staff_id ?? "",
    });
    setEditServiceOpen(true);
  }

  async function saveEditService() {
    if (!editService) return;
    setBusy(true);
    setError(null);

    try {
      if (!editService.name.trim() || editService.price === "") {
        throw new Error("Моля, въведи име и цена.");
      }

      const res = await fetch(`${API_BASE}/my/services/${editService.id}`, {
        method: "PUT",
        headers: apiHeaders,
        body: JSON.stringify({
          name: editService.name.trim(),
          price: Number(editService.price),
          duration_min: Number(editService.duration_min || 60),
          staff_id: editService.staff_id === "" ? null : Number(editService.staff_id),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Неуспешна редакция");

      setEditServiceOpen(false);
      setEditService(null);
      await loadServices();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteService(id) {
    if (!confirm("Сигурна ли си, че искаш да изтриеш тази услуга?")) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/services/${id}`, {
        method: "DELETE",
        headers: apiHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Неуспешно изтриване");
      await loadServices();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- CALENDAR GRID ----------
  const calendarDays = useMemo(() => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);

    // Monday-first grid
    const startWeekday = (mStart.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    const gridStart = new Date(mStart);
    gridStart.setDate(mStart.getDate() - startWeekday);

    const endWeekday = (mEnd.getDay() + 6) % 7;
    const daysToAdd = 6 - endWeekday;
    const gridEnd = new Date(mEnd);
    gridEnd.setDate(mEnd.getDate() + daysToAdd);

    const days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [month]);

  const bookingsByDay = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      const d = new Date(b.start_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Дашборд</h2>
            <div style={{ opacity: 0.7, marginTop: 6 }}>
              Управление на резервации, услуги и екип
            </div>
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
              <div style={{ fontWeight: 700 }}>Календар + резервации</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => openCreateForDay(selectedDay)}
                  disabled={busy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#111",
                    color: "white",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  Запиши час
                </button>

                <button
                  onClick={loadBookings}
                  disabled={loadingBookings || busy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: loadingBookings || busy ? "not-allowed" : "pointer",
                    opacity: loadingBookings || busy ? 0.7 : 1,
                  }}
                >
                  Обнови
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <button
                  onClick={() => setMonth((m) => addMonths(m, -1))}
                  style={{ border: "1px solid #ddd", background: "white", borderRadius: 12, padding: "8px 10px", cursor: "pointer" }}
                >
                  ←
                </button>

                <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{monthLabel(month)}</div>

                <button
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                  style={{ border: "1px solid #ddd", background: "white", borderRadius: 12, padding: "8px 10px", cursor: "pointer" }}
                >
                  →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {["П", "В", "С", "Ч", "П", "С", "Н"].map((w) => (
                  <div key={w} style={{ fontSize: 12, opacity: 0.7, padding: "0 6px" }}>{w}</div>
                ))}

                {calendarDays.map((d) => {
                  const inMonth = d.getMonth() === month.getMonth();
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                  const count = bookingsByDay.get(key) || 0;
                  const selected = sameDay(d, selectedDay);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(new Date(d))}
                      style={{
                        border: "1px solid #eee",
                        background: selected ? "#111" : "white",
                        color: selected ? "white" : "#111",
                        borderRadius: 14,
                        padding: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        opacity: inMonth ? 1 : 0.45,
                        minHeight: 64,
                      }}
                      title={toDateInput(d)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 12, opacity: selected ? 0.9 : 0.7, marginTop: 4 }}>
                        {count ? `${count} ч.` : "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day list */}
            <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Ден: {new Intl.DateTimeFormat("bg-BG", { dateStyle: "full" }).format(selectedDay)}</div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>
                  {loadingBookings ? "Зареждане..." : `${bookings.length} резервации (включително отменени, ако ги връщаш от API)` }
                </div>
              </div>

              <button
                onClick={() => openCreateForDay(selectedDay)}
                disabled={busy}
                style={{
                  border: "1px solid #ddd",
                  background: "white",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                + Запиши час за този ден
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Начало</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Край</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Услуга</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Клиент</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Телефон</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Статус</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {!loadingBookings && bookings.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: 18, opacity: 0.7 }}>
                        Няма резервации за този ден.
                      </td>
                    </tr>
                  )}

                  {bookings.map((b) => {
                    const cancelled = String(b.status || "").toLowerCase() === "cancelled";

                    return (
                      <tr key={b.id}>
                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                          {formatBG(b.start_at)}
                        </td>
                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                          {formatBG(b.end_at)}
                        </td>

                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                          <div style={{ fontWeight: 700 }}>{b.service_name}</div>
                          <div style={{ opacity: 0.7, fontSize: 12 }}>
                            {Number(b.price).toFixed(2)} лв · {b.duration_min} мин
                          </div>
                        </td>

                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{b.customer_name}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{b.customer_phone}</td>
                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid #ddd",
                              background: cancelled ? "#f7f7f7" : "white",
                              opacity: cancelled ? 0.7 : 1,
                              fontSize: 12,
                            }}
                          >
                            {b.status}
                          </span>
                        </td>

                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => openEditBooking({
                              ...b,
                              // normalize fields for edit modal
                              start_at: toDateTimeLocalValue(b.start_at),
                              end_at: toDateTimeLocalValue(b.end_at),
                            })}
                            disabled={busy}
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px 10px",
                              borderRadius: 12,
                              background: "white",
                              cursor: busy ? "not-allowed" : "pointer",
                              marginRight: 8,
                            }}
                          >
                            Редактирай
                          </button>

                          <button
                            onClick={() => cancelBooking(b.id)}
                            disabled={busy || cancelled}
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px 10px",
                              borderRadius: 12,
                              background: "white",
                              cursor: busy || cancelled ? "not-allowed" : "pointer",
                              opacity: cancelled ? 0.6 : 1,
                            }}
                            title={cancelled ? "Вече е отменена" : "Отмени резервацията"}
                          >
                            {cancelled ? "Отменена" : "Отмени"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Create modal */}
            {createOpen && (
              <Modal title="Запиши час" onClose={() => !busy && setCreateOpen(false)}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <Field label="Услуга">
                    <select
                      value={createForm.serviceId}
                      onChange={(e) => setCreateForm((f) => ({ ...f, serviceId: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    >
                      <option value="">— избери —</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {Number(s.price).toFixed(2)} лв
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Клиент">
                    <input
                      value={createForm.customerName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, customerName: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      placeholder="Име и фамилия"
                    />
                  </Field>

                  <Field label="Телефон">
                    <input
                      value={createForm.customerPhone}
                      onChange={(e) => setCreateForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      placeholder="0888..."
                    />
                  </Field>

                  <Field label="Начало (startAt)">
                    <input
                      type="datetime-local"
                      value={createForm.startAt}
                      onChange={(e) => setCreateForm((f) => ({ ...f, startAt: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Край (endAt) — ръчно">
                    <input
                      type="datetime-local"
                      value={createForm.endAt}
                      onChange={(e) => setCreateForm((f) => ({ ...f, endAt: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setCreateOpen(false)}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer" }}
                  >
                    Отказ
                  </button>
                  <button
                    onClick={createBooking}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "#111", color: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
                  >
                    {busy ? "Записвам..." : "Запиши"}
                  </button>
                </div>
              </Modal>
            )}

            {/* Edit booking modal */}
            {editOpen && editRow && (
              <Modal title={`Редакция на резервация #${editRow.id}`} onClose={() => !busy && setEditOpen(false)}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <Field label="Услуга">
                    <select
                      value={String(editRow.service_id ?? "")}
                      onChange={(e) => setEditRow((r) => ({ ...r, service_id: Number(e.target.value) }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    >
                      <option value="">—</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {Number(s.price).toFixed(2)} лв
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Клиент">
                    <input
                      value={editRow.customer_name || ""}
                      onChange={(e) => setEditRow((r) => ({ ...r, customer_name: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Телефон">
                    <input
                      value={editRow.customer_phone || ""}
                      onChange={(e) => setEditRow((r) => ({ ...r, customer_phone: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Начало (startAt)">
                    <input
                      type="datetime-local"
                      value={editRow.start_at}
                      onChange={(e) => setEditRow((r) => ({ ...r, start_at: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Край (endAt)">
                    <input
                      type="datetime-local"
                      value={editRow.end_at}
                      onChange={(e) => setEditRow((r) => ({ ...r, end_at: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Статус">
                    <select
                      value={editRow.status || "confirmed"}
                      onChange={(e) => setEditRow((r) => ({ ...r, status: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    >
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </Field>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setEditOpen(false)}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer" }}
                  >
                    Отказ
                  </button>
                  <button
                    onClick={saveEditBooking}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "#111", color: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
                  >
                    {busy ? "Запазвам..." : "Запази"}
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
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
              <div style={{ fontWeight: 700 }}>Услуги</div>
              <div style={{ opacity: 0.7 }}>{loadingServices ? "Зареждане..." : `${services.length} бр.`}</div>
            </div>

            <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <form onSubmit={addService} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
                <Field label="Име">
                  <input
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="Маникюр…"
                  />
                </Field>

                <Field label="Цена (лв)">
                  <input
                    type="number"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="50"
                  />
                </Field>

                <Field label="Време (мин)">
                  <input
                    type="number"
                    value={newService.duration_min}
                    onChange={(e) => setNewService((s) => ({ ...s, duration_min: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="60"
                  />
                </Field>

                <Field label="Специалист (по желание)">
                  <select
                    value={newService.staff_id}
                    onChange={(e) => setNewService((s) => ({ ...s, staff_id: e.target.value }))}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
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
                </Field>

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#111",
                    color: "white",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  Добави
                </button>

                <button
                  type="button"
                  onClick={loadServices}
                  disabled={busy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
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
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {!loadingServices && services.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: 18, opacity: 0.7 }}>
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
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => openEditServiceRow(s)}
                          disabled={busy}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px 10px",
                            borderRadius: 12,
                            background: "white",
                            cursor: busy ? "not-allowed" : "pointer",
                            marginRight: 8,
                          }}
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => deleteService(s.id)}
                          disabled={busy}
                          style={{
                            border: "1px solid #ddd",
                            padding: "8px 10px",
                            borderRadius: 12,
                            background: "white",
                            cursor: busy ? "not-allowed" : "pointer",
                          }}
                        >
                          Изтрий
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editServiceOpen && editService && (
              <Modal title={`Редакция на услуга #${editService.id}`} onClose={() => !busy && setEditServiceOpen(false)}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <Field label="Име">
                    <input
                      value={editService.name}
                      onChange={(e) => setEditService((s) => ({ ...s, name: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Цена (лв)">
                    <input
                      type="number"
                      step="0.01"
                      value={editService.price}
                      onChange={(e) => setEditService((s) => ({ ...s, price: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Време (мин)">
                    <input
                      type="number"
                      value={editService.duration_min}
                      onChange={(e) => setEditService((s) => ({ ...s, duration_min: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    />
                  </Field>

                  <Field label="Специалист (по желание)">
                    <select
                      value={String(editService.staff_id ?? "")}
                      onChange={(e) => setEditService((s) => ({ ...s, staff_id: e.target.value }))}
                      style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
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
                  </Field>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setEditServiceOpen(false)}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer" }}
                  >
                    Отказ
                  </button>
                  <button
                    onClick={saveEditService}
                    disabled={busy}
                    style={{ border: "1px solid #ddd", background: "#111", color: "white", borderRadius: 12, padding: "10px 12px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
                  >
                    {busy ? "Запазвам..." : "Запази"}
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* STAFF (as-is) */}
        {tab === "staff" && (
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff", overflow: "hidden" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700 }}>Екип</div>
              <div style={{ opacity: 0.7 }}>{loadingStaff ? "Зареждане..." : `${staff.length} бр.`}</div>
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
                      <td colSpan="4" style={{ padding: 18, opacity: 0.7 }}>Няма добавени специалисти.</td>
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

            <div style={{ padding: 12 }}>
              <button
                onClick={loadStaff}
                disabled={busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                Обнови
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


