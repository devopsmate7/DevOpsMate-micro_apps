import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { WhatsAppIcon } from "../components/Icon";
import { buildUpiUri, qrImageUrl } from "../upi";
import { connectPaymentMessage, openWhatsApp } from "../whatsapp";

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
    mins: "₹19",
    title: "Priority DM.",
    subLead: "AWS DevOps",
    subEm: "Personal Advice",
    subTail: "",
    name: "Get My Personal Advice",
    pill: "Advice",
    words: ["ASK", "GUIDE", "GROW"],
    side: "Clarity today.\nBetter tomorrow.",
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
    mins: "15 min",
    title: "Live Video Call.",
    subLead: "AWS DevOps Career,",
    subEm: "Life & Growth",
    subTail: " Guidance",
    name: "AWS DevOps Guidance - 1:1",
    pill: "Popular",
    words: ["STRATEGY", "CREATIVITY", "IDENTITY"],
    side: "Clarity today.\nBetter tomorrow.",
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
    mins: "40 min",
    title: "Live Mentorship.",
    subLead: "AWS DevOps",
    subEm: "Mentorship",
    subTail: " / Guidance - 1:1",
    name: "AWS DevOps Mentorship / Guidance - 1:1",
    pill: "Best value",
    words: ["DEPTH", "CAREER", "SHIP"],
    side: "Clarity today.\nBetter tomorrow.",
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

