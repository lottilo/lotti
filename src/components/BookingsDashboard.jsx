import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function formatBG(dt) {
  const d = new Date(dt);
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function BookingsDashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }, [from, to]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api(`/my/bookings${query}`, { auth: true });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Грешка при зареждане");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginBottom: 16
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Резервации</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.7 }}>
            Преглед на записаните часове за твоя салон
          </p>
        </div>

        <button
          onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}
          style={{
            border: "1px solid #ddd", padding: "10px 12px", borderRadius: 12,
            background: "white", cursor: "pointer"
          }}
        >
          Изход
        </button>
      </div>

      <div style={{
        display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap",
        padding: 14, border: "1px solid #eee", borderRadius: 16, background: "#fff",
        marginBottom: 14
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            От дата
          </label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            До дата
          </label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }} />
        </div>

        <button onClick={load}
          style={{
            padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd",
            background: "white", cursor: "pointer"
          }}
        >
          Обнови
        </button>
      </div>

      {err && (
        <div style={{
          padding: 12, border: "1px solid #f2c6c6", background: "#fff5f5",
          borderRadius: 12, marginBottom: 12
        }}>
          {err}
        </div>
      )}

      <div style={{
        border: "1px solid #eee", borderRadius: 16, overflow: "hidden", background: "#fff"
      }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 600 }}>Списък</div>
          <div style={{ opacity: 0.7 }}>{loading ? "Зареждане..." : `${rows.length} резервации`}</div>
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
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {formatBG(r.start_at)}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    <div style={{ fontWeight: 600 }}>{r.service_name}</div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>
                      {r.duration_min} мин · {Number(r.price).toFixed(2)} лв
                    </div>
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {r.customer_name}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {r.customer_phone}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #f2f2f2" }}>
                    {r.status}
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 18, opacity: 0.7 }}>
                    Няма резервации за избрания период.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
