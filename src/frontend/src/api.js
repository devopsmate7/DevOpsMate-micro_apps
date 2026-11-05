export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    let message = data.message || "Request failed";
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) {
      message = detail
        .map((d) => (d.msg ? d.msg.replace(/^Value error, /, "") : JSON.stringify(d)))
        .join(", ");
    } else if (res.status >= 500) {
      message = "The server is not reachable right now. Please try again in a minute.";
    }
    throw new Error(message);
  }
  return data;
}

export function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
