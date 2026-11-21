import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Icon from "../components/Icon";

const CERTS = [
  "GitHub",
  "Terraform Certified",
  "AWS Solutions Architect Certified",
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
          Experience | AI-First | Anthropic Claude Code & Cursor | Cloud Automation | Builder Mindset{" "}
          {"\uD83D\uDE80"}
        </p>

        <div className="chip-row reveal d2" style={{ justifyContent: "center", marginTop: 32 }}>
          {CERTS.map((v) => (
            <span key={v} className="chip">
              <Icon name="check" size={14} stroke={2.5} />
              {v}
            </span>
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
