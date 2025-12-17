import { useState } from "react";

function Login({ setToken, switchToRegister, switchToClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(
        "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при логин");

      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Вход за салони</h2>
        <p className="text-sm text-neutral-500 mt-1">Влез, за да управляваш услуги и резервации.</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border px-4 py-3"
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border px-4 py-3"
            type="password"
            placeholder="Парола"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full rounded-xl bg-black text-white py-3">
            Влез
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button className="underline text-neutral-700" onClick={switchToClient} type="button">
            ← Назад към Lotti
          </button>

          <button className="underline text-neutral-700" onClick={switchToRegister} type="button">
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
