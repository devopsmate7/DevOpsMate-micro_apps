export default function Backdrop({ light = false }) {
  return (
    <div className={light ? "backdrop backdrop--light" : "backdrop"} aria-hidden="true">
      {light ? (
        <>
          <div className="bd-grid bd-grid--light" />
          <span className="bd-glow-light g1" />
          <span className="bd-glow-light g2" />
        </>
      ) : (
        <>
          <div className="bd-grid" />
          <span className="bd-glow g1" />
          <span className="bd-glow g2" />
          <span className="bd-glow g3" />
          <span className="bd-glow g4" />
          <span className="bd-glow g5" />
          <span className="bd-line l1" />
          <span className="bd-line l2" />
          <span className="bd-line l3" />
        </>
      )}
    </div>
  );
}
