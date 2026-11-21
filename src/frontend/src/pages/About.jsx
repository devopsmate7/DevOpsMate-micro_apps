import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Icon from "../components/Icon";

const HIGHLIGHTS = [
  "DevOps Engineer @ Bayer",
  "Ex-HCLTech Lead Engineer",
  "Ex-TCS · Ex-Infinite",
  "5+ years IT experience",
  "AWS & Terraform Certified",
  "AI-First · Claude Code & Cursor",
];

const PILLARS = [
  {
    title: "Cloud & automation",
    text: "AWS, Terraform, and cloud automation built with a production mindset — the same stacks used on the job.",
  },
  {
    title: "AI-first builder",
    text: "Working with Anthropic Claude Code, Cursor, and modern AI tooling to ship faster without losing engineering rigor.",
  },
  {
    title: "Career-ready training",
    text: "DevOpsMate packages real projects, job support, interview drills, and an offline Q&A pack for learners who want to grow.",
  },
];

export default function About() {
  const { token } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page-head center reveal">
          <p className="eyebrow">About me</p>
          <h1 className="page-title">Balu Reddy</h1>
          <p className="page-sub" style={{ marginTop: 8 }}>
            He/Him
          </p>
        </div>

        <p className="about-statement reveal d1">
          DevOps Engineer @Bayer | Ex-HCLTech Lead Engineer | Ex-TCS | Ex-Infinite | 5+ Years IT
          Experience | AWS & Terraform Certified | AI-First | Anthropic Claude Code & Cursor | Cloud
          Automation | Builder Mindset {"\uD83D\uDE80"}
        </p>

        <div className="chip-row reveal d2" style={{ justifyContent: "center", marginTop: 32 }}>
          {HIGHLIGHTS.map((v) => (
            <span key={v} className="chip">
              <Icon name="check" size={14} stroke={2.5} />
              {v}
            </span>
          ))}
        </div>

        <div className="pillars">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="pillar">
              <p className="pillar-num">{String(i + 1).padStart(2, "0")}</p>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>

        <div className="cta-band">
          <h2>When you are ready to begin</h2>
          <p>Review the services and enroll when it suits you.</p>
          <div className="hero-actions">
            <Link to="/courses" className="btn btn-primary btn-lg">
              View programs
            </Link>
            {token ? null : (
              <Link to="/signup" className="btn btn-secondary btn-lg">
                Create an account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
