"""
LLM Client factory for managing different LLM providers.

This module provides a factory class for creating LLM clients
based on the specified model and available API keys.
"""

from groq import Groq
from app.config import get_settings


class LLMClientFactory:
    """Factory for creating LLM clients based on model type."""

    def __init__(self):
        self.settings = get_settings()

    def get_client(self, model: str) -> Groq:
        """
        Get the appropriate client for the given model.

        Args:
            model: The model identifier

        Returns:
            A configured Groq client instance with 30s timeout

        Raises:
            ValueError: If no API key is configured for the model
        """
        api_key = self.settings.get_api_key_for_model(model)

        if not api_key:
            raise ValueError(f"No API key configured for model: {model}")

        # For now, we use Groq client for all models
        # OpenRouter uses OpenAI-compatible API, so Groq client works
        # Configure 30s timeout to prevent hanging requests
        return Groq(api_key=api_key, timeout=30.0)

    def is_model_available(self, model: str) -> bool:
        """
        Check if the specified model is available.

        Args:
            model: The model identifier

        Returns:
            True if the model has a configured API key
        """
        try:
            api_key = self.settings.get_api_key_for_model(model)
            return bool(api_key)
        except Exception:
            return False

    def get_available_models(self) -> list[dict]:
        """
        Get information about all available models.

        Returns:
            List of model information dictionaries
        """
        return [
            {
                "model": "openai/gpt-oss-120b",
                "provider": "openrouter",
                "available": bool(self.settings.openrouter_api_key)
            },
            {
                "model": "llama-3.3-70b-versatile",
                "provider": "groq",
                "available": bool(self.settings.groq_api_key)
            }
        ]