function useIsMobile(max = 820) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${max}px)`).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${max}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [max]);
  return mobile;
}

export default function BookConnect() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(820);
  const [info, setInfo] = useState(null);
  const [duration, setDuration] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  useEffect(() => {
    const lock = isMobile && (sheetOpen || Boolean(done));
    document.body.classList.toggle("sheet-open", lock);
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.classList.remove("sheet-open");
      document.body.style.overflow = "";
    };
  }, [isMobile, sheetOpen, done]);

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
      const slotDate = new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0);
      if (dateKey === todayKey) return slotDate.getTime() > now + 15 * 60 * 1000;
      return true;
    });
  }, [dateKey]);

  const slot = useMemo(() => {
    if (!dateKey || timeMins == null) return "";
    const [y, m, d] = dateKey.split("-").map(Number);
    return toLocalIso(new Date(y, m - 1, d, Math.floor(timeMins / 60), timeMins % 60, 0));
  }, [dateKey, timeMins]);

  function pickPlan(id) {
    setDuration(id);
    setError("");
    setAgreed(false);
    if (isMobile) setSheetOpen(true);
  }

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
      setSheetOpen(false);
      setDone(data);
      setPaid(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function renderPlanInfo(p) {
    if (!p) return null;
    return (
      <div className="plan-info panel">
        <p className="plan-info-blurb">{p.blurb}</p>
        <p className="plan-info-lead">{p.lead}</p>
        <ul className="plan-info-list">
          {p.points.map((pt) => (
            <li key={pt}>→ {pt}</li>
          ))}
        </ul>
        <p className="plan-info-how">
          <strong>How it works:</strong> {p.how}
        </p>
      </div>
    );
  }

  function renderBookForm(formId) {
    return (
      <form id={formId} className="book-card panel" onSubmit={onSubmit}>
        <div className="book-card-head">
          <h3>When should we meet?</h3>
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

        <h3 className="book-subhead">Select time of day</h3>
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
        <label className="consent-check" htmlFor={`${formId}-terms`}>
          <input
            id={`${formId}-terms`}
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I agree to the <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy</Link>, and{" "}
            <Link to="/refund">Refund</Link> policies.
          </span>
        </label>
        {!isMobile ? (
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={busy || !slot || !agreed}
          >
            {busy ? "Booking..." : `Let's connect · ₹${price}`}
          </button>
        ) : null}
      </form>
    );
  }

  function renderPayBlock() {
    if (!done) return null;
    const upiUri = buildUpiUri({
      pa: info?.upi_id,
      am: done.price_inr,
      tr: done.id,
      tn: `1:1 ${done.id}`,
    });
    return (
      <div className="panel enroll-panel">
        <h2 className="sheet-title" style={{ textAlign: "center" }}>
          Pay · {planTitle(done.duration_min)}
        </h2>
        <p className="enroll-order-id">
          <strong>{done.id}</strong> · ₹{done.price_inr}
        </p>
        <p className="muted" style={{ textAlign: "center" }}>
          When: {done.slot_start.replace("T", " ")}
        </p>
        {!paid ? (
          <>
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
          </>
        ) : (
          <>
            <div className="flash ok">Payment noted. Share the screenshot on WhatsApp.</div>
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
                    plan: planTitle(done.duration_min),
                    upiId: info?.upi_id,
                  })
                )
              }
            >
              <WhatsAppIcon />
              Share on WhatsApp
            </button>
            <Link to="/orders" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
              My enrollments
            </Link>
          </>
        )}
      </div>
    );
  }

  if (done && !isMobile) {
    return (
      <div className="page">
        <div className="container enroll-wrap">{renderPayBlock()}</div>
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
        {error && !(isMobile && sheetOpen) ? <div className="flash error">{error}</div> : null}

        <div className="plan-picker">
          {PLANS.map((p) => {
            const amt = info?.prices?.[String(p.id)] ?? (p.id === 5 ? 19 : p.id === 15 ? 99 : 199);
            const theme = p.id === 5 ? "theme-advice" : p.id === 15 ? "theme-live" : "theme-mentor";
            return (
              <button
                key={p.id}
                type="button"
                className={`mentor-card ${theme} ${duration === p.id ? "active" : ""}`}
                onClick={() => pickPlan(p.id)}
              >
                <div className="mentor-card-top">
                  {p.words.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
                <div className="mentor-card-frame">
                  <p className="mentor-card-side">
                    {p.side.split("\n").map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                  <div className="mentor-card-main">
                    <p className="mentor-card-mins">{p.mins}</p>
                    <p className="mentor-card-title">{p.title}</p>
                    <p className="mentor-card-sub">
                      {p.subLead} <em>{p.subEm}</em>
                      {p.subTail}
                    </p>
                  </div>
                </div>
                <div className="mentor-card-meta">
                  <span className="mentor-pill">{p.pill}</span>
                  <span className="mentor-price">₹{amt}</span>
                </div>
                <p className="mentor-card-name">{p.name}</p>
              </button>
            );
          })}
        </div>

        {!isMobile && plan ? (
          <>
            {renderPlanInfo(plan)}
            {error ? <div className="flash error">{error}</div> : null}
            {renderBookForm("book-desktop")}
          </>
        ) : null}

        {isMobile && !sheetOpen ? (
          <p className="muted" style={{ marginTop: 14, textAlign: "center" }}>
            Tap a plan to pick date &amp; time.
          </p>
        ) : null}
      </div>

      {isMobile && sheetOpen && plan ? (
        <div className="sheet-overlay" role="presentation" onClick={() => setSheetOpen(false)}>
          <div
            className="sheet-card"
            role="dialog"
            aria-modal="true"
            aria-label="Book slot"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-grab" />
            <div className="sheet-head">
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>
                  {plan.mins}
                </p>
                <h2 className="sheet-title">{plan.name}</h2>
              </div>
              <button
                type="button"
                className="sheet-close"
                aria-label="Close"
                onClick={() => setSheetOpen(false)}
              >
                {"\u2715"}
              </button>
            </div>

            <div className="sheet-scroll">
              <div className="plan-info sheet-info">
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
              {error ? <div className="flash error">{error}</div> : null}
              {renderBookForm("book-mobile")}
            </div>

            <div className="sheet-cta">
              <button
                type="submit"
                form="book-mobile"
                className="btn btn-primary btn-lg btn-block"
                disabled={busy || !slot || !agreed}
              >
                {busy ? "Booking..." : `Let's connect · ₹${price}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMobile && done ? (
        <div className="sheet-overlay" role="presentation">
          <div className="sheet-card sheet-card-pay" role="dialog" aria-modal="true" aria-label="Pay with UPI">
            <div className="sheet-grab" />
            <div className="sheet-scroll">{renderPayBlock()}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
