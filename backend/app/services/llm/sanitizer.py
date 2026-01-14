"""
Input sanitization utilities for LLM prompts.

This module provides functions to sanitize user input to prevent
prompt injection attacks and other security issues.
"""

import re

# Common prompt injection patterns to filter
INJECTION_PATTERNS = [
    r'(?i)ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
    r'(?i)disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
    r'(?i)forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
    r'(?i)you\s+are\s+now\s+',
    r'(?i)act\s+as\s+if\s+',
    r'(?i)pretend\s+(you\s+are|to\s+be)\s+',
    r'(?i)new\s+instructions?:',
    r'(?i)system\s*:\s*',
    r'(?i)assistant\s*:\s*',
    r'(?i)\[INST\]',
    r'(?i)\[/INST\]',
    r'(?i)<\|im_start\|>',
    r'(?i)<\|im_end\|>',
    r'(?i)<<SYS>>',
    r'(?i)<</SYS>>',
]


def sanitize_user_input(text: str, max_length: int = 5000) -> str:
    """
    Sanitize user input to prevent prompt injection attacks.

    - Truncates to max_length
    - Removes potential prompt injection patterns
    - Strips dangerous control sequences

    Args:
        text: The user input to sanitize
        max_length: Maximum allowed length (default 5000)

    Returns:
        Sanitized text string
    """
    if not text:
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove common prompt injection patterns
    for pattern in INJECTION_PATTERNS:
        text = re.sub(pattern, '[FILTERED]', text)

    return text.strip()
