import { Link } from "react-router-dom";

const CERTS = [
  { icon: "☁️", label: "3x AWS Certified" },
  { icon: "🏗️", label: "Terraform Certified" },
  { icon: "🐙", label: "GitHub Certified" },
  { icon: "🤖", label: "Anthropic AI Builder" },
];

const FLOW = [
  { label: "TCS" },
  { label: "Infinite" },
  { label: "HCLTech Lead Engineer" },
  { label: "Bayer Platform Engineer & AI Builder", current: true },
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

              <div className="about-flow" aria-label="Career journey">
                {FLOW.map((item, i) => (
                  <span key={item.label} className="about-flow-item">
                    <span className={`about-flow-chip ${item.current ? "current" : ""}`}>{item.label}</span>
                    {i < FLOW.length - 1 ? <span className="about-flow-arrow" aria-hidden="true">→</span> : null}
                  </span>
                ))}
              </div>

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
                    <span key={c.label} className="chip about-cert-chip">
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
                <article className="about-card about-card-ai">
                  <h2>🤖 AI-First DevOps Engineering</h2>
                  <p>
                    Modern cloud engineering goes beyond manual scripts. I pair battle-tested AWS,
                    Terraform, and Kubernetes architectures with AI-first development workflows using
                    Anthropic Claude Code and Cursor to build, debug, and ship faster.
                  </p>
                </article>
              </div>

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
