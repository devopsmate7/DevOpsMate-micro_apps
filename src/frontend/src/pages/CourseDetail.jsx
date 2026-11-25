import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import Icon, { SERVICE_ICON } from "../components/Icon";

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch(`/api/catalog/courses/${slug}`)
      .then(setCourse)
      .catch((e) => setError(e.message));
  }, [slug]);

  function onEnrollClick() {
    if (course?.slug === "aws-devops-ai") return;
    if (!token) {
      navigate("/login");
      return;
    }
    if (course?.slug === "1on1-connect") {
      navigate("/book/1on1");
      return;
    }
    navigate(`/enroll/${course.slug}`);
  }

  function priceLabel() {
    if (!course) return "";
    if (course.price_display) return course.price_display;
    if (course.price_inr > 0) return `₹${Number(course.price_inr).toLocaleString("en-IN")}`;
    if (course.slug === "interview-support") return "₹9,999";
    return "Contact for fee";
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
                <div className="content-glass">
                  <h2>{course.interview_plan.title || "45-days interview plan"}</h2>
                  {course.interview_plan.intro.map((line) => (
                    <p key={line} className="plan-intro">{line}</p>
                  ))}
                  {course.interview_plan.rows?.length ? (
                    <div className="plan-table-wrap" style={{ overflowX: "auto", marginTop: 14 }}>
                      <table className="plan-table">
                        <thead>
                          <tr>
                            <th>Days</th>
                            <th>Module</th>
                            <th>Learn</th>
                            <th>Practice</th>
                            <th>Mock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {course.interview_plan.rows.map((row) => (
                            <tr key={`${row.days}-${row.topic}`}>
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
                  ) : null}
                  {course.interview_plan.note ? (
                    <p className="plan-note">{course.interview_plan.note}</p>
                  ) : null}
                  {course.interview_plan.rules?.length ? (
                    <>
                      <h3 className="plan-rules-title">Daily rule</h3>
                      <ul className="check-list plan-rules">
                        {course.interview_plan.rules.map((rule) => (
                          <li key={rule}>
                            <Icon name="check" size={16} stroke={2.5} />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {course.syllabus?.length ? (
              <div className="detail-block">
                <h2 className="content-heading">Course Content</h2>
                <div className="syllabus">
                  {course.syllabus.map((section) => (
                    <section key={section.number} className="syllabus-section content-glass">
                      <h3>
                        <span>SECTION {section.number}</span>
                        {section.title}
                      </h3>
                      <ol>
                        {section.topics.map((topic) => (
                          <li key={topic.number}>
                            <span className="topic-no">{topic.number}</span>
                            <div className="topic-body">
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
                <div className="content-glass">
                  <h2>Program outline</h2>
                  <ul className="check-list plan-rules">
                    {course.highlights.map((h) => (
                      <li key={h}>
                        <Icon name="check" size={16} stroke={2.5} />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="detail-block">
              <h2 className="content-heading">Included with this program</h2>
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
              {course.slug === "1on1-connect" ? "Book 1:1" : "Request enrollment"}
            </h2>
            <div style={{ margin: "4px 0 8px" }}>
              <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>{priceLabel()}</p>
              {course.pricing_note ? (
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {course.pricing_note}
                </p>
              ) : null}
            </div>
            {course.support_plans?.length ? (
              <ul className="check-list" style={{ marginBottom: 8 }}>
                {course.support_plans.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={14} stroke={2.5} />
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            <p>
              {course.slug === "aws-devops-ai"
                ? "Core program details are ready to explore. Enrollment opens soon."
                : course.slug === "1on1-connect"
                  ? "Pick a slot, pay via UPI QR, WhatsApp the screenshot — Zoom after admin accept."
                  : "Agree to terms, pay the UPI QR, WhatsApp the screenshot — we confirm in admin."}
            </p>
            {course.slug === "aws-devops-ai" ? (
              <p className="coming-soon-note">Coming soon</p>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={onEnrollClick}
              disabled={course.slug === "aws-devops-ai"}
            >
              {course.slug === "aws-devops-ai"
                ? "Coming soon"
                : course.slug === "1on1-connect"
                  ? "Book now"
                  : "Enroll now"}
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
    </div>
  );
}
