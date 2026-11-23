import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function statusLabel(status) {
  if (status === "awaiting_approval") return "awaiting approval";
  return status;
}

export default function Profile() {
  const { token, user, updateProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", mobile: "", city: "" });
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ full_name: user.full_name || "", mobile: user.mobile || "", city: user.city || "" });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch("/api/commerce/orders", { token }).catch(() => []),
      apiFetch("/api/commerce/my/bookings", { token }).catch(() => []),
    ]).then(([o, b]) => {
      setOrders(Array.isArray(o) ? o : []);
      setBookings(Array.isArray(b) ? b : []);
    });
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  async function onSave(e) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    try {
      await updateProfile({ full_name: form.full_name, city: form.city });
      setMsg("Profile saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const recent = [
    ...bookings.map((b) => ({
      key: b.id,
      title: `1:1 Connect · ${b.duration_min} min${b.priority ? " priority" : ""}`,
      date: String(b.slot_start || "").replace("T", " ").slice(0, 16),
      status: b.status,
      link: b.status === "confirmed" ? b.meeting_link : null,
      sort: b.created_at || b.slot_start || "",
    })),
    ...orders.map((o) => ({
      key: o.id,
      title: o.items.map((i) => i.title).join(", "),
      date: new Date(o.created_at).toLocaleDateString(),
      status: o.status,
      link: null,
      sort: o.created_at || "",
    })),
  ]
    .sort((a, b) => String(b.sort).localeCompare(String(a.sort)))
    .slice(0, 6);

  return (
    <div className="page">
      <div className="container">
        <div className="profile-head reveal">
          <div className="profile-id">
            <span className="avatar">{initials(user?.full_name)}</span>
            <div>
              <h1>{user?.full_name || "Your profile"}</h1>
              <p className="muted">{user?.email}</p>
            </div>
          </div>
          <Link to="/orders" className="btn btn-secondary">
            My enrollments
          </Link>
        </div>

        <div className="profile-grid">
          <form className="panel form-grid reveal d1" onSubmit={onSave}>
            <h2 className="panel-title" style={{ marginBottom: 4 }}>
              Account details
            </h2>
            {msg ? <div className="flash ok">{msg}</div> : null}
            {error ? <div className="flash error">{error}</div> : null}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" value={user?.email || ""} disabled />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobile">Mobile</label>
                <input id="mobile" value={form.mobile} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <aside className="panel reveal d2">
            <h2 className="panel-title">Recent enrollments</h2>
            {!recent.length ? (
              <p className="muted">
                You have no enrollments yet. <Link to="/courses">View programs</Link>
              </p>
            ) : (
              <div className="list">
                {recent.map((item) => (
                  <div key={item.key} className="list-row">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.date}</small>
                      {item.link ? (
                        <small>
                          <a href={item.link} target="_blank" rel="noreferrer">
                            Open Zoom
                          </a>
                        </small>
                      ) : null}
                    </div>
                    <span
                      className={`badge ${
                        item.status === "confirmed" || item.status === "delivered" ? "green" : ""
                      }`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
