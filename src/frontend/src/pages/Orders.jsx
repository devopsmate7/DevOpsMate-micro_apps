import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

function statusLabel(status) {
  if (status === "awaiting_approval") return "awaiting approval";
  return status;
}

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [params] = useSearchParams();
  const placed = params.get("placed");

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

  const items = useMemo(() => {
    const rows = [
      ...bookings.map((b) => ({
        key: `b-${b.id}`,
        sort: b.created_at || b.slot_start || "",
        title: `1:1 Connect · ${b.duration_min} min${b.priority ? " priority" : ""}`,
        meta: `${b.id} · ${String(b.slot_start || "").replace("T", " ")} · ₹${b.price_inr}`,
        status: b.status,
        link: b.status === "confirmed" ? b.meeting_link : null,
        when: b.created_at || b.slot_start,
      })),
      ...orders.map((o) => ({
        key: `o-${o.id}`,
        sort: o.created_at || "",
        title: o.items.map((i) => i.title).join(", "),
        meta: `${o.id} · ${new Date(o.created_at).toLocaleString()}`,
        status: o.status,
        link: null,
        when: o.created_at,
      })),
    ];
    return rows.sort((a, b) => String(b.sort).localeCompare(String(a.sort)));
  }, [orders, bookings]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="page-head reveal">
          <p className="eyebrow">Account</p>
          <h1 className="page-title">My enrollments</h1>
          <p className="page-sub">Sorted by latest booking first.</p>
        </div>
        {placed ? <div className="flash ok">Your enrollment has been confirmed.</div> : null}

        <div className="panel reveal d1">
          {!items.length ? (
            <div className="empty">
              You have no enrollments yet.
              <div>
                <Link to="/courses" className="btn btn-primary">
                  View programs
                </Link>
              </div>
            </div>
          ) : (
            <div className="list">
              {items.map((item) => (
                <div key={item.key} className="list-row">
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                    {item.when ? (
                      <small className="muted">Booked {new Date(item.when).toLocaleString()}</small>
                    ) : null}
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
        </div>
      </div>
    </div>
  );
}
