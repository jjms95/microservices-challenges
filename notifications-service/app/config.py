"""Application configuration loaded from environment variables."""
import os


class Settings:
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5434"))
    DB_USERNAME: str = os.getenv("DB_USERNAME", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_NAME: str = os.getenv("DB_NAME", "notifications_db")

    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://admin:admin@localhost:5672")
    RABBITMQ_EXCHANGE: str = "employees_exchange"
    RABBITMQ_QUEUE: str = "notifications_queue"

    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecret2026")
    JWT_ALGORITHM: str = "HS256"

    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8084

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USERNAME}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
