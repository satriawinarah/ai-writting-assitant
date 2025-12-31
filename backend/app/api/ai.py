import logging
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..services.llm_service import llm_service
from ..database import get_db
from ..models.project import User, UserSettings
from ..dependencies.auth import get_current_approved_user

logger = logging.getLogger(__name__)

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


@router.post("/continue", response_model=ContinuationResponse)
async def generate_continuation(
    request: ContinuationRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Generate text continuation based on context"""
    start_time = time.time()
    request_id = id(request)

    logger.info(f"[{request_id}] Received continuation request - context length: {len(request.context)}, max_tokens: {request.max_tokens}, temperature: {request.temperature}")
    logger.debug(f"[{request_id}] Context preview: {request.context[:100]}...")

    # Get user's custom prompts if available
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    custom_prompts = user_settings.custom_prompts if user_settings else None

    # Check if model is available
    logger.info(f"[{request_id}] Checking model availability for {request.model}...")
    if not llm_service.check_model_available(request.model):
        logger.error(f"[{request_id}] Model {request.model} not available")
        raise HTTPException(
            status_code=503,
            detail=f"Model {request.model} is not available. Please check API key configuration."
        )
    logger.info(f"[{request_id}] Model {request.model} is available")

    try:
        logger.info(f"[{request_id}] Starting generation with llm_service using {request.model}...")
        continuation = await llm_service.generate_continuation(
            context=request.context,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            writing_style=request.writing_style,
            paragraph_count=request.paragraph_count,
            brief_idea=request.brief_idea,
            model=request.model,
            custom_prompts=custom_prompts
        )

        elapsed_time = time.time() - start_time
        logger.info(f"[{request_id}] Generation completed in {elapsed_time:.2f}s - continuation length: {len(continuation)}")
        logger.debug(f"[{request_id}] Continuation preview: {continuation[:100]}...")

        return ContinuationResponse(
            continuation=continuation,
            model=request.model
        )

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"[{request_id}] Error generating continuation after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating continuation: {str(e)}"
        )


@router.post("/improve", response_model=ImprovementResponse)
async def improve_text(
    request: ImprovementRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Improve selected text based on instruction"""
    start_time = time.time()
    request_id = id(request)

    logger.info(f"[{request_id}] Received improvement request - text length: {len(request.text)}, instruction: {request.instruction[:50]}...")
    logger.debug(f"[{request_id}] Text preview: {request.text[:100]}...")

    # Get user's custom prompts if available
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    custom_prompts = user_settings.custom_prompts if user_settings else None

    # Check if model is available
    logger.info(f"[{request_id}] Checking model availability for {request.model}...")
    if not llm_service.check_model_available(request.model):
        logger.error(f"[{request_id}] Model {request.model} not available")
        raise HTTPException(
            status_code=503,
            detail=f"Model {request.model} is not available. Please check API key configuration."
        )
    logger.info(f"[{request_id}] Model {request.model} is available")

    try:
        logger.info(f"[{request_id}] Starting improvement with llm_service using {request.model}...")
        improved_text = await llm_service.improve_text(
            text=request.text,
            instruction=request.instruction,
            temperature=request.temperature,
            writing_style=request.writing_style,
            model=request.model,
            custom_prompts=custom_prompts
        )

        elapsed_time = time.time() - start_time
        logger.info(f"[{request_id}] Improvement completed in {elapsed_time:.2f}s - improved text length: {len(improved_text)}")
        logger.debug(f"[{request_id}] Improved text preview: {improved_text[:100]}...")

        return ImprovementResponse(
            improved_text=improved_text,
            model=request.model
        )

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"[{request_id}] Error improving text after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error improving text: {str(e)}"
        )


@router.post("/suggest-title", response_model=TitleSuggestionResponse)
async def suggest_title(request: TitleSuggestionRequest):
    """Generate title suggestions based on content"""
    start_time = time.time()
    request_id = id(request)

    logger.info(f"[{request_id}] Received title suggestion request - content length: {len(request.content)}, title_style: {request.title_style}")
    logger.debug(f"[{request_id}] Content preview: {request.content[:100]}...")

    # Check if model is available
    logger.info(f"[{request_id}] Checking model availability for {request.model}...")
    if not llm_service.check_model_available(request.model):
        logger.error(f"[{request_id}] Model {request.model} not available")
        raise HTTPException(
            status_code=503,
            detail=f"Model {request.model} is not available. Please check API key configuration."
        )
    logger.info(f"[{request_id}] Model {request.model} is available")

    try:
        logger.info(f"[{request_id}] Starting title generation with llm_service using {request.model}...")
        titles = await llm_service.suggest_title(
            content=request.content,
            title_style=request.title_style,
            temperature=request.temperature,
            model=request.model
        )

        elapsed_time = time.time() - start_time
        logger.info(f"[{request_id}] Title generation completed in {elapsed_time:.2f}s - generated {len(titles)} titles")
        logger.debug(f"[{request_id}] Titles: {titles}")

        return TitleSuggestionResponse(
            titles=titles,
            model=request.model
        )

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"[{request_id}] Error generating titles after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating title suggestions: {str(e)}"
        )


@router.post("/live-review", response_model=LiveReviewResponse)
async def live_review(
    request: LiveReviewRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Analyze text and return issues with suggestions for improvement"""
    start_time = time.time()
    request_id = id(request)

    logger.info(f"[{request_id}] Received live review request - content length: {len(request.content)}")
    logger.debug(f"[{request_id}] Content preview: {request.content[:100]}...")

    # Check if model is available
    logger.info(f"[{request_id}] Checking model availability for {request.model}...")
    if not llm_service.check_model_available(request.model):
        logger.error(f"[{request_id}] Model {request.model} not available")
        raise HTTPException(
            status_code=503,
            detail=f"Model {request.model} is not available. Please check API key configuration."
        )
    logger.info(f"[{request_id}] Model {request.model} is available")

    try:
        logger.info(f"[{request_id}] Starting live review with llm_service using {request.model}...")
        issues = await llm_service.live_review(
            content=request.content,
            temperature=request.temperature,
            model=request.model
        )

        elapsed_time = time.time() - start_time
        logger.info(f"[{request_id}] Live review completed in {elapsed_time:.2f}s - found {len(issues)} issues")

        return LiveReviewResponse(
            issues=issues,
            model=request.model
        )

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"[{request_id}] Error during live review after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error during live review: {str(e)}"
        )


@router.get("/status")
def check_ai_status():
    """Check AI service status and provider information"""
    provider_info = llm_service.get_provider_info()

    return {
        "status": "available" if llm_service.check_model_available() else "unavailable",
        "providers": provider_info
    }
