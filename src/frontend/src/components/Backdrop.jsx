export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bd-grid" />
      <div className="bd-sparkles">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className={`bd-star s${i + 1}`} />
        ))}
      </div>
      <span className="bd-glow g1" />
      <span className="bd-glow g2" />
      <span className="bd-glow g3" />
      <span className="bd-glow g4" />
      <span className="bd-glow g5" />
      <span className="bd-line l1" />
      <span className="bd-line l2" />
      <span className="bd-line l3" />
    </div>
  );
}
