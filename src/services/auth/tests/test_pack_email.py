import asyncio
import zipfile
from io import BytesIO

from app import email_service


def test_send_pack_email_sends_two_complete_zip_parts(tmp_path, monkeypatch):
    source_path = tmp_path / "pack.zip"
    expected_files = {
        "first.html": b"first page",
        "second.html": b"second page",
        "third.html": b"third page",
        "fourth.html": b"fourth page",
    }
    with zipfile.ZipFile(source_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for filename, content in expected_files.items():
            archive.writestr(filename, content)

    sent_messages = []
    smtp_instances = []

    class FakeSMTP:
        def __init__(self, **kwargs):
            assert kwargs["timeout"] == email_service.PACK_EMAIL_SMTP_TIMEOUT_SECONDS
            smtp_instances.append(self)

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def send_message(self, message, *, timeout):
            assert timeout == email_service.PACK_EMAIL_SMTP_TIMEOUT_SECONDS
            sent_messages.append(message)

    monkeypatch.setattr(email_service.settings, "interview_qa_pack_path", str(source_path))
    monkeypatch.setattr(email_service.settings, "smtp_host", "localhost")
    monkeypatch.setattr(email_service.settings, "smtp_from", "DevOpsMate <test@example.com>")
    monkeypatch.setattr(email_service.aiosmtplib, "SMTP", FakeSMTP)

    asyncio.run(email_service.send_pack_email("Student", "student@example.com", "DM-TEST"))

    assert len(sent_messages) == 2
    assert len(smtp_instances) == 1
    found_files = []
    for part_number, message in enumerate(sent_messages, start=1):
        assert message["To"] == "student@example.com"
        assert f"Part {part_number} of 2" in message["Subject"]
        attachments = [part for part in message.walk() if part.get_filename()]
        assert len(attachments) == 1
        assert attachments[0].get_filename() == f"pack-part-{part_number}-of-2.zip"
        with zipfile.ZipFile(BytesIO(attachments[0].get_payload(decode=True))) as archive:
            found_files.extend(archive.namelist())
            for filename in archive.namelist():
                assert archive.read(filename) == expected_files[filename]

    assert sorted(found_files) == sorted(expected_files)
