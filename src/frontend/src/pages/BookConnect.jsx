import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { WhatsAppIcon } from "../components/Icon";
import { buildUpiUri, qrImageUrl } from "../upi";
import { connectPaymentMessage, openWhatsApp } from "../whatsapp";

/** Afternoon/evening slots matching Topmate-style grid (2:00 PM – 9:30 PM) */
const SLOT_MINUTES = (() => {
  const out = [];
  for (let h = 14; h <= 21; h += 1) {
    out.push(h * 60);
    if (h < 21) out.push(h * 60 + 30);
  }
  return out;
})();

const PLANS = [
  {
    id: 5,
    label: "₹19 Advice",
    tag: "Priority DM",
    blurb: "Yes, it’s just chocolate price",
    lead: "Ask me anything — I’ll reply personally.",
    points: [
      "AWS DevOps engineering roadmap",
      "Resume & LinkedIn tips",
      "Interview prep",
      "CI/CD, Terraform, K8s guidance",
      "Career switch into DevOps",
    ],
    how: "Send your question → I’ll reply within 1 day · almost free · limited slots",
  },
  {
    id: 15,
    label: "15 min Live",
    tag: "Video call",
    blurb: "Quick clarity for your AWS / DevOps path",
    lead: "Short Zoom call — focused answers and next steps.",
    points: [
      "AWS DevOps career & skill roadmap",
      "Resume / LinkedIn quick review tips",
      "Interview readiness check",
      "Stuck on CI/CD, Terraform, or K8s? Ask live",
      "Career switch into DevOps — where to start",
    ],
    how: "Pick slot → pay UPI → WhatsApp proof → admin confirms → Zoom by email",
  },
  {
    id: 40,
    label: "40 min Mentorship",
    tag: "1:1 guidance",
    blurb: "Deeper 1:1 for career, life & growth in DevOps",
    lead: "Longer Zoom — more depth, more practice.",
    points: [
      "Full AWS DevOps roadmap discussion",
      "Resume + LinkedIn guidance in detail",
      "Interview prep / mock-style questions",
      "Real pipeline / infra / K8s doubts",
      "Career switch plan with clear milestones",
    ],
    how: "Pick slot → pay UPI → WhatsApp proof → admin confirms → Zoom by email",
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtTime12(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${ap}`;
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

function planTitle(duration) {
  if (duration === 5) return "Personal Advice (DM)";
  return `${duration} min Live Video`;
}

export default function BookConnect() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [duration, setDuration] = useState(null);
  const [dateKey, setDateKey] = useState("");
  const [timeMins, setTimeMins] = useState(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [paid, setPaid] = useState(false);
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

  const plan = PLANS.find((p) => p.id === duration) || null;
  const price = useMemo(() => {
    if (!duration) return 0;
    if (!info?.prices) return duration === 5 ? 19 : duration === 15 ? 99 : 199;
    return info.prices[String(duration)] ?? (duration === 5 ? 19 : 99);
  }, [info, duration]);

  const visibleDays = useMemo(() => days.slice(dayOffset, dayOffset + 5), [days, dayOffset]);

  const availableTimes = useMemo(() => {
    if (!dateKey) return [];
    const now = Date.now();
    const [y, m, d] = dateKey.split("-").map(Number);
    const todayKey = dayKey(new Date());
    return SLOT_MINUTES.filter((mins) => {
      const slot = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0);
      if (dateKey === todayKey) return slot.getTime() > now + 15 * 60 * 1000;
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
    if (!duration) {
      setError("Pick a plan first");
      return;
    }
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
          priority: false,
          slot_start: slot,
        },
      });
      setDone(data);
      setPaid(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const upiUri = buildUpiUri({
      pa: info?.upi_id,
      am: done.price_inr,
      tr: done.id,
      tn: `1:1 ${done.id}`,
    });
    const waPayload = {
      user: {
        full_name: done.buyer_name,
        email: done.email,
        mobile: done.mobile,
      },
      bookingId: done.id,
      amount: done.price_inr,
      slot: done.slot_start.replace("T", " "),
      plan: planTitle(done.duration_min),
      upiId: info?.upi_id,
    };
    return (
      <div className="page">
        <div className="container enroll-wrap">
          <h1 className="page-title">Pay · {planTitle(done.duration_min)}</h1>
          <p className="enroll-order-id">
            <strong>{done.id}</strong> · ₹{done.price_inr}
          </p>
          <p className="muted">When: {done.slot_start.replace("T", " ")}</p>
          {!paid ? (
            <div className="panel enroll-panel">
              <div className="enroll-qr">
                <img src={qrImageUrl(upiUri, 220)} alt="UPI payment QR" width={220} height={220} />
              </div>
              <p className="upi-highlight enroll-upi">
                UPI: {info?.upi_id}
                {info?.upi_id_alt ? ` / ${info.upi_id_alt}` : ""}
              </p>
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => setPaid(true)}>
                I&apos;ve paid
              </button>
            </div>
          ) : (
            <div className="panel enroll-panel">
              <div className="flash ok">Payment noted. Share the screenshot on WhatsApp.</div>
              <button
                type="button"
                className="btn btn-wa btn-lg btn-block"
                onClick={() => openWhatsApp(connectPaymentMessage(waPayload))}
              >
                <WhatsAppIcon />
                Share on WhatsApp
              </button>
              <Link to="/orders" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
                My enrollments
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container book-wrap">
        <Link to="/courses/1on1-connect" className="text-link">
          Back to 1:1 Connect
        </Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>
          Book 1:1 Connect
        </h1>
        {error ? <div className="flash error">{error}</div> : null}

        <div className="plan-picker">
          {PLANS.map((p) => {
            const amt = info?.prices?.[String(p.id)] ?? (p.id === 5 ? 19 : p.id === 15 ? 99 : 199);
            const theme = p.id === 5 ? "theme-advice" : p.id === 15 ? "theme-live" : "theme-mentor";
            return (
              <button
                key={p.id}
                type="button"
                className={`mentor-card ${theme} ${duration === p.id ? "active" : ""}`}
                onClick={() => {
                  setDuration(p.id);
                  setError("");
                }}
              >
                {p.id === 5 ? (
                  <>
                    <div className="mentor-viz mentor-viz-dm" aria-hidden="true">
                      <span className="viz-bubble">?</span>
                      <span className="viz-bubble reply">✓</span>
                    </div>
                    <p className="mentor-kicker">Priority DM</p>
                    <p className="mentor-card-mins">₹{amt}</p>
                    <p className="mentor-card-title">Personal Advice</p>
                    <p className="mentor-card-sub">Chocolate-price answers on AWS DevOps, resume &amp; interviews.</p>
                    <span className="mentor-pill">Almost free</span>
                  </>
                ) : p.id === 15 ? (
                  <>
                    <div className="mentor-viz mentor-viz-call" aria-hidden="true">
                      <span className="viz-cam" />
                      <span className="viz-pulse" />
                    </div>
                    <p className="mentor-kicker">Live video · Zoom</p>
                    <p className="mentor-card-mins">15 min</p>
                    <p className="mentor-card-title">Quick Connect</p>
                    <p className="mentor-card-sub">
                      Focused AWS DevOps career &amp; <em>growth</em> guidance.
                    </p>
                    <div className="mentor-card-meta">
                      <span className="mentor-pill">Popular</span>
                      <span className="mentor-price">₹{amt}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mentor-viz mentor-viz-deep" aria-hidden="true">
                      <span className="viz-node" />
                      <span className="viz-node" />
                      <span className="viz-node" />
                    </div>
                    <p className="mentor-kicker">1:1 mentorship</p>
                    <p className="mentor-card-mins">40 min</p>
                    <p className="mentor-card-title">Deep Guidance</p>
                    <p className="mentor-card-sub">
                      Roadmap, pipelines, K8s doubts &amp; <em>career switch</em> plan.
                    </p>
                    <div className="mentor-card-meta">
                      <span className="mentor-pill">Best value</span>
                      <span className="mentor-price">₹{amt}</span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {plan ? (
          <div className="plan-info panel">
            <p className="plan-info-blurb">{plan.blurb}</p>
            <p className="plan-info-lead">{plan.lead}</p>
            <ul className="plan-info-list">
              {plan.points.map((pt) => (
                <li key={pt}>→ {pt}</li>
              ))}
            </ul>
            <p className="plan-info-how">
              <strong>How it works:</strong> {plan.how}
            </p>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            Pick ₹19 Advice, 15 min, or 40 min to continue.
          </p>
        )}

        {duration ? (
          <form className="book-card panel" onSubmit={onSubmit}>
            <div className="book-card-head">
              <h2>When should we meet?</h2>
              <div className="book-day-nav">
                <button
                  type="button"
                  className="book-nav-btn"
                  aria-label="Earlier dates"
                  disabled={dayOffset <= 0}
                  onClick={() => setDayOffset((v) => Math.max(0, v - 1))}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="book-nav-btn"
                  aria-label="Later dates"
                  disabled={dayOffset + 5 >= days.length}
                  onClick={() => setDayOffset((v) => Math.min(days.length - 5, v + 1))}
                >
                  →
                </button>
              </div>
            </div>
            <div className="book-dates">
              {visibleDays.map((d) => {
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
                    className={`book-date ${dateKey === key ? "active" : ""}`}
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

            <h2 className="book-subhead">Select time of day</h2>
            {!dateKey ? (
              <p className="muted">Choose a date first.</p>
            ) : (
              <div className="book-times">
                {availableTimes.length ? (
                  availableTimes.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`book-time ${timeMins === mins ? "active" : ""}`}
                      onClick={() => setTimeMins(mins)}
                    >
                      {fmtTime12(mins)}
                    </button>
                  ))
                ) : (
                  <p className="muted">No times left for this day.</p>
                )}
              </div>
            )}

            <div className="book-tz">
              <span>Timezone</span>
              <strong>(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi</strong>
            </div>

            <div className="form-group">
              <label>Full name</label>
              <input name="name" defaultValue={user?.full_name || ""} required />
            </div>
            <div className="form-group">
              <label>{duration === 5 ? "Email" : "Email (Zoom after approval)"}</label>
              <input name="email" type="email" defaultValue={user?.email || ""} required />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input name="mobile" defaultValue={user?.mobile || ""} required />
            </div>
            <label className="consent-check" htmlFor="book-terms">
              <input
                id="book-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I agree to the <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy</Link>, and{" "}
                <Link to="/refund">Refund</Link> policies.
              </span>
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={busy || !slot || !agreed}
            >
              {busy ? "Booking..." : `Let's connect · ₹${price}`}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
