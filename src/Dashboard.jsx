import { useEffect, useMemo, useState } from "react";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function Dashboard({ token, logout }) {
  const [tab, setTab] = useState("bookings"); // "bookings" | "services"

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [newService, setNewService] = useState({ name: "", price: "", duration_min: 60 });

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const apiHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const bookingsUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    return `https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/bookings${qs ? `?${qs}` : ""}`;
  }, [from, to]);

  // Load services
  async function loadServices() {
    setLoadingServices(true);
    setError(null);
    try {
      const res = await fetch(
        "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/services",
        { headers: apiHeaders }
      );
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }

  // Load bookings
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

  // Initial load: both
  useEffect(() => {
    loadServices();
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload bookings when filters change
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
      const res = await fetch(
        "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/services",
        {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            name: newService.name,
            price: Number(newService.price),
            duration_min: Number(newService.duration_min || 60),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при добавяне на услуга");

      setNewService({ name: "", price: "", duration_min: 60 });
      await loadServices();
      setTab("services");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
     <div className="min-h-screen bg-neutral-50">
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Дашборд</h2>
          <div style={{ opacity: 0.7, marginTop: 6 }}>Управление на услуги и резервации</div>
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

      <div style={{ display: "flex", gap: 8, marginTop: 14, marginBottom: 14 }}>
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

      {tab === "bookings" && (
        <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>Резервации</div>
            <div style={{ opacity: 0.7 }}>{loadingBookings ? "Зареждане..." : `${bookings.length} бр.`}</div>
          </div>

          <div style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>От дата</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>До дата</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
              />
            </div>

            <button
              onClick={loadBookings}
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
                </tr>
              </thead>
              <tbody>
                {!loadingBookings && bookings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: 18, opacity: 0.7 }}>
                      Няма резервации за избрания период.
                    </td>
                  </tr>
                )}

                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{formatBG(b.start_at)}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                      <div style={{ fontWeight: 600 }}>{b.service_name}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>
                        {b.duration_min} мин · {Number(b.price).toFixed(2)} лв
                      </div>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{b.customer_name}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{b.customer_phone}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div style={{ border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 600 }}>Услуги</div>
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
                </tr>
              </thead>
              <tbody>
                {!loadingServices && services.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: 18, opacity: 0.7 }}>
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
                    <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                      {(s.duration_min ?? 60)} мин
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
