import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";

export default function ForgotPassword() {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ip/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div
          className="auth-media"
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255, 90, 0, 0.10), rgba(255, 61, 127, 0.10)), url(${process.env.PUBLIC_URL}/loginIMG.png)`,
          }}
        ></div>
        <div className="auth-form-wrap">
          <div className="auth-header">
            <div className="auth-brand">
              <i className="fa-solid fa-spa" aria-hidden="true"></i>
              <span>MK_cosmo</span>
            </div>
            <h1>Reset your password</h1>
            <p>
              Enter your email and we’ll send a secure link (expires soon).
            </p>
          </div>

          {done ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="auth-error" style={{ background: "rgba(46, 204, 113, 0.12)", borderColor: "rgba(46, 204, 113, 0.25)", color: "#1f8b4c" }}>
                If an account exists for that email, a reset link has been sent.
              </div>
              <Link className="auth-submit" to="/login" style={{ textAlign: "center", textDecoration: "none" }}>
                Back to login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <Link to="/login" style={{ color: "#667085", fontWeight: 800, textDecoration: "none" }}>
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

