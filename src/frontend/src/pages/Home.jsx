import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import Icon, { SERVICE_ICON } from "../components/Icon";

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

export default function Home() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    apiFetch("/api/catalog/courses")
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

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
            AWS, DevOps, and AI training — plus website building, job support, and a 45-days interview
            plan — grounded in production practice so the skills you build are ready for the role.
          </p>
          <div className="hero-actions reveal d3">
            <Link to="/courses" className="btn btn-primary btn-lg">
              View programs
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

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Services</p>
            <h2 className="section-title">Four offerings for every stage</h2>
            <p className="section-sub">
              Training, web delivery, day-to-day job support, and interview hard drills — pick what
              matches your goal.
            </p>
          </div>
          <div className="service-grid">
            {courses.map((c, i) => (
              <article key={c.id} className={`service-card reveal d${Math.min(i + 1, 3)}`}>
                <div className="service-top">
                  <span className="service-icon">
                    <Icon name={SERVICE_ICON[c.slug] || "layers"} size={18} />
                  </span>
                  {c.badge ? <span className="badge">{c.badge}</span> : null}
                </div>
                <div>
                  <h2 className="service-title">
                    <Link to={`/courses/${c.slug}`}>{c.title}</Link>
                  </h2>
                  <p className="service-copy">{c.subtitle}</p>
                </div>
                <div className="chip-row">
                  <span className="chip">{c.duration}</span>
                  <span className="chip">{c.mode}</span>
                </div>
                <div className="service-actions">
                  <Link to={`/courses/${c.slug}`} className="btn btn-secondary">
                    Details
                  </Link>
                  <Link to="/courses" className="btn btn-wa">
                    Enroll
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">The approach</p>
            <h2 className="section-title">Training shaped by production practice</h2>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <div className="feature-icon">
                  <Icon name={f.icon} size={24} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
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
