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
    icon: "user",
    title: "Practitioner-led instruction",
    text: "Sessions led by engineers who have delivered cloud and DevOps work in industry.",
  },
  {
    icon: "code",
    title: "Applied project work",
    text: "Cloud, delivery, web apps, and AI projects structured the way operating teams build them.",
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
    label: "Build",
    title: "Website Building",
    copy: "Design and ship a site you can maintain after launch.",
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
          <p className="hero-lead reveal d2">
            Hands-on AWS, DevOps, and AI training — plus website building, job support, and a 45-days
            interview plan — so you build skills production teams actually use.
          </p>
          <div className="hero-actions reveal d3">
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
            <h2 className="section-title">Training shaped by production practice</h2>
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

      <section className="section home-programs">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Programs</p>
            <h2 className="section-title">Pick your starting point</h2>
            <p className="section-sub">Join a live track, get job support, or prep interviews — full details on Services.</p>
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
        </div>
      </section>

      <section className="section home-platforms">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">The platforms</p>
            <h2 className="section-title">Tools used across modern engineering teams</h2>
            <p className="section-sub">AWS, Kubernetes, Terraform, CI/CD, and the platforms teams rely on in production.</p>
          </div>
        </div>
        <div className="marquee" aria-label="Popular DevOps tools">
          <div className="marquee-track">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <div key={`${t.name}-${i}`} className={t.mono ? "tool mono" : "tool"} aria-hidden={i >= TOOLS.length}>
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
