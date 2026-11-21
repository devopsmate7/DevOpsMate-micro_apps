import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Icon from "../components/Icon";

const PILLARS = [
  {
    title: "The curriculum",
    text: "AWS cloud, DevOps delivery, and AI tooling used in day-to-day engineering.",
  },
  {
    title: "The support",
    text: "1:1 job support for tickets and pipelines, plus a 45-days interview plan with project storytelling and behavioral drills.",
  },
  {
    title: "The enrollment",
    text: "Create an account, choose a service, and confirm on WhatsApp — or pay UPI for the offline Q&A pack.",
  },
];

const VALUES = [
  "AWS + DevOps + AI",
  "Job Support",
  "45-days interview plan",
  "Offline Interview Q&A",
];

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
            AWS, DevOps, and AI training, job support, a 45-days interview plan, and an offline Q&A pack
            — delivered the way engineering teams operate.
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
          <p>Review the services and submit your enrollment at a time that suits you.</p>
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
