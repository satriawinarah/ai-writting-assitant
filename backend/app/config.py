from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str = "sqlite:///./diksiai.db"

    # Groq API (Cloud - Free)
    groq_api_key: str = ""  # Set via environment variable GROQ_API_KEY
    groq_model: str = "llama-3.1-70b-versatile"  # Options: llama-3.1-70b-versatile, llama-3.1-8b-instant

    # Model-specific API keys
    openrouter_api_key: str = ""  # For openai/gpt-oss-120b model

    # Application
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Authentication
    jwt_secret_key: str = "your-secret-key-change-this-in-production-min-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    def get_api_key_for_model(self, model: str) -> str:
        """Get the appropriate API key for the given model"""
        if model.startswith("openai/"):
            return self.openrouter_api_key
        elif model.startswith("llama-"):
            return self.groq_api_key
        else:
            # Default to Groq API key
            return self.groq_api_key

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
