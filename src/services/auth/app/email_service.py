import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


def welcome_email_html(name: str, email: str, mobile: str, city: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#1d1d1f;line-height:1.6;max-width:560px;margin:auto;padding:0;">
  <div style="background:#0b3d91;padding:28px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">DevOpsMate</h1>
    <p style="color:#c9dbff;margin:8px 0 0;font-size:13px;">Learn | Grow | Succeed</p>
  </div>
  <div style="padding:28px;background:#f7fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p style="color:#12805c;font-size:18px;font-weight:700;margin:0 0 12px;">Welcome to DevOpsMate</p>
    <p>Dear <strong>{name}</strong>,</p>
    <p>Your account was created successfully. We are excited to have you on this journey.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;background:#fff;border-radius:8px;">
      <tr><td style="padding:10px;color:#6b7280;">Email</td><td style="padding:10px;font-weight:600;">{email}</td></tr>
      <tr><td style="padding:10px;color:#6b7280;">Mobile</td><td style="padding:10px;font-weight:600;">{mobile}</td></tr>
      <tr><td style="padding:10px;color:#6b7280;">City</td><td style="padding:10px;font-weight:600;">{city}</td></tr>
    </table>
    <p>Next step: choose AWS + DevOps + AI, Job Support, or Interview Support and enroll.</p>
    <p><strong>Good luck!</strong><br/>- Team DevOpsMate</p>
  </div>
</body></html>"""


async def send_welcome_email(name: str, email: str, mobile: str, city: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to DevOpsMate"
    msg["From"] = settings.smtp_from
    msg["To"] = email
    msg.attach(MIMEText(welcome_email_html(name, email, mobile, city), "html", "utf-8"))

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
