import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Icon from "../components/Icon";

const PILLARS = [
  {
    title: "The curriculum",
    text: "Cloud, CI/CD, containers, infrastructure as code, and the AI tooling used in day-to-day engineering.",
  },
  {
    title: "The support",
    text: "Individual guidance for interviews, and practical help when delivery work needs a considered review.",
  },
  {
    title: "The enrollment",
    text: "Create an account, select a program, and confirm on WhatsApp. The process is direct and clear.",
  },
];

const VALUES = ["Production-first labs", "Small, focused batches", "Industry mentors", "Support after training"];

export default function About() {
  const { token } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page-head center reveal">
          <p className="eyebrow">About DevOpsMate</p>
          <h1 className="page-title">Prepared for production roles</h1>
        </div>

        <p className="about-statement reveal d1">
          We guide engineers from classroom concepts to production work.{" "}
          <em>
            AWS, DevOps, and AI training, together with job support and interview preparation, delivered the
            way engineering teams operate.
          </em>
        </p>

        <div className="chip-row reveal d2" style={{ justifyContent: "center", marginTop: 32 }}>
          {VALUES.map((v) => (
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
          <p>Review the programs and submit your enrollment at a time that suits you.</p>
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
