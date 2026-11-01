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
