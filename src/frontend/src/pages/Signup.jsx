import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import GoogleGlyph from "../components/GoogleGlyph";
import Logo from "../components/Logo";

export default function Signup() {
  const { signup, token } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <Navigate to={safeNext || "/welcome"} replace />;
  if (token && !loading) return <Navigate to={safeNext || "/courses"} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const phone = mobile.replace(/\D/g, "");
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      await signup({ full_name: fullName, email, password, mobile: phone, city: "India" });
      setDone(true);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function onGoogle() {
    setInfo("Google sign-in is coming soon. Please sign up with email for now.");
  }

  return (
    <div className="container auth-wrap">
      <div className="auth-card reveal">
        <div className="auth-head">
          <Logo size={60} className="auth-logo" />
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-sub">Register to view programs and submit an enrollment</p>
        </div>

        {error ? <div className="flash error">{error}</div> : null}
        {info ? <div className="flash ok">{info}</div> : null}

        <form className="form-grid" onSubmit={onSubmit}>
          <div className="form-group">
            <input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              aria-label="Full name"
              minLength={3}
              required
            />
          </div>
          <div className="form-group">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              aria-label="Email address"
              required
            />
          </div>
          <div className="form-group">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 8 characters)"
              autoComplete="new-password"
              aria-label="Password"
              minLength={8}
              required
            />
          </div>
          <div className="form-group">
            <div className="phone-field">
              <span className="phone-code">+91</span>
              <input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="Mobile number"
                aria-label="Mobile number"
                inputMode="numeric"
                autoComplete="tel-national"
                required
              />
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-or">or</div>

        <button type="button" className="btn btn-google btn-lg btn-block" onClick={onGoogle}>
          <GoogleGlyph />
          Continue with Google
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <p className="auth-fine">
          Need help? <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a>
          <br />
          By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
