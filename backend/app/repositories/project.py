"""
Project repository for database operations.

This module provides a repository class for managing Project entities,
encapsulating all database queries related to projects.
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from ..models import Project, Chapter


class ProjectRepository:
    """Repository for Project database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int, user_id: int) -> Optional[Project]:
        """
        Get a project by ID for a specific user.

        Args:
            project_id: The project ID
            user_id: The user ID (for ownership check)

        Returns:
            The Project or None if not found
        """
        return self.db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user_id
        ).first()

    def get_or_404(self, project_id: int, user_id: int) -> Project:
        """
        Get a project by ID for a specific user, raising 404 if not found.

        Args:
            project_id: The project ID
            user_id: The user ID (for ownership check)

        Returns:
            The Project

        Raises:
            HTTPException: 404 if project not found
        """
        project = self.get_by_id(project_id, user_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project

    def list_for_user(self, user_id: int) -> list[tuple[Project, int]]:
        """
        List all projects for a user with chapter counts.

        Args:
            user_id: The user ID

        Returns:
            List of (Project, chapter_count) tuples
        """
        chapter_count_subquery = (
            self.db.query(
                Chapter.project_id,
                func.count(Chapter.id).label("chapter_count")
            )
            .group_by(Chapter.project_id)
            .subquery()
        )

        return (
            self.db.query(
                Project,
                func.coalesce(chapter_count_subquery.c.chapter_count, 0).label("chapter_count")
            )
            .outerjoin(chapter_count_subquery, Project.id == chapter_count_subquery.c.project_id)
            .filter(Project.user_id == user_id)
            .order_by(Project.updated_at.desc())
            .all()
        )

    def create(self, user_id: int, auto_commit: bool = True, **data) -> Project:
        """
        Create a new project.

        Args:
            user_id: The user ID
            auto_commit: Whether to commit immediately (default: True)
            **data: Project data (title, description, etc.)

        Returns:
            The created Project
        """
        project = Project(user_id=user_id, **data)
        self.db.add(project)
        if auto_commit:
            self.db.commit()
            self.db.refresh(project)
        else:
            self.db.flush()  # Get ID without committing
        return project

    def update(self, project: Project, auto_commit: bool = True, **data) -> Project:
        """
        Update a project.

        Args:
            project: The project to update
            auto_commit: Whether to commit immediately (default: True)
            **data: Fields to update

        Returns:
            The updated Project
        """
        for key, value in data.items():
            setattr(project, key, value)
        if auto_commit:
            self.db.commit()
            self.db.refresh(project)
        else:
            self.db.flush()
        return project

    def delete(self, project: Project, auto_commit: bool = True) -> None:
        """
        Delete a project.

        Args:
            project: The project to delete
            auto_commit: Whether to commit immediately (default: True)
        """
        self.db.delete(project)
        if auto_commit:
            self.db.commit()
