import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";

function nextSlots() {
  const out = [];
  const now = new Date();
  for (let d = 0; d < 14; d += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    day.setHours(0, 0, 0, 0);
    if (day.getDay() === 0) continue;
    for (const h of [10, 11, 12, 14, 15, 16, 17, 18, 19]) {
      const slot = new Date(day);
      slot.setHours(h, 0, 0, 0);
      if (slot.getTime() < now.getTime() + 60 * 60 * 1000) continue;
      out.push(slot.toISOString());
    }
  }
  return out.slice(0, 48);
}

export default function BookConnect() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [duration, setDuration] = useState(15);
  const [priority, setPriority] = useState(false);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const slots = useMemo(() => nextSlots(), []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    apiFetch("/api/commerce/connect/pay-info")
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token, navigate]);

  const price = useMemo(() => {
    if (!info?.prices) return priority ? (duration === 15 ? 199 : 299) : duration === 15 ? 99 : 199;
    const key = `${duration}${priority ? "p" : ""}`;
    return info.prices[key] ?? 99;
  }, [info, duration, priority]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.target);
      const data = await apiFetch("/api/commerce/connect/book", {
        token,
        method: "POST",
        body: {
          accept_terms: true,
          accept_refund: true,
          email: String(form.get("email") || user?.email || "").trim(),
          buyer_name: String(form.get("name") || user?.full_name || "").trim(),
          mobile: String(form.get("mobile") || user?.mobile || "").trim(),
          duration_min: duration,
          priority,
          slot_start: slot,
        },
      });
      setDone(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 640 }}>
          <h1 className="page-title">Booking confirmed</h1>
          <div className="panel" style={{ marginTop: 16 }}>
            <p>
              <strong>{done.id}</strong> · {done.duration_min} min
              {done.priority ? " priority" : ""} · ₹{done.price_inr}
            </p>
            <p className="muted">When: {new Date(done.slot_start).toLocaleString()}</p>
            <p>
              Zoom link emailed to <strong>{done.email}</strong>.
            </p>
            <a className="btn btn-primary btn-block" href={done.meeting_link} target="_blank" rel="noreferrer">
              Open Zoom link
            </a>
            <Link to="/orders" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
              My orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <Link to="/courses/1on1-connect" className="text-link">
          Back to 1:1 Connect
        </Link>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Book 1:1 Connect
        </h1>
        <p className="page-sub">Pay via UPI, then confirm — Zoom link is emailed immediately.</p>
        {error ? <div className="flash error">{error}</div> : null}

        <form className="panel form-grid" onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Duration</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={15}>15 minutes</option>
              <option value={40}>40 minutes</option>
            </select>
          </div>
          <label className="consent-check">
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
            <span>Priority slot (faster scheduling / higher priority)</span>
          </label>
          <p style={{ fontSize: 22, fontWeight: 700 }}>₹{price}</p>
          {info ? (
            <p className="muted" style={{ fontSize: 14 }}>
              UPI: <strong>{info.upi_id}</strong>
              {info.upi_id_alt ? (
                <>
                  {" "}
                  / <strong>{info.upi_id_alt}</strong>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="form-group">
            <label>Date & time</label>
            <select value={slot} onChange={(e) => setSlot(e.target.value)} required>
              <option value="">Select a slot</option>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {new Date(s).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Full name</label>
            <input name="name" defaultValue={user?.full_name || ""} required />
          </div>
          <div className="form-group">
            <label>Email (Zoom link)</label>
            <input name="email" type="email" defaultValue={user?.email || ""} required />
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input name="mobile" defaultValue={user?.mobile || ""} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || !slot}>
            {busy ? "Booking..." : `Confirm booking · ₹${price}`}
          </button>
        </form>
      </div>
    </div>
  );
}
