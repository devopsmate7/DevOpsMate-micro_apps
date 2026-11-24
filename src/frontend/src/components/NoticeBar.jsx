import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function NoticeBar() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    apiFetch("/api/notice/active")
      .then(setNotice)
      .catch(() => setNotice(null));
  }, []);

  if (!notice) return null;

  const item = (
    <span className="notice-item">
      <span className="notice-dot" aria-hidden="true" />
      <span className="notice-text">
        {notice.message}
        {notice.link_text ? (
          <span className="notice-link notice-link-disabled" aria-disabled="true">
            {notice.link_text}
          </span>
        ) : null}
      </span>
    </span>
  );

  return (
    <div className="notice-bar" role="status">
      <div className="notice-marquee" aria-label={notice.message}>
        <div className="notice-track">
          {item}
          {item}
          {item}
          {item}
        </div>
      </div>
    </div>
  );
}
