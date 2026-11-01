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

  return (
    <div className="notice-bar" role="status">
      <div className="container notice-bar-inner">
        <span className="notice-dot" aria-hidden="true" />
        <p className="notice-text">
          {notice.message}
          {notice.link_href ? (
            <a href={notice.link_href} target="_blank" rel="noreferrer" className="notice-link">
              {notice.link_text || "Learn more"}
            </a>
          ) : null}
        </p>
        <button type="button" className="notice-close" aria-label="Dismiss notice" onClick={onDismiss}>
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}
