import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from pathlib import Path

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)

SITE_URL = "https://devopsmate7.duckdns.org"
WHATSAPP = "+91 80889 29670"
SERVICES = [
    "AWS + DevOps + AI",
    "Job Support — 1:1",
    "Interview Support (45-days interview plan)",
    "Real DevOps & Cloud Interview Questions (offline pack)",
    "1:1 Connect (Zoom booking)",
]


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


def pack_email_text(name: str, order_id: str) -> str:
    return f"""Dear {name},

Payment successful for your Offline Interview Q&A pack (Order {order_id}).

Thank you for purchasing Real DevOps & Cloud Interview Questions. Your download pack is attached as a ZIP file. Extract it and open the HTML files in your browser (keep the logo file in the same folder).

Fees are non-refundable after the order is confirmed. We store your name, email, and mobile only to run your account, and we do not sell your data.

Terms: {SITE_URL}/terms
Privacy: {SITE_URL}/privacy
Refund: {SITE_URL}/refund

By creating this account you agree to these policies.

Good luck. You can do this.
Team DevOpsMate
WhatsApp: {WHATSAPP}
"""


def pack_email_html(name: str, order_id: str) -> str:
    name = escape(name)
    order_id = escape(order_id)
    link = "color:#0b3d91;"
    return f"""<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#1d1d1f;line-height:1.6;max-width:560px;margin:auto;padding:0;">
  <div style="background:#0b3d91;padding:28px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">DevOpsMate</h1>
    <p style="color:#c9dbff;margin:8px 0 0;font-size:13px;">Learn | Grow | Succeed</p>
  </div>
  <div style="padding:28px;background:#f7fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>Dear <strong>{name}</strong>,</p>
    <p><strong>Payment successful</strong> for your Offline Interview Q&amp;A pack
    (Order <strong>{order_id}</strong>).</p>
    <p>Thank you for purchasing <strong>Real DevOps &amp; Cloud Interview Questions</strong>.
    Your download pack is attached as a ZIP. Extract it and open the HTML files in your browser
    (keep the logo file in the same folder).</p>
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


async def send_pack_email(name: str, email: str, order_id: str) -> None:
    zip_path = Path(settings.interview_qa_pack_path)
    if not zip_path.is_file():
        raise RuntimeError(f"Pack ZIP missing at {zip_path}")

    msg = MIMEMultipart("mixed")
    msg["Subject"] = "Payment successful — Interview Q&A pack | DevOpsMate"
    msg["From"] = settings.smtp_from
    msg["To"] = email

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(pack_email_text(name, order_id), "plain", "utf-8"))
    alt.attach(MIMEText(pack_email_html(name, order_id), "html", "utf-8"))
    msg.attach(alt)

    with zip_path.open("rb") as f:
        attachment = MIMEApplication(f.read(), Name=zip_path.name)
    attachment["Content-Disposition"] = f'attachment; filename="{zip_path.name}"'
    msg.attach(attachment)

    if settings.smtp_host in ("mailhog", "127.0.0.1", "localhost"):
        logger.warning("Pack mail for %s is going to MailHog, not to a real inbox", email)
    if settings.smtp_host == "smtp.gmail.com" and not settings.smtp_password:
        raise RuntimeError("SMTP_PASSWORD is empty. Set it in the server .env file.")

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user or None,
        password=settings.smtp_password or None,
        start_tls=settings.smtp_tls,
    )
    logger.info("Pack email sent to %s for order %s", email, order_id)


async def send_connect_emails(
    *,
    name: str,
    email: str,
    mobile: str,
    booking_id: str,
    duration_min: int,
    priority: bool,
    slot_start: str,
    price_inr: int,
    meeting_link: str,
) -> None:
    plan = f"{duration_min} min" + (" priority" if priority else "")
    user_text = f"""Dear {name},

Your 1:1 Connect is confirmed (Booking {booking_id}).

Plan: {plan}
When: {slot_start}
Fee: ₹{price_inr}
Join Zoom: {meeting_link}

Pay via UPI if you have not already, then join on time.

Team DevOpsMate
WhatsApp: {WHATSAPP}
"""
    user_html = f"""<!DOCTYPE html><body style="font-family:Arial,sans-serif;line-height:1.6">
<p>Dear <strong>{escape(name)}</strong>,</p>
<p>Your <strong>1:1 Connect</strong> is confirmed (Booking <strong>{escape(booking_id)}</strong>).</p>
<ul>
<li>Plan: {escape(plan)}</li>
<li>When: {escape(slot_start)}</li>
<li>Fee: ₹{price_inr}</li>
</ul>
<p><a href="{escape(meeting_link)}">Join Zoom meeting</a></p>
<p>Team DevOpsMate · WhatsApp: {WHATSAPP}</p>
</body></html>"""
    admin_text = f"""New 1:1 Connect booking

ID: {booking_id}
Name: {name}
Mobile: {mobile}
Email: {email}
Plan: {plan}
When: {slot_start}
Fee: ₹{price_inr}
Zoom: {meeting_link}
"""
    user_msg = MIMEMultipart("alternative")
    user_msg["Subject"] = f"1:1 Connect confirmed — {plan} | DevOpsMate"
    user_msg["From"] = settings.smtp_from
    user_msg["To"] = email
    user_msg.attach(MIMEText(user_text, "plain", "utf-8"))
    user_msg.attach(MIMEText(user_html, "html", "utf-8"))

    admin_to = (settings.booking_notify_email or "").strip() or "devopsmate7@gmail.com"
    admin_msg = MIMEText(admin_text, "plain", "utf-8")
    admin_msg["Subject"] = f"New 1:1 booking — {name} · {slot_start}"
    admin_msg["From"] = settings.smtp_from
    admin_msg["To"] = admin_to

    kwargs = dict(
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user or None,
        password=settings.smtp_password or None,
        start_tls=settings.smtp_tls,
    )
    await aiosmtplib.send(user_msg, **kwargs)
    await aiosmtplib.send(admin_msg, **kwargs)
    logger.info("Connect emails sent booking=%s user=%s admin=%s", booking_id, email, admin_to)


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
