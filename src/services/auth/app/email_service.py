import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)

SITE_URL = "https://devopsmate7.duckdns.org"
WHATSAPP = "+91 80889 29670"
SERVICES = ["AWS + DevOps + AI", "Job Support — 1:1", "Interview Support (30 days)"]


def welcome_email_text(name: str) -> str:
    services = "\n".join(f"{i}. {s}" for i, s in enumerate(SERVICES, 1))
    return f"""Dear {name},

Welcome. Your account is ready, and this is a strong start. Sign in with this email or your mobile number, and keep going one day at a time. Consistent effort is what gets you the role.

Pick your course by visiting {SITE_URL}

Our services:
{services}

We are with you on this journey. Show up, practice, and you will grow.

Fees are non-refundable after the order is confirmed. We store your name, email, and mobile only to run your account, and we do not sell your data.

Terms: {SITE_URL}/terms
Privacy: {SITE_URL}/privacy
Refund: {SITE_URL}/refund

By creating this account you agree to these policies.

Good luck. You can do this.
Team DevOpsMate
WhatsApp: {WHATSAPP}
"""


def welcome_email_html(name: str) -> str:
    name = escape(name)
    services = "".join(f'<li style="margin:4px 0;font-weight:600;">{escape(s)}</li>' for s in SERVICES)
    link = "color:#0b3d91;"
    return f"""<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#1d1d1f;line-height:1.6;max-width:560px;margin:auto;padding:0;">
  <div style="background:#0b3d91;padding:28px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">DevOpsMate</h1>
    <p style="color:#c9dbff;margin:8px 0 0;font-size:13px;">Learn | Grow | Succeed</p>
  </div>
  <div style="padding:28px;background:#f7fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>Dear <strong>{name}</strong>,</p>
    <p>Welcome. Your account is ready, and this is a strong start. Sign in with this email or your mobile number,
    and keep going one day at a time. Consistent effort is what gets you the role.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="{SITE_URL}" style="background:#12805c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Pick your course</a>
    </p>
    <p style="margin-bottom:4px;"><strong>Our services:</strong></p>
    <ol style="margin-top:0;">{services}</ol>
    <p>We are with you on this journey. Show up, practice, and you will grow.</p>
    <p style="font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;">
      Fees are non-refundable after the order is confirmed. We store your name, email, and mobile only to run your
      account, and we do not sell your data.<br/>
      <a href="{SITE_URL}/terms" style="{link}">Terms</a> ·
      <a href="{SITE_URL}/privacy" style="{link}">Privacy</a> ·
      <a href="{SITE_URL}/refund" style="{link}">Refund</a><br/>
      By creating this account you agree to these policies.
    </p>
    <p><strong>Good luck. You can do this.</strong><br/>Team DevOpsMate<br/>WhatsApp: {WHATSAPP}</p>
  </div>
</body></html>"""


async def send_welcome_email(name: str, email: str, mobile: str, city: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to DevOpsMate"
    msg["From"] = settings.smtp_from
    msg["To"] = email
    msg.attach(MIMEText(welcome_email_text(name), "plain", "utf-8"))
    msg.attach(MIMEText(welcome_email_html(name), "html", "utf-8"))

    if settings.smtp_host in ("mailhog", "127.0.0.1", "localhost"):
        logger.warning("Welcome mail for %s is going to MailHog, not to a real inbox", email)
    if settings.smtp_host == "smtp.gmail.com" and not settings.smtp_password:
        raise RuntimeError("SMTP_PASSWORD is empty. Set it in the server .env file.")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_tls,
        )
        logger.info("Welcome email sent to %s", email)
    except Exception:
        logger.exception("Failed to send welcome email to %s", email)
        raise
