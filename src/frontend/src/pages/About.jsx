import { Link } from "react-router-dom";

const CERTS = [
  { icon: "☁️", label: "3x AWS Certified" },
  { icon: "🏗️", label: "Terraform Certified" },
  { icon: "🐙", label: "GitHub Certified" },
  { icon: "🤖", label: "Anthropic AI Builder" },
];

export default function About() {
  return (
    <div className="page">
      <div className="container">
        <div className="about-modern reveal">
          <div className="about-hero-block">
            <div className="about-left">
              <div className="about-avatar">
                <img src="/balu-profile.jpg" alt="Balu Reddy" />
              </div>
              <p className="about-under">Freelance &amp; Mentorship for Aws DevOps</p>
            </div>
            <div className="about-hero-copy">
              <h1 className="about-name">
                Balu Reddy <span>(He/Him)</span>
              </h1>
              <p className="about-role">DevOps Engineer @ Bayer</p>
              <p className="about-tag">Freelance &amp; Platform Engineer · 5+ Yrs Exp</p>
              <p className="about-flow-line">
                <span>TCS</span>
                <em>→</em>
                <span>Infinite</span>
                <em>→</em>
                <b>HCLTech Lead Engineer</b>
                <em>→</em>
                <strong>Current Bayer Platform Engineer &amp; AI Builder</strong>
              </p>
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
            </div>
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

          <div className="about-approach-modern">
            <article>
              <h2>
                <span>🛠️</span> Hands-On Production &amp; Freelance Delivery
              </h2>
              <p>
                I believe the only way to master DevOps is by shipping real production infrastructure.
                Through my enterprise roles and freelance consulting, I design, automate, and troubleshoot
                live cloud environments—bringing real-world execution into every DevOpsMate lab, mentoring
                session, and interview drill.
              </p>
            </article>
            <article>
              <h2>
                <span>🤖</span> AI-First DevOps Engineering
              </h2>
              <p>
                Modern cloud engineering goes beyond manual scripts. I pair battle-tested{" "}
                <strong>AWS, Terraform, and Kubernetes</strong> architectures with AI-first workflows using{" "}
                <strong>Anthropic Claude Code</strong> and <strong>Cursor</strong> to build, debug, and ship
                faster.
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
  );
}
