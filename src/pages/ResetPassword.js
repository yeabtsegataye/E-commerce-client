import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./login.css";

export default function ResetPassword() {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const disabled = useMemo(() => {
    if (!token) return true;
    if (!password || password.length < 10) return true;
    if (password !== confirm) return true;
    return false;
  }, [token, password, confirm]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ip/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Reset failed");
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
            <h1>Choose a new password</h1>
            <p>Use at least 10 characters. Don’t reuse old passwords.</p>
          </div>

          {done ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="auth-error" style={{ background: "rgba(46, 204, 113, 0.12)", borderColor: "rgba(46, 204, 113, 0.25)", color: "#1f8b4c" }}>
                Password updated. You can now log in.
              </div>
              <Link className="auth-submit" to="/login" style={{ textAlign: "center", textDecoration: "none" }}>
                Go to login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              {!token && (
                <div className="auth-error">
                  Missing reset token. Please request a new reset link.
                </div>
              )}

              <label className="auth-label">
                New password
                <input
                  className="auth-input"
                  type="password"
                  placeholder="At least 10 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <label className="auth-label">
                Confirm password
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Repeat password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={loading || disabled}>
                {loading ? "Updating..." : "Update password"}
              </button>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/login" style={{ color: "#667085", fontWeight: 800, textDecoration: "none" }}>
                  Back to login
                </Link>
                <Link to="/forgot-password" style={{ color: "#667085", fontWeight: 800, textDecoration: "none" }}>
                  Request new link
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

