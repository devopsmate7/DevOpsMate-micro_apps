export const UPI_PRIMARY = "devopamate@ybl";
export const UPI_ALT = "balureddy123457@ybl";

export function buildUpiUri({ pa = UPI_PRIMARY, pn = "DevOpsMate", am, tr, tn }) {
  const params = new URLSearchParams({
    pa,
    pn,
    am: String(am ?? ""),
    cu: "INR",
  });
  if (tr) params.set("tr", String(tr).slice(0, 35));
  if (tn) params.set("tn", String(tn).slice(0, 80));
  return `upi://pay?${params.toString()}`;
}

export function qrImageUrl(data, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
