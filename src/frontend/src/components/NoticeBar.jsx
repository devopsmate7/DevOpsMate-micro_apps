import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function NoticeBar() {
  const [notice, setNotice] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    apiFetch("/api/notice/active")
      .then((n) => {
        if (n && sessionStorage.getItem("dm_notice_dismissed") === n.id) {
          setDismissed(true);
        }
        setNotice(n);
      })
      .catch(() => setNotice(null));
  }, []);

  if (!notice || dismissed) return null;

  function onDismiss() {
    sessionStorage.setItem("dm_notice_dismissed", notice.id);
    setDismissed(true);
  }

  const item = (
    <span className="notice-item">
      <span className="notice-dot" aria-hidden="true" />
      <span className="notice-text">
        {notice.message}
        {notice.link_href ? (
          <a href={notice.link_href} target="_blank" rel="noreferrer" className="notice-link">
            {notice.link_text || "Learn more"}
          </a>
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
      <button type="button" className="notice-close" aria-label="Dismiss notice" onClick={onDismiss}>
        {"\u2715"}
      </button>
    </div>
  );
}
