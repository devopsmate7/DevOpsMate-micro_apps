import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import Icon, { WhatsAppIcon } from "../components/Icon";
import { buildUpiUri, qrImageUrl, UPI_ALT, UPI_PRIMARY } from "../upi";
import { enrollPaymentMessage, openWhatsApp } from "../whatsapp";

export default function Enroll() {
  const { slug } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState("terms"); // terms | pay | done
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: `/enroll/${slug}` } });
      return;
    }
    if (slug === "1on1-connect") {
      navigate("/book/1on1", { replace: true });
      return;
    }
    apiFetch(`/api/commerce/enroll/pay-info/${slug}`)
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token, slug, navigate]);

  const upiId = info?.upi_id || UPI_PRIMARY;
  const upiAlt = info?.upi_id_alt || UPI_ALT;
  const amount = order?.total_inr ?? info?.price_inr ?? 0;
  const ref = order?.id || "PENDING";

  const upiUri = useMemo(
    () =>
      buildUpiUri({
        pa: upiId,
        am: amount,
        tr: ref,
        tn: `${info?.title || "DevOpsMate"} ${ref}`,
      }),
    [upiId, amount, ref, info?.title]
  );

  async function startPay() {
    if (!agreed || !info) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiFetch("/api/commerce/enroll/checkout", {
        token,
        method: "POST",
        body: {
          slug,
          accept_terms: true,
          accept_refund: true,
          email: user?.email || "",
          buyer_name: user?.full_name || "",
        },
      });
      setOrder(data);
      setStep("pay");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function markPaid() {
    setStep("done");
  }

  function shareWhatsApp() {
    if (!order) return;
    openWhatsApp(
      enrollPaymentMessage({
        user,
        orderId: order.id,
        amount: order.total_inr,
        title: info?.title,
        upiId,
      })
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="page">
      <div className="container enroll-wrap">
        <Link to={`/courses/${slug}`} className="text-link">
          <Icon name="arrowLeft" size={16} />
          Back
        </Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>
          Enroll{info ? ` · ${info.title}` : ""}
        </h1>
        <p className="page-sub">Terms → pay via UPI QR → WhatsApp screenshot → we confirm in admin.</p>
        {error ? <div className="flash error">{error}</div> : null}

        {step === "terms" ? (
          <div className="panel enroll-panel">
            <p>
              Amount: <strong>{info ? `₹${Number(info.price_inr).toLocaleString("en-IN")}` : "…"}</strong>
            </p>
            <label className="consent-check" htmlFor="enroll-terms">
              <input
                id="enroll-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I agree to the <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy</Link>, and{" "}
                <Link to="/refund">Refund</Link> policies.
              </span>
            </label>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              disabled={!agreed || busy || !info}
              onClick={startPay}
            >
              {busy ? "Creating order…" : "Agree & Continue"}
            </button>
          </div>
        ) : null}

        {step === "pay" && order ? (
          <div className="panel enroll-panel">
            <p className="enroll-order-id">
              Order <strong>{order.id}</strong> · ₹{order.total_inr}
            </p>
            <div className="enroll-qr">
              <img src={qrImageUrl(upiUri, 220)} alt="UPI payment QR" width={220} height={220} />
            </div>
            <p className="upi-highlight enroll-upi">
              UPI: {upiId}
              {upiAlt ? ` / ${upiAlt}` : ""}
            </p>
            <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
              Scan QR or pay the UPI IDs above. Include order id in the note if asked.
            </p>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={markPaid}>
              I&apos;ve paid
            </button>
          </div>
        ) : null}

        {step === "done" && order ? (
          <div className="panel enroll-panel">
            <div className="flash ok">Payment noted. Share the screenshot on WhatsApp so we can confirm.</div>
            <p className="enroll-order-id">
              Order <strong>{order.id}</strong> · ₹{order.total_inr}
            </p>
            <p className="upi-highlight enroll-upi">
              UPI: {upiId}
              {upiAlt ? ` / ${upiAlt}` : ""}
            </p>
            <button type="button" className="btn btn-wa btn-lg btn-block" onClick={shareWhatsApp}>
              <WhatsAppIcon />
              Share on WhatsApp
            </button>
            <Link to="/orders" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
              My enrollments
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
