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

            {course.interview_plan ? (
              <div className="detail-block">
                <h2>{course.interview_plan.title || "Interview plan"}</h2>
                {course.interview_plan.intro.map((line) => (
                  <p key={line} className="plan-intro">{line}</p>
                ))}
                <div className="plan-table-wrap">
                  <table className="plan-table">
                    <thead>
                      <tr>
                        <th>Days</th>
                        <th>Topic / Module</th>
                        <th>Learn</th>
                        <th>Practice</th>
                        <th>Mock drive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.interview_plan.rows.map((row) => (
                        <tr key={row.days}>
                          <td>{row.days}</td>
                          <td>{row.topic}</td>
                          <td>{row.learn}</td>
                          <td>{row.practice}</td>
                          <td>{row.mock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="plan-note">{course.interview_plan.note}</p>
                <h3 className="plan-rules-title">Daily rule</h3>
                <ul className="check-list">
                  {course.interview_plan.rules.map((rule) => (
                    <li key={rule}>
                      <Icon name="check" size={16} stroke={2.5} />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {course.syllabus?.length ? (
              <div className="detail-block">
                <h2>Course Content</h2>
                <div className="syllabus">
                  {course.syllabus.map((section) => (
                    <section key={section.number} className="syllabus-section">
                      <h3>
                        <span>SECTION {section.number}</span>
                        {section.title}
                      </h3>
                      <ol>
                        {section.topics.map((topic) => (
                          <li key={topic.number}>
                            <span className="topic-no">{topic.number}</span>
                            <div>
                              <p>{topic.title}</p>
                              {topic.projects?.map((project) => (
                                <p key={project} className="topic-project">
                                  <span>PROJECT</span>
                                  {project}
                                </p>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              </div>
            ) : (
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
            )}

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
