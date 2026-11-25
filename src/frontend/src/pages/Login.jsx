import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import GoogleGlyph from "../components/GoogleGlyph";
import Logo from "../components/Logo";

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);

  if (token && !entering) return <Navigate to={safeNext || "/courses"} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const id = identifier.trim();
    let body;
    if (id.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
        setError("Enter a valid email address");
        return;
      }
      body = { email: id.toLowerCase(), password };
    } else {
      const phone = id.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      if (phone.length !== 10) {
        setError("Enter a valid 10-digit mobile number or your email");
        return;
      }
      body = { mobile: phone, password };
    }
    setLoading(true);
    try {
      await login(body);
      setEntering(true);
      navigate(safeNext || "/welcome?from=login", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function onGoogle() {
    setInfo("Google sign-in is coming soon. Please use your mobile number or email for now.");
  }

  return (
    <div className="container auth-wrap">
      <div className="auth-card reveal">
        <div className="auth-head">
          <Logo size={60} className="auth-logo" />
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your DevOpsMate account</p>
        </div>

        {error ? <div className="flash error">{error}</div> : null}
        {info ? <div className="flash ok">{info}</div> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <div className="form-group">
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Mobile number or email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-label="Mobile number or email"
              required
            />
          </div>
          <div className="form-group">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              aria-label="Password"
              required
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <div className="auth-or">or</div>

        <button type="button" className="btn btn-google btn-lg btn-block" onClick={onGoogle}>
          <GoogleGlyph />
          Continue with Google
        </button>

        <p className="auth-switch">
          New to DevOpsMate?{" "}
          <Link to={safeNext ? `/signup?next=${encodeURIComponent(safeNext)}` : "/signup"}>
            Create an account
          </Link>
        </p>
        <p className="auth-fine">
          Trouble logging in? <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a>
          <br />
          By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
