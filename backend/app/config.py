from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str = "sqlite:///./author_ai.db"

    # Groq API (Cloud - Free)
    groq_api_key: str = ""  # Set via environment variable GROQ_API_KEY
    groq_model: str = "llama-3.1-70b-versatile"  # Options: llama-3.1-70b-versatile, llama-3.1-8b-instant

    # Application
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
