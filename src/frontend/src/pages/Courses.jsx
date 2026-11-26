import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import Icon, { SERVICE_ICON } from "../components/Icon";

const STEPS = [
  { title: "Open the service you want", text: "Pick training, support, interview prep, pack, or 1:1." },
  { title: "Agree → pay UPI QR", text: "Accept terms, scan the per-order QR, then WhatsApp the screenshot." },
  { title: "We confirm in admin", text: "After verification we confirm and deliver next steps / ZIP / Zoom." },
];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/catalog/courses")
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoaded(true));
  }, []);

  function onEnrollClick(course) {
    if (course.slug === "aws-devops-ai") return;
    if (!token) {
      navigate("/login");
      return;
    }
    if (course.slug === "1on1-connect") {
      navigate("/book/1on1");
      return;
    }
    navigate(`/enroll/${course.slug}`);
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-head center reveal">
          <p className="eyebrow">Services</p>
          <h1 className="page-title">Pick your starting point</h1>
          <p className="page-sub">Pick the track that matches your goal.</p>
        </div>

        {loaded && !courses.length ? (
          <div className="panel empty">Programs are temporarily unavailable. Please try again shortly.</div>
        ) : null}

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
                  <Link to={token ? `/courses/${c.slug}` : "/login"}>{c.title}</Link>
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
              {c.slug === "aws-devops-ai" ? (
                <p className="coming-soon-note">Coming soon</p>
              ) : null}
              <div className="service-actions">
                <Link to={token ? `/courses/${c.slug}` : "/login"} className="btn btn-secondary">
                  Details
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onEnrollClick(c)}
                  disabled={c.slug === "aws-devops-ai"}
                >
                  {c.slug === "aws-devops-ai" ? "Coming soon" : c.slug === "1on1-connect" ? "Book" : "Enroll"}
                </button>
              </div>
            </article>
          ))}
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
    </div>
  );
}
