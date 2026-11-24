import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

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

  if (!token) return <Navigate to="/login" replace />;

  const empty = !orders.length && !bookings.length;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="page-head reveal">
          <p className="eyebrow">Account</p>
          <h1 className="page-title">My enrollments</h1>
        </div>
        {placed ? <div className="flash ok">Your enrollment has been confirmed.</div> : null}

        <div className="panel reveal d1">
          {empty ? (
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
              {bookings.map((b) => (
                <div key={b.id} className="list-row">
                  <div>
                    <strong>1:1 Connect · {b.duration_min} min{b.priority ? " priority" : ""}</strong>
                    <small>
                      {b.id} {"\u00B7"} {String(b.slot_start).replace("T", " ")} {"\u00B7"} ₹{b.price_inr}
                    </small>
                    {b.status === "confirmed" && b.meeting_link ? (
                      <small>
                        <a href={b.meeting_link} target="_blank" rel="noreferrer">
                          Open Zoom
                        </a>
                      </small>
                    ) : null}
                  </div>
                  <span className={`badge ${b.status === "confirmed" ? "green" : ""}`}>
                    {b.status === "confirmed" ? "confirmed" : b.status === "awaiting_approval" ? "awaiting approval" : b.status}
                  </span>
                </div>
              ))}
              {orders.map((o) => (
                <div key={o.id} className="list-row">
                  <div>
                    <strong>{o.items.map((i) => i.title).join(", ")}</strong>
                    <small>
                      {o.id} {"\u00B7"} {new Date(o.created_at).toLocaleString()}
                    </small>
                  </div>
                  <span className={`badge ${o.status === "delivered" || o.status === "confirmed" ? "green" : ""}`}>
                    {o.status === "awaiting_approval"
                      ? "awaiting approval"
                      : o.status === "confirmed"
                        ? "confirmed"
                        : o.status}
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
