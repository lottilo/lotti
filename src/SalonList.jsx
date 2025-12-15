import { useEffect, useState } from "react";
import "./SalonList.css";

function SalonList() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch salons");
        return res.json();
      })
      .then(data => {
        setSalons(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">Зареждане на салоните...</p>;
  if (error) return <p className="error">Грешка: {error}</p>;

  return (
    <div className="salon-list">
      {salons.map(salon => (
        <div className="salon-card" key={salon.id}>
          <h2>{salon.name}</h2>
          <p>Имейл: {salon.email}</p>
          <p>Телефон: {salon.phone}</p>
          <button className="details-btn">Виж детайли</button>
        </div>
      ))}
    </div>
  );
}

export default SalonList;
