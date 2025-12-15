import { useState } from "react";

function Register({ setToken }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Грешка при регистрация");
      } else {
        setSuccess("Регистрацията е успешна! Може да се логнете.");
        // Ако искаш автоматично login след регистрация:
        // const loginRes = await fetch(...); setToken(token)
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-form">
      <h2>Регистрация на салон</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Име на салона" value={form.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Имейл" value={form.email} onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Телефон" value={form.phone} onChange={handleChange} />
        <input type="password" name="password" placeholder="Парола" value={form.password} onChange={handleChange} required />
        <button type="submit">Регистрация</button>
      </form>
    </div>
  );
}

export default Register;
