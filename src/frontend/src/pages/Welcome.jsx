import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Backdrop from "../components/Backdrop";
import Icon from "../components/Icon";

export default function Welcome() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromLogin = params.get("from") === "login";

  useEffect(() => {
    const t = setTimeout(() => navigate("/courses", { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="site">
      <Backdrop />
      <div className="welcome-screen">
        <div className="welcome-card reveal">
          <div className="welcome-icon">
            <Icon name="check" size={30} stroke={3} />
          </div>
          <h1>{fromLogin ? "You are signed in" : "Welcome to DevOpsMate"}</h1>
          <p>{fromLogin ? "Taking you to your programs." : "Your account is ready."}</p>
        </div>
      </div>
    </div>
  );
}
