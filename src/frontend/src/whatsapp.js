export const WHATSAPP_NUMBER = "918088929670";

export function openWhatsApp(message) {
  const text = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function enrollmentMessage({ user, items }) {
  const name = user?.full_name || "Student";
  const email = user?.email || "-";
  const mobile = user?.mobile || "-";
  const lines = (items || []).map((i) => `- ${i.title} (qty ${i.qty || 1})`);
  return [
    "Hi DevOpsMate, I want to enroll.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${mobile}`,
    "",
    "Selected service(s):",
    ...(lines.length ? lines : ["- (none selected)"]),
    "",
    "Please share next steps.",
  ].join("\n");
}

export function packPaymentMessage({ user, orderId, amount, upiId }) {
  const name = user?.full_name || "Student";
  const email = user?.email || "-";
  const mobile = user?.mobile || "-";
  return [
    "Hi DevOpsMate, I paid for the Offline Interview Q&A pack.",
    "",
    `Order: ${orderId}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${mobile}`,
    `Amount: ₹${amount}`,
    `UPI: ${upiId || "devopamate@ybl"}`,
    "UTR/ref: <fill after payment>",
    "",
    "Attaching payment screenshot.",
    "Please approve so I receive the ZIP on email.",
  ].join("\n");
}
