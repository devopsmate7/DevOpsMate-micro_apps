import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

const ADMIN_MOBILE = "7013274348";

export default function AdminPack() {
  const { token, user, login, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const isAdmin = Boolean(token && user?.mobile === ADMIN_MOBILE);

  async function load() {
    setError("");
    const [packData, bookingData] = await Promise.all([
      apiFetch("/api/commerce/admin/pack-orders", { token }),
      apiFetch("/api/commerce/admin/bookings", { token }),
    ]);
    setOrders(Array.isArray(packData) ? packData : []);
    setBookings(Array.isArray(bookingData) ? bookingData : []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load().catch((e) => setError(e.message));
  }, [isAdmin, token]);

  async function onLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    setError("");
    setMsg("");
    try {
      const form = new FormData(e.target);
      await login({
        mobile: String(form.get("mobile") || "").trim(),
        password: String(form.get("password") || ""),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoginBusy(false);
    }
  }

  async function approve(orderId) {
    setBusy(orderId);
    setMsg("");
    setError("");
    try {
      const data = await apiFetch(`/api/commerce/admin/pack-orders/${orderId}/approve`, {
        token,
        method: "POST",
        body: {},
      });
      setMsg(`Approved ${orderId}. ZIP emailed to ${data.email}.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function approveBooking(bookingId) {
    setBusy(bookingId);
    setMsg("");
    setError("");
    try {
      const data = await apiFetch(`/api/commerce/admin/bookings/${bookingId}/approve`, {
        token,
        method: "POST",
        body: {},
      });
      setMsg(`Accepted ${bookingId}. Zoom emailed to ${data.email}.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        <h1 className="page-title">Admin · Pack & 1:1 bookings</h1>
        <p className="page-sub">
          Approve offline pack ZIPs, and review 1:1 Connect bookings (Zoom already emailed to the user).
        </p>
        <p>
          <Link to="/" className="text-link">
            Back to site
          </Link>
        </p>

        {!isAdmin ? (
          <form className="panel" onSubmit={onLogin} style={{ marginTop: 16 }}>
            <p className="muted" style={{ fontSize: 14 }}>
              Admin login (mobile + password)
            </p>
            <label style={{ display: "block", marginTop: 10 }}>
              Mobile
              <input
                name="mobile"
                defaultValue={ADMIN_MOBILE}
                required
                inputMode="numeric"
                style={{ width: "100%", marginTop: 6 }}
              />
            </label>
            <label style={{ display: "block", marginTop: 10 }}>
              Password
              <input name="password" type="password" required style={{ width: "100%", marginTop: 6 }} />
            </label>
            {error ? <div className="flash error">{error}</div> : null}
            <button type="submit" className="btn btn-secondary" style={{ marginTop: 12 }} disabled={loginBusy}>
              {loginBusy ? "Signing in..." : "Admin login"}
            </button>
          </form>
        ) : (
          <>
            <div className="chip-row" style={{ margin: "12px 0" }}>
              <span className="chip">Admin {user.mobile}</span>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Log out
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => load().catch((e) => setError(e.message))}>
                Refresh
              </button>
            </div>
            {msg ? <div className="flash ok">{msg}</div> : null}
            {error ? <div className="flash error">{error}</div> : null}
            <h2 className="panel-title" style={{ marginTop: 20 }}>
              Offline pack orders
            </h2>
            <div className="panel">
              {!orders.length ? <p className="muted">No pack orders yet.</p> : null}
              {orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    borderBottom: "1px solid var(--line, #ddd)",
                    padding: "12px 0",
                  }}
                >
                  <div>
                    <strong>{o.id}</strong>
                    <div className="muted" style={{ fontSize: 14 }}>
                      {o.buyer_name} · {o.email} · ₹{o.total_inr} · {o.status}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {o.created_at}
                      {o.delivered_at ? ` · delivered ${o.delivered_at}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={o.status === "delivered" || busy === o.id}
                    onClick={() => approve(o.id)}
                  >
                    {o.status === "delivered" ? "Delivered" : busy === o.id ? "Sending..." : "Approve & email ZIP"}
                  </button>
                </div>
              ))}
            </div>

            <h2 className="panel-title" style={{ marginTop: 28 }}>
              1:1 Connect bookings
            </h2>
            <div className="panel">
              {!bookings.length ? <p className="muted">No 1:1 bookings yet.</p> : null}
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    borderBottom: "1px solid var(--line, #ddd)",
                    padding: "12px 0",
                  }}
                >
                  <div>
                    <strong>{b.id}</strong>
                    <div className="muted" style={{ fontSize: 14 }}>
                      {b.buyer_name} · {b.mobile} · {b.email} · {b.status}
                    </div>
                    <div className="muted" style={{ fontSize: 14 }}>
                      {b.duration_min} min{b.priority ? " priority" : ""} · ₹{b.price_inr} ·{" "}
                      {String(b.slot_start).replace("T", " ")}
                    </div>
                    {b.meeting_link ? (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="text-link">
                        Zoom link
                      </a>
                    ) : (
                      <span className="muted" style={{ fontSize: 13 }}>
                        Zoom after accept
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={b.status === "confirmed" || busy === b.id}
                    onClick={() => approveBooking(b.id)}
                  >
                    {b.status === "confirmed"
                      ? "Accepted"
                      : busy === b.id
                        ? "Creating Zoom..."
                        : "Accept & email Zoom"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
