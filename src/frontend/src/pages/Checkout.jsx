import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import EnrollConsentModal from "../components/EnrollConsentModal";
import { WhatsAppIcon } from "../components/Icon";
import { enrollmentMessage, openWhatsApp } from "../whatsapp";

export default function Checkout() {
  const { token, user } = useAuth();
  const { cart, checkout } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  function openConsent() {
    setError("");
    setShowConsent(true);
  }

  async function sendWhatsApp() {
    setLoading(true);
    try {
      openWhatsApp(enrollmentMessage({ user, items: cart.items }));
      await checkout({ accept_terms: true, accept_refund: true });
      setShowConsent(false);
      navigate("/orders?placed=1");
    } catch (err) {
      setError(err.message || "Could not confirm enrollment. Please try again.");
      setShowConsent(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="page-head reveal">
          <p className="eyebrow">Enrollment</p>
          <h1 className="page-title">Confirm enrollment</h1>
          <p className="page-sub">
            Submitting as {user?.full_name} ({user?.email})
          </p>
        </div>

        <div className="panel reveal d1">
          {error ? <div className="flash error">{error}</div> : null}
          {!cart.items.length ? (
            <div className="empty">
              No program selected yet.
              <div>
                <Link to="/courses" className="btn btn-primary">
                  View programs
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="list">
                {cart.items.map((i) => (
                  <div key={i.course_id} className="list-row">
                    <strong>{i.title}</strong>
                  </div>
                ))}
              </div>
              <div className="summary-bar">
                <span className="muted">Your request is sent to the team on WhatsApp.</span>
                <button className="btn btn-wa btn-lg" type="button" onClick={openConsent} disabled={loading}>
                  <WhatsAppIcon />
                  {loading ? "Confirming..." : "Confirm on WhatsApp"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <EnrollConsentModal
        open={showConsent}
        title="Confirm enrollment"
        loading={loading}
        onCancel={() => setShowConsent(false)}
        onConfirm={sendWhatsApp}
      />
    </div>
  );
}
