"""
Tests for the QR payment service (Cambodia Bakong QR).

Run with: python -m pytest tests/test_qr_payment.py -v
"""

import pytest
from app.services.qr_payment import (
    generate_cambodia_qr_base64,
    should_use_qr_payment,
    _build_khqr_string,
    _generate_qr_image,
)


class TestShouldUseQRPayment:
    """Tests for country detection logic."""

    def test_cambodia_returns_true(self):
        assert should_use_qr_payment("Cambodia") is True

    def test_cambodia_kh_code_returns_true(self):
        assert should_use_qr_payment("KH") is True

    def test_cambodia_full_name_returns_true(self):
        assert should_use_qr_payment("Cambodia (Kampuchea)") is True

    def test_case_insensitive_returns_true(self):
        assert should_use_qr_payment("cambodia") is True

    def test_extra_spaces_handled(self):
        assert should_use_qr_payment("  Cambodia  ") is True

    def test_india_returns_false(self):
        assert should_use_qr_payment("India") is False

    def test_usa_returns_false(self):
        assert should_use_qr_payment("United States") is False

    def test_empty_string_returns_false(self):
        assert should_use_qr_payment("") is False

    def test_thailand_returns_false(self):
        assert should_use_qr_payment("Thailand") is False

    def test_vietnam_returns_false(self):
        """Verify neighboring SEA countries don't trigger QR."""
        assert should_use_qr_payment("Vietnam") is False
        assert should_use_qr_payment("Laos") is False
        assert should_use_qr_payment("Myanmar") is False


class TestBuildKHQRString:
    """Tests for KHQR string generation."""

    def test_basic_structure(self):
        """Verify the payload contains all required fields."""
        result = _build_khqr_string(
            merchant_name="EventHub",
            merchant_city="Phnom Penh",
            amount=50.0,
            currency="USD",
            bill_number="BK-TEST-001",
        )
        assert "khqr://payment" in result
        assert "merchant=EventHub" in result
        assert "city=Phnom Penh" in result
        assert "amount=50.00" in result
        assert "currency=USD" in result
        assert "bill=BK-TEST-001" in result
        assert "ts=" in result  # timestamp

    def test_with_account_id(self):
        """Verify account_id is included when provided."""
        result = _build_khqr_string(
            merchant_name="Test Merchant",
            merchant_city="Siem Reap",
            amount=25.0,
            currency="KHR",
            bill_number="BK-002",
            account_id="khqr_acc_12345",
        )
        assert "account=khqr_acc_12345" in result

    def test_without_account_id(self):
        """Verify account_id is omitted when not provided."""
        result = _build_khqr_string(
            merchant_name="Test",
            merchant_city="City",
            amount=10.0,
            currency="USD",
            bill_number="BK-003",
        )
        assert "account=" not in result

    def test_merchant_name_truncated(self):
        """Verify merchant name is truncated to 25 chars."""
        result = _build_khqr_string(
            merchant_name="A very long merchant name that should be truncated",
            merchant_city="City",
            amount=10.0,
            currency="USD",
            bill_number="BK-004",
        )
        # Find the merchant field
        for line in result.split("\n"):
            if line.startswith("merchant="):
                value = line.split("=", 1)[1]
                assert len(value) <= 25
                break

    def test_merchant_city_truncated(self):
        """Verify city is truncated to 15 chars."""
        result = _build_khqr_string(
            merchant_name="Merchant",
            merchant_city="A very long city name that should truncate",
            amount=10.0,
            currency="USD",
            bill_number="BK-005",
        )
        for line in result.split("\n"):
            if line.startswith("city="):
                value = line.split("=", 1)[1]
                assert len(value) <= 15
                break

    def test_amount_formatted_to_two_decimals(self):
        """Verify amounts are formatted to 2 decimal places."""
        result = _build_khqr_string(
            merchant_name="M",
            merchant_city="C",
            amount=99.999,
            currency="USD",
            bill_number="BK-006",
        )
        assert "amount=100.00" in result

    def test_zero_amount(self):
        """Verify zero amount is handled."""
        result = _build_khqr_string(
            merchant_name="M",
            merchant_city="C",
            amount=0.0,
            currency="USD",
            bill_number="BK-007",
        )
        assert "amount=0.00" in result


class TestGenerateQRImage:
    """Tests for QR code image generation."""

    def test_qr_image_returns_string(self):
        """Verify the function returns a string (either base64 or empty)."""
        result = _generate_qr_image("test data")
        assert isinstance(result, str)

    def test_qr_image_with_qrcode_library(self):
        """Verify with qrcode library, it returns valid base64 data."""
        try:
            import qrcode  # noqa: F401
            result = _generate_qr_image("test data for QR")
            assert len(result) > 100  # Should be a substantial base64 string
            # Verify it's valid base64
            import base64
            decoded = base64.b64decode(result)
            # PNG header starts with b'\\x89PNG'
            assert decoded[:4] == b'\x89PNG'
        except ImportError:
            pytest.skip("qrcode library not installed")


class TestGenerateCambodiaQRBase64:
    """Tests for the main generate_cambodia_qr_base64 function."""

    def test_returns_tuple(self):
        """Verify the function returns a tuple of two strings."""
        result = generate_cambodia_qr_base64(
            merchant_name="EventHub",
            merchant_city="Phnom Penh",
            amount=50.0,
            currency="USD",
            bill_number="BK-INT-001",
        )
        assert isinstance(result, tuple)
        assert len(result) == 2
        qr_base64, khqr_string = result
        assert isinstance(qr_base64, str)
        assert isinstance(khqr_string, str)

    def test_khqr_string_includes_all_data(self):
        """Verify the KHQR string includes expected fields."""
        _, khqr_string = generate_cambodia_qr_base64(
            merchant_name="Test Merchant",
            merchant_city="Battambang",
            amount=35.0,
            currency="USD",
            bill_number="BK-INT-002",
        )
        assert "Test Merchant" in khqr_string
        assert "Battambang" in khqr_string
        assert "35.00" in khqr_string
        assert "BK-INT-002" in khqr_string

    def test_returns_empty_base64_without_qrcode(self):
        """Verify it returns empty string if qrcode not installed."""
        try:
            import qrcode  # noqa: F401
            pytest.skip("qrcode is installed - can't test fallback")
        except ImportError:
            qr_base64, _ = generate_cambodia_qr_base64(
                merchant_name="M",
                merchant_city="C",
                amount=10.0,
                currency="USD",
                bill_number="BK-FALLBACK",
            )
            assert qr_base64 == ""
