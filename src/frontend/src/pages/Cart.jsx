import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useCart } from "../cart";
import EnrollConsentModal from "../components/EnrollConsentModal";
import { WhatsAppIcon } from "../components/Icon";
import { enrollmentMessage, openWhatsApp } from "../whatsapp";

export default function Cart() {
  const { token, user } = useAuth();
  const { cart, remove, checkout } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const count = cart.item_count || cart.items.length;

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
          <h1 className="page-title">Selected programs</h1>
        </div>

        <div className="panel reveal d1">
          {!token ? (
            <div className="empty">
              Sign in to view the programs you have selected.
              <div>
                <Link to="/login" className="btn btn-primary">
                  Log in
                </Link>
              </div>
            </div>
          ) : !cart.items.length ? (
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
                {cart.items.map((item) => (
                  <div key={item.course_id} className="list-row">
                    <Link to={`/courses/${item.slug}`}>
                      <strong>{item.title}</strong>
                    </Link>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(item.course_id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {error ? <div className="flash error">{error}</div> : null}
              <div className="summary-bar">
                <span className="muted">
                  {count} service{count === 1 ? "" : "s"} selected
                </span>
                <button type="button" className="btn btn-wa btn-lg" onClick={openConsent} disabled={loading}>
                  <WhatsAppIcon />
                  {loading ? "Confirming..." : "Send request on WhatsApp"}
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
