import { useState } from "react";

function Register({ setToken, switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Грешка при регистрацията");
      } else {
        alert("Регистрацията е успешна! Може да се логнете.");
        switchToLogin(); // връщаме към Login
      }

    } catch (err) {
      console.error(err);
      setError("Грешка при връзката със сървъра");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>Регистрация на салон</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Име на салона"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Имейл"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Телефон"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Парола"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Регистрация..." : "Регистрирай салон"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p>
        Вече имате акаунт? <span style={{ color: "blue", cursor: "pointer" }} onClick={switchToLogin}>Влезте тук</span>
      </p>
    </div>
  );
}

export default Register;
