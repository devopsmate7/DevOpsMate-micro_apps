import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import EnrollConsentModal from "../components/EnrollConsentModal";
import Icon, { SERVICE_ICON, WhatsAppIcon } from "../components/Icon";
import { enrollmentMessage, openWhatsApp } from "../whatsapp";

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [pendingEnroll, setPendingEnroll] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const { token, user } = useAuth();
  const { add, checkout } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch(`/api/catalog/courses/${slug}`)
      .then(setCourse)
      .catch((e) => setError(e.message));
  }, [slug]);

  function onEnrollClick() {
    setMsg("");
    setEnrollError("");
    if (!token) {
      navigate("/login");
      return;
    }
    setPendingEnroll(true);
  }

  async function confirmEnroll() {
    setConfirming(true);
    try {
      await add(course.id);
      openWhatsApp(enrollmentMessage({ user, items: [{ title: course.title, qty: 1 }] }));
      await checkout({ accept_terms: true, accept_refund: true });
      setMsg("Your enrollment is confirmed. Continue in WhatsApp for next steps.");
      setPendingEnroll(false);
    } catch (e) {
      setEnrollError(e.message);
      setPendingEnroll(false);
    } finally {
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="flash error">{error}</div>
        </div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="page">
        <div className="container muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/courses" className="text-link">
          <Icon name="arrowLeft" size={16} />
          All services
        </Link>

        <div className="detail-grid">
          <div className="detail-main reveal">
            <div className="service-top" style={{ justifyContent: "flex-start" }}>
              <span className="service-icon">
                <Icon name={SERVICE_ICON[course.slug] || "layers"} size={22} />
              </span>
              {course.badge ? <span className="badge">{course.badge}</span> : null}
            </div>
            <h1 className="page-title">{course.title}</h1>
            <p className="page-sub">{course.subtitle}</p>
            <div className="chip-row" style={{ marginTop: 20 }}>
              <span className="chip">{course.level}</span>
              <span className="chip">{course.duration}</span>
              <span className="chip">{course.mode}</span>
            </div>

            <div className="detail-block">
              <h2>Program outline</h2>
              <ul className="check-list">
                {course.highlights.map((h) => (
                  <li key={h}>
                    <Icon name="check" size={16} stroke={2.5} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-block">
              <h2>Included with this program</h2>
              <div className="include-grid">
                {course.includes.map((h) => (
                  <div key={h} className="include-item">
                    <Icon name="check" size={16} stroke={2.5} />
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="panel detail-aside reveal d1">
            <h2 className="panel-title" style={{ marginBottom: 0 }}>
              Request enrollment
            </h2>
            <p>WhatsApp opens with your details and this program, ready to send to the team.</p>
            {msg ? <div className="flash ok">{msg}</div> : null}
            {enrollError ? <div className="flash error">{enrollError}</div> : null}
            <button type="button" className="btn btn-wa btn-lg btn-block" onClick={onEnrollClick}>
              <WhatsAppIcon />
              Enroll now
            </button>
            {token ? (
              <Link to="/orders" className="btn btn-secondary btn-block">
                View my enrollments
              </Link>
            ) : (
              <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                Sign in is required before enrollment.
              </p>
            )}
          </aside>
        </div>
      </div>

      <EnrollConsentModal
        open={pendingEnroll}
        title={`Enroll in ${course.title}`}
        loading={confirming}
        onCancel={() => setPendingEnroll(false)}
        onConfirm={confirmEnroll}
      />
    </div>
  );
}
