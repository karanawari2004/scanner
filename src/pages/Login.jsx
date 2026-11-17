
import { useState } from "react";
import "./Login.css";

const AUTH_KEY = "rizzscan_authenticated";
const LOGIN_USERNAME = import.meta.env.VITE_LOGIN_USERNAME;
const LOGIN_PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD;

const setAuthenticated = (value) => {
  const authValue = value ? "true" : "false";
  sessionStorage.setItem(AUTH_KEY, authValue);
  localStorage.setItem(AUTH_KEY, authValue);
};

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!LOGIN_USERNAME || !LOGIN_PASSWORD) {
      setError("Login configuration is missing.");
      return;
    }

    setLoading(true);

    if (
      username.trim() === LOGIN_USERNAME.trim() &&
      password === LOGIN_PASSWORD
    ) {
      setAuthenticated(true);
      window.location.replace("/scanInfo");
    } else {
      setAuthenticated(false);
      setError("Invalid username or password");
      setLoading(false);
    }
  };

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

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
