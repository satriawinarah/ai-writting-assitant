"""
Chapter repository for database operations.

This module provides a repository class for managing Chapter entities,
encapsulating all database queries related to chapters.
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models import Project, Chapter


class ChapterRepository:
    """Repository for Chapter database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self, chapter_id: int, project_id: int, user_id: int
    ) -> Optional[Chapter]:
        """
        Get a chapter by ID with project ownership check.

        Args:
            chapter_id: The chapter ID
            project_id: The project ID
            user_id: The user ID (for ownership check)

        Returns:
            The Chapter or None if not found
        """
        return (
            self.db.query(Chapter)
            .join(Project)
            .filter(
                Chapter.id == chapter_id,
                Chapter.project_id == project_id,
                Project.user_id == user_id
            )
            .first()
        )

    def get_or_404(
        self, chapter_id: int, project_id: int, user_id: int
    ) -> Chapter:
        """
        Get a chapter by ID, raising 404 if not found.

        Args:
            chapter_id: The chapter ID
            project_id: The project ID
            user_id: The user ID (for ownership check)

        Returns:
            The Chapter

        Raises:
            HTTPException: 404 if chapter not found
        """
        chapter = self.get_by_id(chapter_id, project_id, user_id)
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")
        return chapter

    def create(self, project_id: int, **data) -> Chapter:
        """
        Create a new chapter.

        Args:
            project_id: The project ID
            **data: Chapter data (title, content, order, etc.)

        Returns:
            The created Chapter
        """
        chapter = Chapter(project_id=project_id, **data)
        self.db.add(chapter)
        self.db.commit()
        self.db.refresh(chapter)
        return chapter

    def update(self, chapter: Chapter, **data) -> Chapter:
        """
        Update a chapter.

        Args:
            chapter: The chapter to update
            **data: Fields to update

        Returns:
            The updated Chapter
        """
        for key, value in data.items():
            setattr(chapter, key, value)
        self.db.commit()
        self.db.refresh(chapter)
        return chapter

    def delete(self, chapter: Chapter) -> None:
        """
        Delete a chapter.

        Args:
            chapter: The chapter to delete
        """
        self.db.delete(chapter)
        self.db.commit()
