from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    APP_NAME: str = Field(default="Event Booking Platform", alias="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", alias="APP_VERSION")
    APP_ENV: str = Field(default="development", alias="APP_ENV")
    DEBUG: bool = Field(default=True, alias="DEBUG")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./event_booking.db",
        alias="DATABASE_URL",
    )

    # Security
    SECRET_KEY: str = Field(default="super-secret-key-change-me", alias="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", alias="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    # Email
    SMTP_HOST: str = Field(default="", alias="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, alias="SMTP_PORT")
    SMTP_USER: str = Field(default="", alias="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", alias="SMTP_PASSWORD")

    # Admin Seed
    ADMIN_EMAIL: str = Field(default="admin@eventbooking.com", alias="ADMIN_EMAIL")
    ADMIN_PASSWORD: str = Field(default="Admin123!@#", alias="ADMIN_PASSWORD")

    # Stripe Payments
    STRIPE_SECRET_KEY: str = Field(default="", alias="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", alias="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", alias="STRIPE_WEBHOOK_SECRET")

    # WhatsApp / Twilio
    TWILIO_ACCOUNT_SID: str = Field(default="", alias="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field(default="", alias="TWILIO_AUTH_TOKEN")
    TWILIO_WHATSAPP_FROM: str = Field(default="+14155238886", alias="TWILIO_WHATSAPP_FROM")

    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, alias="RATE_LIMIT_PER_MINUTE")

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
