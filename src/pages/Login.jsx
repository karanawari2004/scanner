import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      username.trim() === import.meta.env.VITE_LOGIN_USERNAME &&
      password === import.meta.env.VITE_LOGIN_PASSWORD
    ) {
      sessionStorage.setItem("rizzscan_authenticated", "true");
      navigate("/scanInfo");
    } else {
      setError("Invalid username or password");
    }
  };

  const [error, setError] = useState("");

  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
        <h2>RizzScan Login</h2>

        <input
          type="text"
          placeholder="Enter Username"
          aria-label="Username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          placeholder="Enter Password"
          aria-label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;