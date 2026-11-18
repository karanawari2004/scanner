import { useState } from "react";
import "./Login.css";

const LOGIN_PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD;

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!LOGIN_PASSWORD) {
      setError("Login configuration is missing.");
      return;
    }

    setLoading(true);

    if (password === LOGIN_PASSWORD) {
      setPassword("");
      onLogin();
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }

    setLoading(false);
  };

  return (
    <div className="password-overlay">
      <div className="password-popup">

        <div className="password-icon">
          <span>🔐</span>
        </div>

        <h2>Welcome Back</h2>

        <p className="popup-subtitle">
          Enter your password to access RizzScan.
        </p>

        <form onSubmit={handleLogin}>

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className="password-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="password-submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Unlock Access"}
          </button>

        </form>

        <div className="popup-footer">
          Secure Access · RizzScan
        </div>

      </div>
    </div>
  );
}

export default Login;