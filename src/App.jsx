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
    return showRegister ? (
      <Register
        switchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        setToken={(t) => { setToken(t); localStorage.setItem("token", t); }}
        switchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return <Dashboard token={token} logout={handleLogout} />;
}

export default App;


