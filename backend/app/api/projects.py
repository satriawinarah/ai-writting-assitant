from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Project, Chapter, User
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

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[ProjectList])
def list_projects(
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """List all projects for the current user"""
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.updated_at.desc()).all()
    return [
        ProjectList(
            id=p.id,
            title=p.title,
            description=p.description,
            created_at=p.created_at,
            updated_at=p.updated_at,
            chapter_count=len(p.chapters),
        )
        for p in projects
    ]


@router.post("", response_model=ProjectSchema)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Create a new project for the current user"""
    db_project = Project(**project.model_dump(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Get a project by ID (only if it belongs to current user)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Update a project (only if it belongs to current user)"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in project.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)

    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Delete a project (only if it belongs to current user)"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}


# Chapter endpoints
@router.post("/{project_id}/chapters", response_model=ChapterSchema)
def create_chapter(
    project_id: int,
    chapter: ChapterCreate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Create a new chapter in a project (only if project belongs to current user)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_chapter = Chapter(project_id=project_id, **chapter.model_dump())
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter


@router.get("/{project_id}/chapters/{chapter_id}", response_model=ChapterSchema)
def get_chapter(
    project_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Get a chapter by ID (only if project belongs to current user)"""
    chapter = (
        db.query(Chapter)
        .join(Project)
        .filter(
            Chapter.id == chapter_id,
            Chapter.project_id == project_id,
            Project.user_id == current_user.id
        )
        .first()
    )
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.put("/{project_id}/chapters/{chapter_id}", response_model=ChapterSchema)
def update_chapter(
    project_id: int,
    chapter_id: int,
    chapter: ChapterUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Update a chapter (only if project belongs to current user)"""
    db_chapter = (
        db.query(Chapter)
        .join(Project)
        .filter(
            Chapter.id == chapter_id,
            Chapter.project_id == project_id,
            Project.user_id == current_user.id
        )
        .first()
    )
    if not db_chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    for key, value in chapter.model_dump(exclude_unset=True).items():
        setattr(db_chapter, key, value)

    db.commit()
    db.refresh(db_chapter)
    return db_chapter


@router.delete("/{project_id}/chapters/{chapter_id}")
def delete_chapter(
    project_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db)
):
    """Delete a chapter (only if project belongs to current user)"""
    db_chapter = (
        db.query(Chapter)
        .join(Project)
        .filter(
            Chapter.id == chapter_id,
            Chapter.project_id == project_id,
            Project.user_id == current_user.id
        )
        .first()
    )
    if not db_chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    db.delete(db_chapter)
    db.commit()
    return {"message": "Chapter deleted successfully"}
