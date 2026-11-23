import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { WhatsAppIcon } from "../components/Icon";
import { connectPaymentMessage, openWhatsApp } from "../whatsapp";

/** Half-hour slots 09:00–21:00 */
const SLOT_MINUTES = (() => {
  const out = [];
  for (let h = 9; h <= 21; h += 1) {
    out.push(h * 60);
    if (h < 21) out.push(h * 60 + 30);
  }
  return out;
})();

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtTime(mins) {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

function toLocalIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nextDays(count = 14) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count + 6 && out.length < count; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + i);
    day.setHours(0, 0, 0, 0);
    if (day.getDay() === 0) continue;
    out.push(day);
  }
  return out;
}

export default function BookConnect() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [duration, setDuration] = useState(15);
  const [priority, setPriority] = useState(false);
  const [dateKey, setDateKey] = useState("");
  const [timeMins, setTimeMins] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const days = useMemo(() => nextDays(14), []);

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
    return info.prices[`${duration}${priority ? "p" : ""}`] ?? 99;
  }, [info, duration, priority]);

  const availableTimes = useMemo(() => {
    if (!dateKey) return [];
    const now = Date.now();
    const [y, m, d] = dateKey.split("-").map(Number);
    const todayKey = dayKey(new Date());
    return SLOT_MINUTES.filter((mins) => {
      const slot = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0);
      if (dateKey === todayKey) {
        return slot.getTime() > now + 15 * 60 * 1000;
      }
      return true;
    });
  }, [dateKey]);

  const slot = useMemo(() => {
    if (!dateKey || timeMins == null) return "";
    const [y, m, d] = dateKey.split("-").map(Number);
    return toLocalIso(new Date(y, m - 1, d, Math.floor(timeMins / 60), timeMins % 60, 0));
  }, [dateKey, timeMins]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!slot) {
      setError("Pick a date and time");
      return;
    }
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
      openWhatsApp(
        connectPaymentMessage({
          user: {
            full_name: data.buyer_name,
            email: data.email,
            mobile: data.mobile,
          },
          bookingId: data.id,
          amount: data.price_inr,
          slot: data.slot_start.replace("T", " "),
          plan: `${data.duration_min} min${data.priority ? " priority" : ""}`,
          upiId: info?.upi_id,
        })
      );
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
          <h1 className="page-title">Request received</h1>
          <div className="flash warn" style={{ marginTop: 16 }}>
            <strong>Important:</strong> Pay via UPI, then <strong>WhatsApp your payment screenshot / receipt</strong>{" "}
            with booking <strong>{done.id}</strong>. We verify on WhatsApp, then approve in admin — only then you get
            the Zoom link by email.
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <p>
              <strong>{done.id}</strong> · {done.duration_min} min
              {done.priority ? " priority" : ""} · ₹{done.price_inr}
            </p>
            <p className="muted">When: {done.slot_start.replace("T", " ")}</p>
            <p>
              Status: <strong>awaiting approval</strong>
            </p>
            <button
              type="button"
              className="btn btn-wa btn-lg btn-block"
              onClick={() =>
                openWhatsApp(
                  connectPaymentMessage({
                    user: {
                      full_name: done.buyer_name,
                      email: done.email,
                      mobile: done.mobile,
                    },
                    bookingId: done.id,
                    amount: done.price_inr,
                    slot: done.slot_start.replace("T", " "),
                    plan: `${done.duration_min} min${done.priority ? " priority" : ""}`,
                    upiId: info?.upi_id,
                  })
                )
              }
            >
              <WhatsAppIcon />
              Send payment screenshot on WhatsApp
            </button>
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
      <div className="container" style={{ maxWidth: 680 }}>
        <Link to="/courses/1on1-connect" className="text-link">
          Back to 1:1 Connect
        </Link>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Book 1:1 Connect
        </h1>
        <p className="page-sub">
          Pick date and time, pay via UPI, WhatsApp the screenshot — we verify, then email your Zoom link after admin
          accepts.
        </p>
        <div className="flash warn">
          <strong>After payment:</strong> share the <strong>receipt / screenshot on WhatsApp</strong> (+91 80889 29670)
          with your booking ID. Zoom is sent only after we verify and approve.
        </div>
        {error ? <div className="flash error">{error}</div> : null}

        <form className="panel form-grid" onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <div className="slot-box-row">
            <button type="button" className={`slot-box ${duration === 15 ? "active" : ""}`} onClick={() => setDuration(15)}>
              15 min
            </button>
            <button type="button" className={`slot-box ${duration === 40 ? "active" : ""}`} onClick={() => setDuration(40)}>
              40 min
            </button>
            <button
              type="button"
              className={`slot-box ${priority ? "active" : ""}`}
              onClick={() => setPriority((v) => !v)}
            >
              {priority ? "Priority on" : "Priority"}
            </button>
          </div>
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
            <label>Date</label>
            <div className="slot-box-grid">
              {days.map((d) => {
                const key = dayKey(d);
                const label = d.toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                return (
                  <button
                    key={key}
                    type="button"
                    className={`slot-box ${dateKey === key ? "active" : ""}`}
                    onClick={() => {
                      setDateKey(key);
                      setTimeMins(null);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {dateKey ? (
            <div className="form-group">
              <label>Time ({availableTimes.length} slots)</label>
              <div className="slot-box-grid time-grid">
                {availableTimes.length ? (
                  availableTimes.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`slot-box ${timeMins === mins ? "active" : ""}`}
                      onClick={() => setTimeMins(mins)}
                    >
                      {fmtTime(mins)}
                    </button>
                  ))
                ) : (
                  <p className="muted">No times left for this day. Pick another date.</p>
                )}
              </div>
            </div>
          ) : null}

          <div className="form-group">
            <label>Full name</label>
            <input name="name" defaultValue={user?.full_name || ""} required />
          </div>
          <div className="form-group">
            <label>Email (Zoom link after approval)</label>
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
