import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

const ADMIN_MOBILE = "7013274348";

const TABS = [
  { id: "dm", label: "1:1 Advice ₹19", kind: "booking", match: (b) => b.duration_min === 5 },
  { id: "g15", label: "1:1 Guidance 15m", kind: "booking", match: (b) => b.duration_min === 15 },
  { id: "m40", label: "1:1 Mentorship 40m", kind: "booking", match: (b) => b.duration_min === 40 },
  {
    id: "pack",
    label: "Q&A Pack",
    kind: "order",
    match: (o) => o.course_id === "c-interview-qa-offline",
  },
  {
    id: "interview-support",
    label: "Interview Support",
    kind: "order",
    match: (o) => o.course_id === "c-interview-support",
  },
  {
    id: "other",
    label: "Other enroll",
    kind: "order",
    match: (o) =>
      o.course_id !== "c-interview-qa-offline" && o.course_id !== "c-interview-support",
  },
];

function Row({ children, action }) {
  return (
    <div className="admin-row">
      <div className="admin-row-body">{children}</div>
      <div className="admin-row-action">{action}</div>
    </div>
  );
}

export default function AdminPack() {
  const { token, user, login, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("dm");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const isAdmin = Boolean(token && user?.mobile === ADMIN_MOBILE);
  const active = TABS.find((t) => t.id === tab) || TABS[0];

  const counts = useMemo(() => {
    const c = {};
    for (const t of TABS) {
      c[t.id] =
        t.kind === "booking"
          ? bookings.filter(t.match).length
          : orders.filter(t.match).length;
    }
    return c;
  }, [orders, bookings]);

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
      setMsg(
        data.course_id === "c-interview-qa-offline" || data.course_id === "c-interview-support"
          ? `ZIPs emailed to ${data.email}`
          : `Payment confirmed for ${data.email}`
      );
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
      setMsg(
        data.duration_min === 5
          ? `Advice confirmed — reply on WhatsApp (${data.mobile})`
          : `Zoom emailed to ${data.email}`
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function clearAll() {
    if (!window.confirm("Delete ALL bookings, enrollments, and carts? This cannot be undone.")) return;
    setBusy("reset");
    setMsg("");
    setError("");
    try {
      const data = await apiFetch("/api/commerce/admin/reset-data", { token, method: "POST", body: {} });
      setMsg(
        `Cleared · bookings ${data.deleted?.bookings || 0} · orders ${data.deleted?.orders || 0} · carts ${data.deleted?.carts || 0}`
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  const list =
    active.kind === "booking" ? bookings.filter(active.match) : orders.filter(active.match);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 920 }}>
        <h1 className="page-title">Admin dashboard</h1>
        <p className="page-sub">One tab = one service. Approve only what’s in that tab.</p>
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
            <div className="chip-row" style={{ margin: "12px 0", flexWrap: "wrap" }}>
              <span className="chip">Admin {user.mobile}</span>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Log out
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => load().catch((e) => setError(e.message))}
              >
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy === "reset"}
                onClick={clearAll}
              >
                {busy === "reset" ? "Clearing..." : "Clear all data"}
              </button>
            </div>
            {msg ? <div className="flash ok">{msg}</div> : null}
            {error ? <div className="flash error">{error}</div> : null}

            <div className="admin-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`admin-tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  <span className="admin-tab-count">{counts[t.id] || 0}</span>
                </button>
              ))}
            </div>

            <div className="panel admin-panel">
              <p className="admin-panel-hint">
                {tab === "dm" && "Approve ₹19 Priority DM after WhatsApp proof — then reply on WhatsApp."}
                {tab === "g15" && "Accept 15‑min call → Zoom link emailed to student."}
                {tab === "m40" && "Accept 40‑min mentorship → Zoom link emailed to student."}
                {tab === "pack" && "Approve Q&A pack → ZIP emailed to student."}
                {tab === "interview-support" &&
                  "Approve Interview Support → two ZIPs with the 45-Day plan and all 15 Q&A modules emailed to the student."}
                {tab === "other" && "Confirm payment for AWS / Job enrollments."}
              </p>

              {!list.length ? <p className="muted">Nothing in this tab yet.</p> : null}

              {active.kind === "booking"
                ? list.map((b) => {
                    const done = b.status === "confirmed";
                    return (
                      <Row
                        key={b.id}
                        action={
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={done || busy === b.id}
                            onClick={() => approveBooking(b.id)}
                          >
                            {done
                              ? "Done"
                              : busy === b.id
                                ? "..."
                                : b.duration_min === 5
                                  ? "Confirm DM"
                                  : "Send Zoom"}
                          </button>
                        }
                      >
                        <strong>
                          {b.buyer_name} · ₹{b.price_inr}
                        </strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {b.mobile} · {b.email} · {b.status}
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {b.duration_min === 5
                            ? "Priority DM · reply after confirm"
                            : `${b.duration_min} min Zoom · ${String(b.slot_start).replace("T", " ")}`}
                        </div>
                        {b.meeting_link && b.meeting_link !== "dm-advice" ? (
                          <a href={b.meeting_link} target="_blank" rel="noreferrer" className="text-link">
                            Open Zoom
                          </a>
                        ) : null}
                      </Row>
                    );
                  })
                : list.map((o) => {
                    const title = o.items?.[0]?.title || o.course_id || "Enrollment";
                    const isPack = o.course_id === "c-interview-qa-offline";
                    const isInterviewSupport = o.course_id === "c-interview-support";
                    const sendsZip = isPack || isInterviewSupport;
                    const done =
                      o.status === "delivered" ||
                      (o.status === "confirmed" && !isInterviewSupport);
                    return (
                      <Row
                        key={o.id}
                        action={
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={done || busy === o.id}
                            onClick={() => approve(o.id)}
                          >
                            {done
                              ? sendsZip
                                ? "ZIPs sent"
                                : "Confirmed"
                              : busy === o.id
                                ? "..."
                                : sendsZip
                                  ? "Email ZIPs"
                                  : "Confirm pay"}
                          </button>
                        }
                      >
                        <strong>
                          {title} · ₹{o.total_inr}
                        </strong>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {o.buyer_name} · {o.email} · {o.status}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {o.id} · {o.created_at}
                        </div>
                      </Row>
                    );
                  })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
