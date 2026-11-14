import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import Backdrop from "../components/Backdrop";
import Icon from "../components/Icon";

const SIGNUP_WAIT_MS = 20000;
const LOGIN_WAIT_MS = 4000;

export default function Welcome() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { activateSession } = useAuth();
  const fromLogin = params.get("from") === "login";
  const waitMs = fromLogin ? LOGIN_WAIT_MS : SIGNUP_WAIT_MS;
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(waitMs / 1000));

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((waitMs - (Date.now() - started)) / 1000));
      setSecondsLeft(left);
    }, 250);

    const done = setTimeout(() => {
      const pendingToken = sessionStorage.getItem("dm_pending_token");
      const pendingUser = sessionStorage.getItem("dm_pending_user");
      if (pendingToken && pendingUser) {
        try {
          activateSession(pendingToken, JSON.parse(pendingUser));
        } catch {
          /* ignore bad pending payload */
        }
        sessionStorage.removeItem("dm_pending_token");
        sessionStorage.removeItem("dm_pending_user");
      }
      navigate("/courses", { replace: true });
    }, waitMs);

    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [activateSession, navigate, waitMs]);

  return (
    <div className="site">
      <Backdrop />
      <div className="welcome-screen">
        <div className="welcome-card reveal">
          <div className="welcome-icon">
            <Icon name="check" size={30} stroke={3} />
          </div>
          <h1>{fromLogin ? "You are signed in" : "Welcome to DevOpsMate"}</h1>
          <p>
            {fromLogin
              ? "Preparing your programs. Please wait a moment."
              : "Your account is ready. Please wait while we prepare your session."}
          </p>
          <p className="welcome-countdown" aria-live="polite">
            Continuing in {secondsLeft}s
          </p>
        </div>
      </div>
    </div>
  );
}
