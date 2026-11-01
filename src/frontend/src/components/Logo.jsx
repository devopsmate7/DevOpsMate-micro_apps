export default function Logo({ size = 44, className = "" }) {
  return (
    <span className={`logo-tile ${className}`} style={{ width: size, height: size }}>
      <img src="/logo-white.png?v=2" alt="DevOpsMate" />
    </span>
  );
}
