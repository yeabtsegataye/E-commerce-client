import React from "react";
import "./login.css";
// import { Link } from "react-router-dom";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link } from "react-router-dom";
// import { UseAuthContext } from "../hooks/useAuthContext";
// import { useValidator } from "../hooks/useValidator";
function Login() {
  // const { verifiy } = useValidator();

  // const { user } = UseAuthContext();
  const { isLoading, error, login } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const navigate = useNavigate();

  const handle_submit = async (e) => {
    console.log(email, password);
    e.preventDefault();
    await login(email, password);
    // if (user) {
    //   verifiy();
    //   // navigate('/profile')
    // }
  };
  return (
    <React.Fragment>
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
              <h1>Welcome back</h1>
              <p>Login to continue shopping your favorites.</p>
            </div>

            <form className="auth-form" onSubmit={handle_submit}>
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

              <label className="auth-label">
                Password
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <Link to="/forgot-password" style={{ color: "#667085", fontWeight: 800, textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Login;
