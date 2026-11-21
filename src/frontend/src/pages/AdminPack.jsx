import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function AdminPack() {
  const [params, setParams] = useSearchParams();
  const [key, setKey] = useState(params.get("key") || localStorage.getItem("dm-admin-key") || "");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function load(adminKey) {
    setError("");
    const res = await fetch(`/api/commerce/admin/pack-orders?admin_key=${encodeURIComponent(adminKey)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Failed to load orders");
    setOrders(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (!key) return;
    localStorage.setItem("dm-admin-key", key);
    load(key).catch((e) => setError(e.message));
  }, [key]);

  function saveKey(e) {
    e.preventDefault();
    const next = new FormData(e.target).get("admin_key")?.toString().trim() || "";
    setKey(next);
    setParams(next ? { key: next } : {});
  }

  async function approve(orderId) {
    setBusy(orderId);
    setMsg("");
    setError("");
    try {
      const res = await fetch(`/api/commerce/admin/pack-orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_key: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Approve failed");
      setMsg(`Approved ${orderId}. ZIP email sent to ${data.email}.`);
      await load(key);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        <h1 className="page-title">Admin · Offline pack orders</h1>
        <p className="page-sub">Verify WhatsApp screenshot, then approve by Order ID to email the ZIP.</p>

        <form className="panel" onSubmit={saveKey} style={{ marginBottom: 16 }}>
          <label>
            Admin key
            <input name="admin_key" defaultValue={key} type="password" required style={{ width: "100%", marginTop: 6 }} />
          </label>
          <button type="submit" className="btn btn-secondary" style={{ marginTop: 10 }}>
            Load orders
          </button>
        </form>

        {msg ? <div className="flash ok">{msg}</div> : null}
        {error ? <div className="flash error">{error}</div> : null}

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
      </div>
    </div>
  );
}
