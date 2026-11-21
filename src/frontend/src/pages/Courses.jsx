import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import EnrollConsentModal from "../components/EnrollConsentModal";
import Icon, { SERVICE_ICON, WhatsAppIcon } from "../components/Icon";
import { enrollmentMessage, openWhatsApp } from "../whatsapp";

const STEPS = [
  { title: "Open the service you want", text: "Pick the track that matches your goal — training, support, or interview prep." },
  { title: "Confirm on WhatsApp or UPI", text: "Most programs continue on WhatsApp. Offline Q&A uses UPI, then admin approval." },
  { title: "Start learning", text: "We confirm your place, share next steps, and deliver pack files by email when approved." },
];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [pendingCourse, setPendingCourse] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const { token, user } = useAuth();
  const { add, checkout } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/catalog/courses")
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoaded(true));
  }, []);

  function onEnrollClick(course) {
    setMsg("");
    setError("");
    if (!token) {
      navigate("/login");
      return;
    }
    if (course.slug === "interview-qa-offline") {
      navigate("/pay/interview-qa-offline");
      return;
    }
    setPendingCourse(course);
  }

  async function confirmEnroll() {
    const course = pendingCourse;
    if (!course) return;
    setConfirming(true);
    try {
      await add(course.id);
      openWhatsApp(enrollmentMessage({ user, items: [{ title: course.title, qty: 1 }] }));
      await checkout({ accept_terms: true, accept_refund: true });
      setMsg(`Your enrollment for ${course.title} is confirmed. Continue in WhatsApp for next steps.`);
      setPendingCourse(null);
    } catch (e) {
      setError(e.message);
      setPendingCourse(null);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head center reveal">
          <p className="eyebrow">Services</p>
          <h1 className="page-title">Pick your starting point</h1>
          <p className="page-sub">
            Five clear offerings. Most enroll on WhatsApp; the Offline Interview Q&A pack uses UPI, then we email your ZIP after approval.
          </p>
        </div>

        {msg ? <div className="flash ok">{msg}</div> : null}
        {error ? <div className="flash error">{error}</div> : null}
        {loaded && !courses.length ? (
          <div className="panel empty">Programs are temporarily unavailable. Please try again shortly.</div>
        ) : null}

        <div className="service-stage">
          <div className="service-sparkles" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className={`svc-star st${i + 1}`} />
            ))}
          </div>
          <div className="service-grid">
            {courses.map((c, i) => (
              <article key={c.id} className={`service-card reveal d${i + 1}`}>
                <div className="service-top">
                  <span className="service-icon">
                    <Icon name={SERVICE_ICON[c.slug] || "layers"} size={22} />
                  </span>
                  {c.badge ? <span className="badge">{c.badge}</span> : null}
                </div>
                <div>
                  <h2 className="service-title">
                    <Link to={`/courses/${c.slug}`}>{c.title}</Link>
                  </h2>
                  <p className="service-copy">{c.subtitle}</p>
                </div>
                <div className="chip-row">
                  <span className="chip">{c.duration}</span>
                  <span className="chip">{c.mode}</span>
                </div>
                <ul className="check-list">
                  {c.highlights.slice(0, 3).map((h) => (
                    <li key={h}>
                      <Icon name="check" size={16} stroke={2.5} />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="service-actions">
                  <Link to={`/courses/${c.slug}`} className="btn btn-secondary">
                    Details
                  </Link>
                  <button type="button" className="btn btn-wa" onClick={() => onEnrollClick(c)}>
                    {c.slug === "interview-qa-offline" ? (
                      "Pay UPI"
                    ) : (
                      <>
                        <WhatsAppIcon size={16} />
                        Enroll
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step">
              <p className="step-num">STEP {String(i + 1).padStart(2, "0")}</p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <EnrollConsentModal
        open={!!pendingCourse}
        title={pendingCourse ? `Enroll in ${pendingCourse.title}` : "Enroll"}
        loading={confirming}
        onCancel={() => setPendingCourse(null)}
        onConfirm={confirmEnroll}
      />
    </div>
  );
}
