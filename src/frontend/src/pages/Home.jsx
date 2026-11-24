import { Link } from "react-router-dom";
import Icon, { WhatsAppIcon } from "../components/Icon";
import { openWhatsApp } from "../whatsapp";

const TOOLS = [
  { name: "AWS", file: "aws.svg" },
  { name: "Kubernetes", file: "kubernetes.svg" },
  { name: "Docker", file: "docker.svg" },
  { name: "Terraform", file: "terraform.svg" },
  { name: "Jenkins", file: "jenkins.svg" },
  { name: "Helm", file: "helm.svg" },
  { name: "GitHub", file: "github.svg", mono: true },
  { name: "GitLab", file: "gitlab.svg" },
  { name: "Ansible", file: "ansible.svg", mono: true },
  { name: "Git", file: "git.svg" },
  { name: "Azure", file: "azure.svg" },
  { name: "Python", file: "python.svg" },
  { name: "Prometheus", file: "prometheus.svg" },
  { name: "Grafana", file: "grafana.svg" },
  { name: "SonarQube", file: "sonarqube.svg" },
  { name: "Linux", file: "linux.svg" },
];

const FEATURES = [
  {
    icon: "code",
    title: "Real projects",
    text: "Learn live and ship work that looks like production.",
  },
  {
    icon: "user",
    title: "Clear roadmap",
    text: "Step-by-step from basics to job-ready cloud & DevOps.",
  },
  {
    icon: "award",
    title: "Certificate",
    text: "Finish with a completion certificate for your profile.",
  },
];

const GOALS = [
  {
    emoji: "\uD83C\uDFAF",
    title: "Learn from scratch",
    copy: "Live labs for AWS, CI/CD, and AI.",
    cta: "See training",
  },
  {
    emoji: "\uD83D\uDEE0\uFE0F",
    title: "Unblock work tasks",
    copy: "1:1 help on tickets, pipelines, infra.",
    cta: "Get job support",
  },
  {
    emoji: "\uD83D\uDE80",
    title: "Prep for interviews",
    copy: "45-day drills or offline Q&A pack.",
    cta: "Start interview prep",
  },
];

const TERM_LINES = [
  { prompt: true, text: "devopsmate@live:~$ pipeline run --prod" },
  { dim: true, text: "✓ git push origin main" },
  { dim: true, text: "✓ terraform apply  ·  infra ready" },
  { dim: true, text: "✓ kubectl rollout  ·  pods healthy" },
  { accent: true, text: "→ AI review: no blockers · ship it" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-home">
          <span className="hero-eyebrow reveal">
            <span className="dot" aria-hidden="true" />
            Enrollment is open
          </span>
          <h1 className="hero-title reveal d1">Welcome to DevOpsMate</h1>
          <p className="hero-lead reveal d1">Production-Ready AWS, DevOps &amp; AI Mentorship.</p>
          <p className="hero-cred reveal d2">
            Live training, 1:1 job support, and 45-day interview drills led by me (DevOps Engineer @ Bayer,
            Ex-HCLTech Lead · 3x AWS Certified · Terraform &amp; GitHub Certified · AI-First DevOps)
          </p>
          <div className="hero-actions reveal d2">
            <Link to="/courses" className="btn btn-primary btn-lg">
              Explore Services
              <Icon name="arrowRight" size={18} />
            </Link>
            <button
              type="button"
              className="btn btn-wa btn-lg"
              onClick={() => openWhatsApp("Hi DevOpsMate, I came from the homepage.")}
            >
              <WhatsAppIcon />
              Chat on WhatsApp
            </button>
          </div>

          <div className="live-terminal reveal d3" aria-label="Live DevOps Terminal">
            <div className="live-terminal-bar">
              <span className="live-terminal-dot red" />
              <span className="live-terminal-dot yellow" />
              <span className="live-terminal-dot green" />
              <span className="live-terminal-title">Live DevOps Terminal</span>
            </div>
            <div className="live-terminal-body">
              {TERM_LINES.map((line) => (
                <p
                  key={line.text}
                  className={
                    line.prompt ? "term-prompt" : line.accent ? "term-accent" : line.dim ? "term-dim" : ""
                  }
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section home-split">
        <div className="container home-split-grid">
          <div className="home-split-col home-programs">
            <div className="section-head">
              <p className="eyebrow">Start here</p>
              <h2 className="section-title">What do you need right now?</h2>
              <p className="section-sub">Pick one path. We&apos;ll take you to the right service.</p>
            </div>
            <div className="home-goals">
              {GOALS.map((g) => (
                <Link key={g.title} to="/courses" className="home-goal panel">
                  <span className="home-goal-emoji" aria-hidden="true">
                    {g.emoji}
                  </span>
                  <span className="home-goal-title">{g.title}</span>
                  <span className="home-goal-copy">{g.copy}</span>
                  <span className="home-goal-cta">
                    {g.cta}
                    <Icon name="arrowRight" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="home-split-col home-approach">
            <div className="section-head">
              <p className="eyebrow">The approach</p>
              <h2 className="section-title">How DevOpsMate works</h2>
              <p className="section-sub">Projects first. A clear path. Proof you can show.</p>
            </div>
            <div className="features home-approach-features">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature">
                  <div className="feature-icon">
                    <Icon name={f.icon} size={22} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section home-platforms">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">The platforms</p>
            <h2 className="section-title">Tools used across modern engineering teams</h2>
            <p className="section-sub">
              AWS, Kubernetes, Terraform, CI/CD, and the platforms teams rely on in production.
            </p>
          </div>
        </div>
        <div className="marquee" aria-label="Popular DevOps tools">
          <div className="marquee-track">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className={t.mono ? "tool mono" : "tool"}
                aria-hidden={i >= TOOLS.length}
              >
                <img src={`/tools/${t.file}`} alt={t.name} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
