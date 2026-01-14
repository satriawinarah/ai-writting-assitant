"""
AI API endpoints for LLM-powered writing assistance.

This module provides endpoints for text continuation, improvement,
title suggestions, and live review functionality.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..services.llm import llm_service
from ..database import get_db
from ..models.project import User, UserSettings
from ..dependencies.auth import get_current_approved_user
from ..utils.rate_limiter import limiter, RATE_LIMIT_AI, RATE_LIMIT_DEFAULT
from ..utils.ai_endpoint import AIRequestContext, validate_model_availability, handle_ai_error

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ContinuationRequest(BaseModel):
    context: str
    max_tokens: int = 10000
    temperature: float = 0.7
    writing_style: str = "puitis"
    paragraph_count: int = 1
    brief_idea: str = ""
    model: str = "openai/gpt-oss-120b"


class ContinuationResponse(BaseModel):
    continuation: str
    model: str


class ImprovementRequest(BaseModel):
    text: str
    instruction: str = "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya."
    temperature: float = 0.7
    writing_style: str = "puitis"
    model: str = "openai/gpt-oss-120b"


class ImprovementResponse(BaseModel):
    improved_text: str
    model: str


class TitleSuggestionRequest(BaseModel):
    content: str
    title_style: str = "click_bait"
    temperature: float = 0.7
    model: str = "openai/gpt-oss-120b"


class TitleSuggestionResponse(BaseModel):
    titles: list[str]
    model: str


class ReviewIssue(BaseModel):
    original_text: str
    start_offset: int
    end_offset: int
    severity: str  # "critical" or "warning"
    issue_type: str  # "grammar", "clarity", "style", "redundancy", "word_choice"
    suggestion: str
    explanation: str


class LiveReviewRequest(BaseModel):
    content: str
    model: str = "openai/gpt-oss-120b"
    temperature: float = 0.7


class LiveReviewResponse(BaseModel):
    issues: list[ReviewIssue]
    model: str


# Helper function to get user's custom prompts

def get_user_custom_prompts(db: Session, user_id: int) -> dict | None:
    """Get user's custom prompts if available."""
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    return user_settings.custom_prompts if user_settings else None


# Endpoints

@router.post("/continue", response_model=ContinuationResponse)
@limiter.limit(RATE_LIMIT_AI)
async def generate_continuation(
    request: Request,
    body: ContinuationRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Generate text continuation based on context."""
    ctx = AIRequestContext(id(body), "continuation")
    ctx.log_start(context_length=len(body.context), max_tokens=body.max_tokens, temperature=body.temperature)
    ctx.log_debug(f"Context preview: {body.context[:100]}...")

    custom_prompts = get_user_custom_prompts(db, current_user.id)

    ctx.log_model_check(body.model)
    validate_model_availability(body.model, ctx.request_id)
    ctx.log_model_available(body.model)

    try:
        ctx.log_processing(body.model)
        continuation = await llm_service.generate_continuation(
            context=body.context,
            max_tokens=body.max_tokens,
            temperature=body.temperature,
            writing_style=body.writing_style,
            paragraph_count=body.paragraph_count,
            brief_idea=body.brief_idea,
            model=body.model,
            custom_prompts=custom_prompts
        )

        ctx.log_success(continuation_length=len(continuation))
        ctx.log_debug(f"Continuation preview: {continuation[:100]}...")

        return ContinuationResponse(continuation=continuation, model=body.model)

    except HTTPException:
        raise
    except Exception as e:
        ctx.log_error(e)
        handle_ai_error("generating continuation", e)


@router.post("/improve", response_model=ImprovementResponse)
@limiter.limit(RATE_LIMIT_AI)
async def improve_text(
    request: Request,
    body: ImprovementRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Improve selected text based on instruction."""
    ctx = AIRequestContext(id(body), "improvement")
    ctx.log_start(text_length=len(body.text), instruction=body.instruction[:50])
    ctx.log_debug(f"Text preview: {body.text[:100]}...")

    custom_prompts = get_user_custom_prompts(db, current_user.id)

    ctx.log_model_check(body.model)
    validate_model_availability(body.model, ctx.request_id)
    ctx.log_model_available(body.model)

    try:
        ctx.log_processing(body.model)
        improved_text = await llm_service.improve_text(
            text=body.text,
            instruction=body.instruction,
            temperature=body.temperature,
            writing_style=body.writing_style,
            model=body.model,
            custom_prompts=custom_prompts
        )

        ctx.log_success(improved_text_length=len(improved_text))
        ctx.log_debug(f"Improved text preview: {improved_text[:100]}...")

        return ImprovementResponse(improved_text=improved_text, model=body.model)

    except HTTPException:
        raise
    except Exception as e:
        ctx.log_error(e)
        handle_ai_error("improving text", e)


@router.post("/suggest-title", response_model=TitleSuggestionResponse)
@limiter.limit(RATE_LIMIT_AI)
async def suggest_title(request: Request, body: TitleSuggestionRequest):
    """Generate title suggestions based on content."""
    ctx = AIRequestContext(id(body), "title suggestion")
    ctx.log_start(content_length=len(body.content), title_style=body.title_style)
    ctx.log_debug(f"Content preview: {body.content[:100]}...")

    ctx.log_model_check(body.model)
    validate_model_availability(body.model, ctx.request_id)
    ctx.log_model_available(body.model)

    try:
        ctx.log_processing(body.model)
        titles = await llm_service.suggest_title(
            content=body.content,
            title_style=body.title_style,
            temperature=body.temperature,
            model=body.model
        )

        ctx.log_success(titles_count=len(titles))
        ctx.log_debug(f"Titles: {titles}")

        return TitleSuggestionResponse(titles=titles, model=body.model)

    except HTTPException:
        raise
    except Exception as e:
        ctx.log_error(e)
        handle_ai_error("generating title suggestions", e)


@router.post("/live-review", response_model=LiveReviewResponse)
@limiter.limit(RATE_LIMIT_AI)
async def live_review(
    request: Request,
    body: LiveReviewRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Analyze text and return issues with suggestions for improvement."""
    ctx = AIRequestContext(id(body), "live review")
    ctx.log_start(content_length=len(body.content))
    ctx.log_debug(f"Content preview: {body.content[:100]}...")

    ctx.log_model_check(body.model)
    validate_model_availability(body.model, ctx.request_id)
    ctx.log_model_available(body.model)

    try:
        ctx.log_processing(body.model)
        issues = await llm_service.live_review(
            content=body.content,
            temperature=body.temperature,
            model=body.model
        )

        ctx.log_success(issues_count=len(issues))

        return LiveReviewResponse(issues=issues, model=body.model)

    except HTTPException:
        raise
    except Exception as e:
        ctx.log_error(e)
        handle_ai_error("during live review", e)


@router.get("/status")
@limiter.limit(RATE_LIMIT_DEFAULT)
def check_ai_status(request: Request):
    """Check AI service status and provider information."""
    provider_info = llm_service.get_provider_info()

    return {
        "status": "available" if llm_service.check_model_available() else "unavailable",
        "providers": provider_info
    }
