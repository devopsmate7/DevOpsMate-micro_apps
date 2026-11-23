import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Icon from "../components/Icon";

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
    title: "Real-time with more projects",
    text: "Learn live, build often, and ship production-style work instead of toy demos.",
  },
  {
    icon: "user",
    title: "Clear career path roadmap",
    text: "A step-by-step path from fundamentals to job-ready skills for cloud and DevOps roles.",
  },
  {
    icon: "award",
    title: "Certificate of completion",
    text: "A formal record of the program you complete, ready to present with your profile.",
  },
];

const PATHS = [
  {
    label: "Train",
    title: "AWS + DevOps + AI",
    copy: "Production-shaped training across cloud, delivery, and AI practice.",
  },
  {
    label: "Support",
    title: "Job Support",
    copy: "Hands-on help for real work tasks and delivery blockers.",
  },
  {
    label: "Interview",
    title: "45-days interview plan",
    copy: "A hard drill to prepare answers, systems, and confidence.",
  },
  {
    label: "Pack",
    title: "Offline Interview Q&A",
    copy: "Downloadable Q&A pack delivered by email after UPI approval.",
  },
  {
    label: "1:1",
    title: "1:1 Connect",
    copy: "Book 15 or 40 min on Zoom — normal or priority pricing.",
  },
];

export default function Home() {
  const { token } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow reveal">
            <span className="dot" aria-hidden="true" />
            Enrollment is open
          </span>
          <p className="hero-welcome reveal d1">Welcome to</p>
          <h1 className="hero-title reveal d1">DevOpsMate</h1>
        </div>
      </section>

      <section className="section home-programs">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Programs</p>
            <h2 className="section-title">Pick your starting point</h2>
            <p className="section-sub">
              Train, get job support, prep interviews, or grab the offline Q&A pack — full details on
              Services.
            </p>
          </div>
          <div className="home-paths">
            {PATHS.map((p) => (
              <Link key={p.title} to="/courses" className="home-path panel">
                <span className="home-path-label">{p.label}</span>
                <span className="home-path-title">{p.title}</span>
                <span className="home-path-copy">{p.copy}</span>
              </Link>
            ))}
          </div>
          <div className="hero-actions reveal" style={{ marginTop: 28, justifyContent: "center" }}>
            <Link to="/courses" className="btn btn-primary btn-lg">
              Browse services
              <Icon name="arrowRight" size={18} />
            </Link>
            {token ? null : (
              <Link to="/signup" className="btn btn-secondary btn-lg">
                Create an account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section home-approach">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">The approach</p>
            <h2 className="section-title">Real projects. Clear path. Job-ready skills.</h2>
          </div>
          <div className="features">
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
