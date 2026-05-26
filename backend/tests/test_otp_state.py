from datetime import datetime, timedelta, timezone

from backend.src.otp_state import (
    OTP_VALID_MINUTES,
    otp_prompt_message,
    otp_status_fields,
)


def test_otp_status_fields_when_missing_timestamp():
    fields = otp_status_fields({})
    assert fields["otp_requested_at"] is None
    assert fields["otp_expired"] is None


def test_otp_status_fields_fresh_code():
    ts = datetime.now(timezone.utc).isoformat()
    fields = otp_status_fields({"otp_requested_at": ts})
    assert fields["otp_expired"] is False
    assert fields["otp_minutes_remaining"] is not None
    assert fields["otp_minutes_remaining"] <= OTP_VALID_MINUTES


def test_otp_status_fields_expired_code():
    ts = (datetime.now(timezone.utc) - timedelta(minutes=OTP_VALID_MINUTES + 1)).isoformat()
    fields = otp_status_fields({"otp_requested_at": ts})
    assert fields["otp_expired"] is True
    assert fields["otp_minutes_remaining"] == 0


def test_otp_prompt_message_expired():
    ts = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    msg = otp_prompt_message({"otp_requested_at": ts})
    assert "expired" in msg.lower()
