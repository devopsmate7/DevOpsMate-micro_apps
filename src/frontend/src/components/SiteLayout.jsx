import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import Backdrop from "./Backdrop";
import Logo from "./Logo";
import NoticeBar from "./NoticeBar";
import { WhatsAppIcon } from "./Icon";

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/devopsmate7",
    d: "M12 .5A11.5 11.5 0 0 0 .5 12.4c0 5.25 3.4 9.7 8.12 11.27.6.12.82-.26.82-.58v-2.03c-3.3.72-4-1.6-4-1.6-.54-1.38-1.32-1.75-1.32-1.75-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.06 1.83 2.79 1.3 3.47 1 .1-.78.42-1.3.76-1.6-2.64-.3-5.42-1.34-5.42-5.96 0-1.32.46-2.4 1.22-3.24-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.23a11.3 11.3 0 0 1 6 0c2.28-1.55 3.28-1.23 3.28-1.23.66 1.64.25 2.86.12 3.16.76.84 1.22 1.92 1.22 3.24 0 4.63-2.79 5.65-5.45 5.95.43.38.81 1.12.81 2.26v3.35c0 .32.2.7.82.58A11.5 11.5 0 0 0 23.5 12.4 11.5 11.5 0 0 0 12 .5z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Devopsmate7",
    d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/devopsmate7",
    d: "M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.64 4.75 6.07V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.5V23h-4V8.5z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/devopsmate7",
    d: "M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-3.2 1.6-4.8 4.9-4.9 1.3-.1 1.7-.1 4.9-.1zm0 1.8c-3.1 0-3.5 0-4.7.1-2.2.1-3.2 1.1-3.3 3.3-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 2.2 1.1 3.2 3.3 3.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3.2-1.1 3.3-3.3.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-2.2-1.1-3.2-3.3-3.3-1.2-.1-1.6-.1-4.7-.1zm0 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 7.9a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zm6.1-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z",
  },
  {
    label: "Email",
    href: "mailto:devopsmate7@gmail.com",
    d: "M3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4Zm.7 2 7.8 5.6L19.8 6H4.2ZM20 7.9l-7.4 5.3a1 1 0 0 1-1.2 0L4 7.9V18h16V7.9Z",
  },
];

export default function SiteLayout() {
  const { token, logout } = useAuth();

  return (
    <div className="site">
      <Backdrop />

      <div className="site-top">
        <NoticeBar />

        <header className="site-header">
          <div className="header-inner">
            <Link to="/" className="brand">
              <Logo size={64} className="brand-logo" />
              <span className="brand-text">
                <span className="brand-name">
                  DevOps<span className="wordmark-accent">Mate</span>
                </span>
                <span className="brand-tagline">Learn {"\u00B7"} Grow {"\u00B7"} Succeed</span>
              </span>
            </Link>

            <nav className="nav-links" aria-label="Main">
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/courses">Services</NavLink>
              <NavLink to="/about">About</NavLink>
            </nav>

            <div className="header-actions">
              {token ? (
                <>
                  <Link to="/profile" className="btn btn-ghost btn-sm">
                    Profile
                  </Link>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    Log in
                  </Link>
                  <Link to="/signup" className="btn btn-primary btn-sm">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="footer-title">
                DevOps<span className="wordmark-accent">Mate</span>
              </span>
              <span className="footer-tagline">Learn {"\u00B7"} Grow {"\u00B7"} Succeed</span>
              <p className="footer-about">
                Built by Balu Reddy — DevOps Engineer @ Bayer. AWS & Terraform certified, AI-first,
                with training, job support, and interview prep for engineers who want to grow.
              </p>
              <div className="social-row" aria-label="Social links">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    {...(s.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    aria-label={s.label}
                    title={s.label}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path fill="currentColor" d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-col footer-legal">
              <h4>Legal</h4>
              <ul>
                <li>
                  <Link to="/terms">Terms of use</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy policy</Link>
                </li>
                <li>
                  <Link to="/refund">Refund policy</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col footer-contact">
              <h4>Contact us</h4>
              <ul>
                <li>
                  <a href="mailto:devopsmate7@gmail.com">devopsmate7@gmail.com</a>
                </li>
                <li>
                  <a href="https://wa.me/918088929670" target="_blank" rel="noreferrer">
                    WhatsApp / Call +91 80889 29670
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col footer-enroll">
              <h4>Not sure where to start?</h4>
              <p className="footer-note">Message us on WhatsApp and we will help you pick the right service.</p>
              <a
                href="https://wa.me/918088929670"
                target="_blank"
                rel="noreferrer"
                className="btn btn-wa btn-sm"
              >
                <WhatsAppIcon size={16} />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">{"\u00A9"} 2026 DevOpsMate. All rights reserved.</p>
            <p className="footer-heart">
              Built for learners who ship <span aria-hidden="true">{"\u2665"}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}