import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  if (!token) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <h1>Панел за салоните</h1>

        {showRegister ? (
          <Register setToken={setToken} />
        ) : (
          <Login setToken={(t) => { setToken(t); localStorage.setItem("token", t); }} />
        )}

        <button 
          onClick={() => setShowRegister(!showRegister)} 
          style={{ marginTop: "10px" }}
        >
          {showRegister ? "Вход" : "Регистрация"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>Панел за салоните</h1>
      <Dashboard token={token} logout={handleLogout} />
    </div>
  );
}

export default App;

