from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

from ..constants import (
    MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
    MAX_CONTENT_LENGTH, MAX_CHAPTER_ORDER
)


class ChapterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=MAX_TITLE_LENGTH)
    content: Optional[str] = Field(default="", max_length=MAX_CONTENT_LENGTH)
    order: int = Field(default=0, ge=0, le=MAX_CHAPTER_ORDER)


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=MAX_TITLE_LENGTH)
    content: Optional[str] = Field(default=None, max_length=MAX_CONTENT_LENGTH)
    order: Optional[int] = Field(default=None, ge=0, le=MAX_CHAPTER_ORDER)


class Chapter(ChapterBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=MAX_TITLE_LENGTH)
    description: Optional[str] = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=MAX_TITLE_LENGTH)
    description: Optional[str] = Field(default=None, max_length=MAX_DESCRIPTION_LENGTH)


class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    chapters: List[Chapter] = []

    class Config:
        from_attributes = True


class ProjectList(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    chapter_count: int = 0

    class Config:
        from_attributes = True
