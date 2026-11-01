import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [params] = useSearchParams();
  const placed = params.get("placed");

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/commerce/orders", { token }).then(setOrders).catch(() => setOrders([]));
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="page-head reveal">
          <p className="eyebrow">Account</p>
          <h1 className="page-title">My enrollments</h1>
        </div>
        {placed ? <div className="flash ok">Your enrollment has been confirmed.</div> : null}

        <div className="panel reveal d1">
          {!orders.length ? (
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
              {orders.map((o) => (
                <div key={o.id} className="list-row">
                  <div>
                    <strong>{o.items.map((i) => i.title).join(", ")}</strong>
                    <small>
                      {o.id} {"\u00B7"} {new Date(o.created_at).toLocaleString()}
                    </small>
                  </div>
                  <span className="badge green">{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
