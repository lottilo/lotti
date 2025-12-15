import { useEffect, useState } from "react";

function Dashboard({ token, logout }) {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState(null);

  const apiHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Зареждане на услуги
  useEffect(() => {
    fetch("https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/services", { headers: apiHeaders })
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoadingServices(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingServices(false);
      });
  }, []);

  // Зареждане на резервации
  useEffect(() => {
    fetch("lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/bookings", { headers: apiHeaders })
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoadingBookings(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingBookings(false);
      });
  }, []);

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;
    fetch("http://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/my/services", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(newService),
    })
      .then(res => res.json())
      .then(data => {
        setServices(prev => [...prev, { ...newService, id: Date.now() }]);
        setNewService({ name: "", price: "" });
      })
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={logout} style={{ float: "right" }}>Лог-аут</button>
      <h2>Услуги</h2>
      {loadingServices ? <p>Зареждане на услуги...</p> :
        <ul>
          {services.map(s => (
            <li key={s.id}>{s.name} - {s.price} лв</li>
          ))}
        </ul>
      }

      <h3>Добави нова услуга</h3>
      <input
        placeholder="Име на услугата"
        value={newService.name}
        onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))}
      />
      <input
        placeholder="Цена"
        value={newService.price}
        onChange={e => setNewService(prev => ({ ...prev, price: e.target.value }))}
      />
      <button onClick={handleAddService}>Добави</button>

      <h2>Резервации</h2>
      {loadingBookings ? <p>Зареждане на резервации...</p> :
        <ul>
          {bookings.map(b => (
            <li key={b.id}>
              {b.customer_name} - {b.service_name} - {new Date(b.booking_date).toLocaleString()}
            </li>
          ))}
        </ul>
      }

      {error && <p style={{ color: "red" }}>Грешка: {error}</p>}
    </div>
  );
}

export default Dashboard;
