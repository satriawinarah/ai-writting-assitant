from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Get client IP address, considering proxy headers
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Create limiter instance with IP-based key function
limiter = Limiter(key_func=get_client_ip)


# Rate limit constants
RATE_LIMIT_LOGIN = "5/minute"  # Strict limit for login attempts
RATE_LIMIT_REGISTER = "3/minute"  # Strict limit for registration
RATE_LIMIT_DEFAULT = "60/minute"  # Default limit for authenticated endpoints
RATE_LIMIT_AI = "20/minute"  # Limit for AI endpoints (expensive operations)
