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
  return enrollPaymentMessage({
    user,
    orderId,
    amount,
    title: "Offline Interview Q&A pack",
    upiId,
  });
}

export function enrollPaymentMessage({ user, orderId, amount, title, upiId }) {
  const name = user?.full_name || "Student";
  const email = user?.email || "-";
  const mobile = user?.mobile || "-";
  return [
    `Hi DevOpsMate, I paid for ${title || "enrollment"}.`,
    "",
    `Order: ${orderId}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${mobile}`,
    `Amount: ₹${amount}`,
    `UPI: ${upiId || "devopamate@ybl"}`,
    "UTR/ref: <fill after payment>",
    "",
    "Attaching payment screenshot / receipt.",
    "Please verify and confirm in admin.",
  ].join("\n");
}

export function connectPaymentMessage({ user, bookingId, amount, slot, plan, upiId, advice }) {
  const name = user?.full_name || "Student";
  const email = user?.email || "-";
  const mobile = user?.mobile || "-";
  if (advice) {
    return [
      "Hi DevOpsMate, I paid ₹19 for Personal Advice (Priority DM).",
      "",
      `Booking: ${bookingId}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Mobile: ${mobile}`,
      `Amount: ₹${amount}`,
      `UPI: ${upiId || "devopamate@ybl"}`,
      "UTR/ref: <fill after payment>",
      "",
      "Attaching payment screenshot.",
      "",
      "My question:",
      "<type your question here — resume / LinkedIn / interview / career / AWS DevOps>",
    ].join("\n");
  }
  return [
    "Hi DevOpsMate, I booked 1:1 Connect and paid via UPI.",
    "",
    `Booking: ${bookingId}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${mobile}`,
    `Plan: ${plan || "-"}`,
    `When: ${slot || "-"}`,
    `Amount: ₹${amount}`,
    `UPI: ${upiId || "devopamate@ybl"}`,
    "UTR/ref: <fill after payment>",
    "",
    "Attaching payment screenshot / receipt.",
    "Please verify on WhatsApp, then approve in admin so I get the Zoom link by email.",
  ].join("\n");
}
