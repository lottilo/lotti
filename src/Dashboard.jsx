import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
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

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "Потвърдена";
  if (s === "cancelled") return "Отменена";
  return status || "—";
}

function isCancelled(status) {
  return String(status || "").toLowerCase() === "cancelled";
}

export default function Dashboard({ token, logout }) {
  const [tab, setTab] = useState("bookings"); // "bookings" | "services" | "staff"

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration_min: 60,
    staff_id: "", // "" => null (целият салон)
  });

  const [newStaff, setNewStaff] = useState({
    full_name: "",
    role: "manicurist",
    phone: "",
  });

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [error, setError] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // “финес”: не блокираме целия таб, а само реда, който се отменя
  const [busyBookingId, setBusyBookingId] = useState(null);

  // “финес”: toggle за показване на отменени
  const [showCancelled, setShowCancelled] = useState(false);

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
  }, [from, to]);

  async function readJsonSafe(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function loadServices() {
    setLoadingServices(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/my/services`, { headers: apiHeaders });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на услуги");
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Грешка");
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
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на резервации");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Грешка");
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
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при зареждане на екип");
      setStaff(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Грешка");
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

  // reload bookings when filter changes
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
      const payload = {
        name: String(newService.name || "").trim(),
        price: Number(newService.price),
        duration_min: Number(newService.duration_min || 60),
        staff_id: newService.staff_id === "" ? null : Number(newService.staff_id),
      };

      const res = await fetch(`${API_BASE}/my/services`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при добавяне на услуга");

      setNewService({ name: "", price: "", duration_min: 60, staff_id: "" });
      await loadServices();
      setTab("services");
    } catch (e) {
      setError(e.message || "Грешка");
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
          full_name: String(newStaff.full_name || "").trim(),
          role: newStaff.role,
          phone: newStaff.phone ? String(newStaff.phone).trim() : null,
        }),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Грешка при добавяне на специалист");

      setNewStaff({ full_name: "", role: "manicurist", phone: "" });
      await loadStaff();
      setTab("staff");
    } catch (e) {
      setError(e.message || "Грешка");
    }
  }

  async function cancelBooking(bookingId) {
    if (busyBookingId != null) return;

    const ok = confirm("Сигурна ли си, че искаш да отмениш тази резервация?");
    if (!ok) return;

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

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.message || "Неуспешно отказване");

      // “финес”: оптимистично обновяване + после реално reload
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: "cancelled", cancelled_reason: reason || null }
            : b
        )
      );

      // взимаме истината от DB
      await loadBookings();
    } catch (e) {
      setError(e.message || "Грешка");
    } finally {
      setBusyBookingId(null);
    }
  }

  const visibleBookings = useMemo(() => {
    if (showCancelled) return bookings;
    return bookings.filter((b) => !isCancelled(b.status));
  }, [bookings, showCancelled]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
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

        {/* TABS */}
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

        {/* ERROR */}
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
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
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
              <div style={{ fontWeight: 600 }}>Резервации</div>
              <div style={{ opacity: 0.7 }}>
                {loadingBookings ? "Зареждане..." : `${visibleBookings.length} бр.`}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "end",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                    От дата
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                    До дата
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                  />
                </div>

                <button
                  onClick={loadBookings}
                  disabled={loadingBookings || busyBookingId != null}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: loadingBookings || busyBookingId != null ? "not-allowed" : "pointer",
                    opacity: loadingBookings || busyBookingId != null ? 0.7 : 1,
                  }}
                >
                  Обнови
                </button>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                />
                <span style={{ fontSize: 13, opacity: 0.8 }}>Покажи отменените</span>
              </label>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Дата/час</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Услуга</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Клиент</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Телефон</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Статус</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {!loadingBookings && visibleBookings.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: 18, opacity: 0.7 }}>
                        Няма резервации за избрания период.
                      </td>
                    </tr>
                  )}

                  {visibleBookings.map((b) => {
                    const cancelled = isCancelled(b.status);
                    const isBusy = busyBookingId === b.id;

                    return (
                      <tr key={b.id} style={{ opacity: cancelled ? 0.65 : 1 }}>
                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" }}>
                          {formatBG(b.start_at)}
                        </td>

                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                          <div style={{ fontWeight: 600 }}>{b.service_name}</div>
                          <div style={{ opacity: 0.7, fontSize: 12 }}>
                            {b.duration_min} мин · {Number(b.price).toFixed(2)} лв
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
                              fontSize: 12,
                            }}
                          >
                            {statusLabel(b.status)}
                          </span>
                        </td>

                        <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                          <button
                            onClick={() => cancelBooking(b.id)}
                            disabled={cancelled || loadingBookings || (busyBookingId != null && !isBusy)}
                            style={{
                              border: "1px solid #ddd",
                              padding: "8px 10px",
                              borderRadius: 12,
                              background: "white",
                              cursor: cancelled ? "not-allowed" : "pointer",
                              opacity: cancelled ? 0.5 : 1,
                              whiteSpace: "nowrap",
                            }}
                            title={cancelled ? "Вече е отменена" : "Отмени резервацията"}
                          >
                            {isBusy ? "Отказвам..." : cancelled ? "Отменена" : "Отмени"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICES */}
        {tab === "services" && (
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600 }}>Услуги</div>
              <div style={{ opacity: 0.7 }}>
                {loadingServices ? "Зареждане..." : `${services.length} бр.`}
              </div>
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
                  <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                    Специалист (по желание)
                  </label>
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
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                        {Number(s.price).toFixed(2)} лв
                      </td>
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
            </div>
          </div>
        )}

        {/* STAFF */}
        {tab === "staff" && (
          <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600 }}>Екип</div>
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
                      <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                        {st.is_active ? "Активен" : "Неактивен"}
                      </td>
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


