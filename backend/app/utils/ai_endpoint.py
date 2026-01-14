"""
AI endpoint utilities and decorators.

This module provides common utilities for AI API endpoints including
logging, timing, model validation, and error handling.
"""

import logging
import time
from functools import wraps
from typing import Callable, Any

from fastapi import HTTPException

from ..services.llm import llm_service

logger = logging.getLogger(__name__)


class AIRequestContext:
    """Context object for AI requests with logging and timing."""

    def __init__(self, request_id: int, operation: str):
        self.request_id = request_id
        self.operation = operation
        self.start_time = time.time()

    def log_start(self, **kwargs):
        """Log the start of an AI operation."""
        details = ", ".join(f"{k}: {v}" for k, v in kwargs.items())
        logger.info(f"[{self.request_id}] Received {self.operation} request - {details}")

    def log_debug(self, message: str):
        """Log debug information."""
        logger.debug(f"[{self.request_id}] {message}")

    def log_model_check(self, model: str):
        """Log model availability check."""
        logger.info(f"[{self.request_id}] Checking model availability for {model}...")

    def log_model_available(self, model: str):
        """Log that model is available."""
        logger.info(f"[{self.request_id}] Model {model} is available")

    def log_processing(self, model: str):
        """Log that processing has started."""
        logger.info(f"[{self.request_id}] Starting {self.operation} with llm_service using {model}...")

    def log_success(self, **kwargs):
        """Log successful completion."""
        elapsed = time.time() - self.start_time
        details = ", ".join(f"{k}: {v}" for k, v in kwargs.items())
        logger.info(f"[{self.request_id}] {self.operation.capitalize()} completed in {elapsed:.2f}s - {details}")

    def log_error(self, error: Exception):
        """Log an error."""
        elapsed = time.time() - self.start_time
        logger.error(
            f"[{self.request_id}] Error during {self.operation} after {elapsed:.2f}s: {str(error)}",
            exc_info=True
        )

    @property
    def elapsed_time(self) -> float:
        """Get elapsed time since start."""
        return time.time() - self.start_time


def validate_model_availability(model: str, request_id: int) -> None:
    """
    Validate that the specified model is available.

    Args:
        model: The model identifier to check
        request_id: The request ID for logging

    Raises:
        HTTPException: If the model is not available (503)
    """
    if not llm_service.check_model_available(model):
        logger.error(f"[{request_id}] Model {model} not available")
        raise HTTPException(
            status_code=503,
            detail=f"Model {model} is not available. Please check API key configuration."
        )


def handle_ai_error(operation: str, error: Exception) -> None:
    """
    Handle an AI operation error by raising an appropriate HTTPException.

    Args:
        operation: The name of the operation that failed
        error: The exception that occurred

    Raises:
        HTTPException: Always raises with status 500
    """
    raise HTTPException(
        status_code=500,
        detail=f"Error {operation}: {str(error)}"
    )
