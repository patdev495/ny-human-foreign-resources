from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NY Human Resources System"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["*"]
    host: str = "0.0.0.0"
    port: int = 8000

    # MSSQL via ODBC Driver 18
    db_server: str
    db_name: str
    db_user: str
    db_password: str
    db_driver: str = "ODBC Driver 18 for SQL Server"

    # SMTP Configuration for Email Notifications
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True

    @property
    def database_url(self) -> str:
        driver = self.db_driver.replace(" ", "+")
        return (
            f"mssql+pyodbc://{self.db_user}:{self.db_password}"
            f"@{self.db_server}/{self.db_name}"
            f"?driver={driver}&TrustServerCertificate=yes"
        )


settings = Settings()
