import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../auth";
import EnrollConsentModal from "../components/EnrollConsentModal";
import Icon, { WhatsAppIcon } from "../components/Icon";
import { openWhatsApp, packPaymentMessage } from "../whatsapp";

const PACK_SLUG = "interview-qa-offline";

export default function PayPack() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    apiFetch("/api/commerce/pack/pay-info")
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token, navigate]);

  async function confirmPay() {
    setBusy(true);
    setError("");
    try {
      let current = order;
      if (!current) {
        current = await apiFetch("/api/commerce/pack/checkout", {
          token,
          method: "POST",
          body: {
            accept_terms: true,
            accept_refund: true,
            email: user?.email || "",
            buyer_name: user?.full_name || "",
          },
        });
        setOrder(current);
      }
      openWhatsApp(
        packPaymentMessage({
          user,
          orderId: current.id,
          amount: current.total_inr,
          upiId: info?.upi_id,
        })
      );
      setMsg(
        `Order ${current.id} ready. Pay via UPI, then send the payment screenshot on WhatsApp. The ZIP is emailed only after we approve.`
      );
      setPending(false);
    } catch (e) {
      setError(e.message);
      setPending(false);
    } finally {
      setBusy(false);
    }
  }

  if (!info && !error) {
    return (
      <div className="page">
        <div className="container muted">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <Link to={`/courses/${PACK_SLUG}`} className="text-link">
          <Icon name="arrowLeft" size={16} />
          Back to pack details
        </Link>
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Pay for Interview Q&amp;A pack
        </h1>
        <p className="page-sub">
          Pay with UPI, then WhatsApp your payment screenshot with Order ID. After we verify and approve, the ZIP is
          emailed to you.
        </p>
        <div className="flash warn">
          <strong>Important:</strong> After UPI payment, <strong>share the receipt / screenshot on WhatsApp</strong>{" "}
          (+91 80889 29670). We verify there, then approve in admin — ZIP is emailed only after approval.
        </div>

        {msg ? <div className="flash ok">{msg}</div> : null}
        {error ? <div className="flash error">{error}</div> : null}

        {info ? (
          <div className="panel" style={{ marginTop: 20 }}>
            <h2 className="panel-title">{info.title}</h2>
            <p>
              Amount: <strong>₹{info.price_inr}</strong>
            </p>
            <p className="upi-highlight">
              UPI: {info.upi_id}
              {info.upi_id_alt ? ` / ${info.upi_id_alt}` : ""}
            </p>
            <p className="muted" style={{ fontSize: 14 }}>
              Delivery email: <strong>{user?.email}</strong>
            </p>
            {order ? (
              <p>
                Order ID: <strong>{order.id}</strong> · Status: <strong>{order.status}</strong>
              </p>
            ) : null}
            <button type="button" className="btn btn-wa btn-lg btn-block" onClick={() => setPending(true)} disabled={busy}>
              <WhatsAppIcon />
              {order ? "Open WhatsApp again" : "Pay & send screenshot on WhatsApp"}
            </button>
            <Link to="/orders" className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
              View my orders
            </Link>
          </div>
        ) : null}
      </div>

      <EnrollConsentModal
        open={pending}
        title="Confirm pack purchase"
        loading={busy}
        onCancel={() => setPending(false)}
        onConfirm={confirmPay}
      />
    </div>
  );
}
