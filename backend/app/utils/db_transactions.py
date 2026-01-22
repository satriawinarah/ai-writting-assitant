"""
Database transaction utilities for safe multi-step operations.

This module provides context managers and decorators for handling
database transactions with automatic rollback on errors.
"""

from contextlib import contextmanager
from sqlalchemy.orm import Session
from typing import Generator


@contextmanager
def transaction(db: Session, auto_commit: bool = True) -> Generator[Session, None, None]:
    """
    Context manager for database transactions with automatic rollback.

    Args:
        db: The database session
        auto_commit: Whether to auto-commit on success (default: True)

    Yields:
        The database session

    Example:
        with transaction(db) as session:
            # Multiple operations here
            repo1.create(...)
            repo2.update(...)
            # Auto-commits if no exceptions
    """
    try:
        yield db
        if auto_commit:
            db.commit()
    except Exception as e:
        db.rollback()
        raise e


@contextmanager
def savepoint(db: Session) -> Generator[Session, None, None]:
    """
    Context manager for nested transactions using savepoints.

    Args:
        db: The database session

    Yields:
        The database session

    Example:
        with transaction(db):
            operation1()
            with savepoint(db):
                operation2()  # Will rollback to savepoint if this fails
            operation3()  # Still executes even if operation2 failed
    """
    nested = db.begin_nested()
    try:
        yield db
        nested.commit()
    except Exception as e:
        nested.rollback()
        raise e
