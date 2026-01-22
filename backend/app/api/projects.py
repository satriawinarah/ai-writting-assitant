"""
Projects API endpoints for managing writing projects and chapters.

This module provides CRUD endpoints for projects and chapters,
using the repository pattern for database operations.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import (
    Project as ProjectSchema,
    ProjectCreate,
    ProjectUpdate,
    ProjectList,
    Chapter as ChapterSchema,
    ChapterCreate,
    ChapterUpdate,
)
from ..dependencies.auth import get_current_approved_user
from ..utils.rate_limiter import limiter, RATE_LIMIT_DEFAULT
from ..utils.db_transactions import transaction
from ..repositories import ProjectRepository, ChapterRepository

router = APIRouter(prefix="/projects", tags=["projects"])


# Project Endpoints

@router.get("", response_model=List[ProjectList])
@limiter.limit(RATE_LIMIT_DEFAULT)
def list_projects(
    request: Request,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """List all projects for the current user."""
    repo = ProjectRepository(db)
    projects = repo.list_for_user(current_user.id)

    return [
        ProjectList(
            id=p.id,
            title=p.title,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at,
            chapter_count=chapter_count,
        )
        for p, chapter_count in projects
    ]


@router.post("", response_model=ProjectSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def create_project(
    request: Request,
    project: ProjectCreate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Create a new project for the current user."""
    repo = ProjectRepository(db)
    return repo.create(current_user.id, **project.model_dump())


@router.get("/{project_id}", response_model=ProjectSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def get_project(
    request: Request,
    project_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Get a project by ID (only if it belongs to current user)."""
    repo = ProjectRepository(db)
    return repo.get_or_404(project_id, current_user.id)


@router.put("/{project_id}", response_model=ProjectSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def update_project(
    request: Request,
    project_id: int,
    project: ProjectUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Update a project (only if it belongs to current user)."""
    with transaction(db):
        repo = ProjectRepository(db)
        db_project = repo.get_or_404(project_id, current_user.id)
        return repo.update(db_project, auto_commit=False, **project.model_dump(exclude_unset=True))


@router.delete("/{project_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
def delete_project(
    request: Request,
    project_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Delete a project (only if it belongs to current user)."""
    with transaction(db):
        repo = ProjectRepository(db)
        db_project = repo.get_or_404(project_id, current_user.id)
        repo.delete(db_project, auto_commit=False)
    return {"message": "Project deleted successfully"}


# Chapter Endpoints

@router.post("/{project_id}/chapters", response_model=ChapterSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def create_chapter(
    request: Request,
    project_id: int,
    chapter: ChapterCreate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Create a new chapter in a project (only if project belongs to current user)."""
    with transaction(db):
        project_repo = ProjectRepository(db)
        project_repo.get_or_404(project_id, current_user.id)

        chapter_repo = ChapterRepository(db)
        return chapter_repo.create(project_id, auto_commit=False, **chapter.model_dump())


@router.get("/{project_id}/chapters/{chapter_id}", response_model=ChapterSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def get_chapter(
    request: Request,
    project_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Get a chapter by ID (only if project belongs to current user)."""
    repo = ChapterRepository(db)
    return repo.get_or_404(chapter_id, project_id, current_user.id)


@router.put("/{project_id}/chapters/{chapter_id}", response_model=ChapterSchema)
@limiter.limit(RATE_LIMIT_DEFAULT)
def update_chapter(
    request: Request,
    project_id: int,
    chapter_id: int,
    chapter: ChapterUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Update a chapter (only if project belongs to current user)."""
    with transaction(db):
        repo = ChapterRepository(db)
        db_chapter = repo.get_or_404(chapter_id, project_id, current_user.id)
        return repo.update(db_chapter, auto_commit=False, **chapter.model_dump(exclude_unset=True))


@router.delete("/{project_id}/chapters/{chapter_id}")
@limiter.limit(RATE_LIMIT_DEFAULT)
def delete_chapter(
    request: Request,
    project_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Delete a chapter (only if project belongs to current user)."""
    with transaction(db):
        repo = ChapterRepository(db)
        db_chapter = repo.get_or_404(chapter_id, project_id, current_user.id)
        repo.delete(db_chapter, auto_commit=False)
    return {"message": "Chapter deleted successfully"}
