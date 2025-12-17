import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import ClientHome from "./ClientHome";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // екраните: "client" | "login" | "register"
  const [screen, setScreen] = useState("client");

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setScreen("client");
  };

  // ако салон е логнат → винаги в дашборда
  if (token) {
    return <Dashboard token={token} logout={handleLogout} />;
  }

  // ако НЕ е логнат → клиентски home или login/register
  if (screen === "login") {
    return (
      <Login
        setToken={(t) => {
          setToken(t);
          localStorage.setItem("token", t);
        }}
        switchToRegister={() => setScreen("register")}
        switchToClient={() => setScreen("client")}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        switchToLogin={() => setScreen("login")}
        switchToClient={() => setScreen("client")}
      />
    );
  }

  // default: client home
  return (
    <ClientHome
      onSalonLoginClick={() => setScreen("login")}
    />
  );
}

export default App;



