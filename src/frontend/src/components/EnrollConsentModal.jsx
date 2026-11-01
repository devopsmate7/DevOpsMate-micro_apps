import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function EnrollConsentModal({ open, title, subtitle, loading, onCancel, onConfirm }) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Confirm enrollment"}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">{title || "Before you continue"}</h3>
        <p className="modal-sub">
          {subtitle || "Please review and accept our policies before we take you to WhatsApp."}
        </p>
        <label className="consent-check" htmlFor="enroll-consent-modal">
          <input
            id="enroll-consent-modal"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I have read and agree to the{" "}
            <Link to="/terms" target="_blank" rel="noreferrer">
              Terms and Conditions
            </Link>
            ,{" "}
            <Link to="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </Link>
            , and{" "}
            <Link to="/refund" target="_blank" rel="noreferrer">
              Refund Policy
            </Link>
            .
          </span>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-wa" disabled={!agreed || loading} onClick={onConfirm}>
            {loading ? "Confirming..." : "Agree & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
