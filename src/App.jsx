import { useState } from "react";
import SalonList from "./SalonList";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  if (!token) {
    return (
      <div>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>Панел за салоните</h1>
        <Login setToken={(t) => { setToken(t); localStorage.setItem("token", t); }} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ textAlign: "center", marginTop: "20px" }}>Панел за салоните</h1>
      <Dashboard token={token} logout={handleLogout} />
    </div>
  );
}

export default App;
