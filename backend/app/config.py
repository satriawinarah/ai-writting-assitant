"""
Application configuration using Pydantic Settings.

This module provides centralized configuration management with
environment variable support and model-to-API-key mapping.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Callable


# Model prefix to API key attribute mapping registry
# Format: (prefix, api_key_attribute_name)
MODEL_API_KEY_REGISTRY: list[tuple[str, str]] = [
    ("openai/", "openrouter_api_key"),
    ("llama-", "groq_api_key"),
    ("mixtral-", "groq_api_key"),
    ("gemma-", "groq_api_key"),
]

# Default API key attribute if no prefix matches
DEFAULT_API_KEY_ATTR = "groq_api_key"


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Database
    database_url: str = "sqlite:///./diksiai.db"

    # Groq API (Cloud - Free)
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"

    # OpenRouter API (for OpenAI models)
    openrouter_api_key: str = ""

    # Application
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Authentication
    jwt_secret_key: str = "your-secret-key-change-this-in-production-min-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    def get_api_key_for_model(self, model: str) -> str:
        """
        Get the appropriate API key for the given model.

        Uses the MODEL_API_KEY_REGISTRY to find the correct API key
        based on model prefix. Falls back to DEFAULT_API_KEY_ATTR.

        Args:
            model: The model identifier (e.g., "openai/gpt-oss-120b")

        Returns:
            The API key string for the model
        """
        for prefix, api_key_attr in MODEL_API_KEY_REGISTRY:
            if model.startswith(prefix):
                return getattr(self, api_key_attr)

        return getattr(self, DEFAULT_API_KEY_ATTR)

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
