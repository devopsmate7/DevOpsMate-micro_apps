import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Backdrop from "../components/Backdrop";
import Icon from "../components/Icon";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/courses", { replace: true }), 3200);
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
          <h1>Welcome to DevOpsMate</h1>
          <p>Your account is ready. You will be taken to the programs.</p>
        </div>
      </div>
    </div>
  );
}
