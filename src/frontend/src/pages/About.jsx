import { Link } from "react-router-dom";

const CERTS = [
  { icon: "☁️", label: "3x AWS Certified" },
  { icon: "🏗️", label: "Terraform Certified" },
  { icon: "🐙", label: "GitHub Certified" },
  { icon: "🤖", label: "Anthropic AI Builder" },
];

const JOURNEY = [
  { step: "01", title: "TCS", note: "Enterprise start" },
  { step: "02", title: "Infinite", note: "Cloud foundations" },
  { step: "03", title: "HCLTech", note: "Lead Engineer" },
  { step: "04", title: "Bayer", note: "Platform & AI Builder", current: true },
];

export default function About() {
  return (
    <div className="page">
      <div className="container">
        <div className="about-bento panel reveal">
          <div className="about-bento-grid">
            <aside className="about-side">
              <div className="about-avatar" aria-hidden="true">
                BR
              </div>
              <span className="about-status">
                <span className="dot" />
                Freelance &amp; Mentorship Open
              </span>
              <h1 className="about-name">
                Balu Reddy <span>(He/Him)</span>
              </h1>
              <p className="about-role">DevOps Engineer @ Bayer</p>
              <p className="about-tag">Freelance &amp; Platform Engineer · 5+ Yrs Exp</p>
              <div className="about-links">
                <a
                  href="https://github.com/devopsmate7"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  GitHub ↗
                </a>
                <a
                  href="https://www.linkedin.com/in/devopsmate7"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  LinkedIn ↗
                </a>
              </div>
              <div className="about-certs">
                <p className="about-label">Verified Certifications</p>
                <div className="chip-row">
                  {CERTS.map((c) => (
                    <span key={c.label} className="chip">
                      {c.icon} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            <div className="about-main">
              <p className="about-label">My Approach</p>
              <div className="about-approach">
                <article className="about-card">
                  <h2>🛠️ Hands-On Production &amp; Freelance Delivery</h2>
                  <p>
                    I believe the only way to master DevOps is by shipping real production infrastructure.
                    Through my enterprise roles and freelance consulting, I design, automate, and
                    troubleshoot live cloud environments—bringing real-world execution into every
                    DevOpsMate lab, mentoring session, and interview drill.
                  </p>
                </article>
                <article className="about-card">
                  <h2>🤖 AI-First DevOps Engineering</h2>
                  <p>
                    Modern cloud engineering goes beyond manual scripts. I pair battle-tested AWS,
                    Terraform, and Kubernetes architectures with AI-first development workflows using
                    Anthropic Claude Code and Cursor to build, debug, and ship faster.
                  </p>
                </article>
              </div>

              <p className="about-label" style={{ marginTop: 18 }}>
                Career Journey
              </p>
              <div className="about-journey">
                {JOURNEY.map((j) => (
                  <div key={j.step} className={`about-step ${j.current ? "current" : ""}`}>
                    <span className="about-step-num">{j.step}</span>
                    <strong>{j.title}</strong>
                    <span>{j.note}</span>
                  </div>
                ))}
              </div>
              <p className="about-journey-line muted">
                TCS → Infinite → HCLTech Lead Engineer → Current Bayer Platform Engineer &amp; AI Builder
              </p>

              <div className="about-cta">
                <p>When you are ready to begin, explore programs or chat directly.</p>
                <Link to="/courses" className="btn btn-primary">
                  View Programs →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
