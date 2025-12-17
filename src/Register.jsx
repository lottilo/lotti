import { useState } from "react";

function Register({ switchToLogin, switchToClient }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
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
      const res = await fetch(
        "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Грешка при регистрацията");
      } else {
        alert("Регистрацията е успешна! Може да се логнете.");
        switchToLogin();
      }
    } catch (err) {
      console.error(err);
      setError("Грешка при връзката със сървъра");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Регистрация на салон</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Създай акаунт, за да добавяш услуги и да приемаш резервации.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border px-4 py-3"
            type="text"
            name="name"
            placeholder="Име на салона"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="email"
            name="email"
            placeholder="Имейл"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="text"
            name="phone"
            placeholder="Телефон (по желание)"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="password"
            name="password"
            placeholder="Парола"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 disabled:opacity-60"
          >
            {loading ? "Регистрация..." : "Регистрирай салон"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button className="underline text-neutral-700" onClick={switchToClient} type="button">
            ← Назад към Lotti
          </button>

          <button className="underline text-neutral-700" onClick={switchToLogin} type="button">
            Вход
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
