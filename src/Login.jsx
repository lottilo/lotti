import { useState } from "react";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net/providers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Грешка при логин");

      setToken(data.token); // записваме токена в родителски компонент или localStorage
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-form">
      <h2>Вход за салона</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Имейл" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Парола" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Влез</button>
      </form>
    </div>
  );
}

export default Login;
