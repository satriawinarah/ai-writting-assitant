"""
Application-wide constants and validation rules.

This module centralizes all constant values used throughout the application
to ensure consistency and make them easy to update.
"""

# Model identifiers
DEFAULT_MODEL = "openai/gpt-oss-120b"
GROQ_MODEL = "llama-3.3-70b-versatile"

AVAILABLE_MODELS = [DEFAULT_MODEL, GROQ_MODEL]

# User validation
MAX_USERNAME_LENGTH = 50
MAX_FULLNAME_LENGTH = 100
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# Project/Chapter validation
MAX_TITLE_LENGTH = 255  # Used for both projects and chapters
MAX_DESCRIPTION_LENGTH = 2000
MAX_CONTENT_LENGTH = 500000  # ~500KB for chapter content
MAX_CHAPTER_ORDER = 10000

# Settings validation
MAX_PROMPT_KEY_LENGTH = 50
MAX_PROMPT_VALUE_LENGTH = 5000
MAX_CUSTOM_PROMPTS = 20

# AI configuration
DEFAULT_WRITING_STYLE = "puitis"
DEFAULT_TITLE_STYLE = "click_bait"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 10000
DEFAULT_PARAGRAPH_COUNT = 1

# Text limits for AI operations
MIN_TEXT_LENGTH_FOR_CONTINUATION = 50
MIN_TEXT_LENGTH_FOR_REVIEW = 50
MIN_TEXT_LENGTH_FOR_TITLE = 100
MAX_CONTEXT_LENGTH = 5000

# Default improvement instruction
DEFAULT_IMPROVEMENT_INSTRUCTION = (
    "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa "
    "yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya."
)
