/**
 * Custom hook for project and chapter management.
 *
 * Handles CRUD operations for projects and chapters,
 * including debounced content saving with loading/error state exposure.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { projectsAPI, chaptersAPI } from '../services/api';
import useErrorHandler from './useErrorHandler';
import { useNotifications } from '../contexts/NotificationContext';

const SAVE_DEBOUNCE_MS = 1000;
const DEFAULT_CHAPTER_TITLE = 'Chapter 1';
const DEFAULT_CHAPTER_ORDER = 0;

export default function useProjects(isAuthenticated) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const savingRef = useRef(false);
  const pendingContentRef = useRef(null);
  const { handleError } = useErrorHandler();
  const { showSuccess } = useNotifications();

  // Load projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setActiveChapter(null);
      setError(null);
    }
  }, [isAuthenticated]);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (err) {
      const errorMessage = 'Failed to load projects';
      console.error('Error loading projects:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = useCallback(async (project) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsAPI.get(project.id);
      setActiveProject(response.data);

      if (response.data.chapters.length > 0) {
        setActiveChapter(response.data.chapters[0]);
      } else {
        setActiveChapter(null);
      }
    } catch (err) {
      const errorMessage = 'Failed to load project';
      console.error('Error loading project:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createProject = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsAPI.create(data);
      await loadProjects();

      const chapterResponse = await chaptersAPI.create(response.data.id, {
        title: DEFAULT_CHAPTER_TITLE,
        content: '',
        order: DEFAULT_CHAPTER_ORDER,
      });

      await loadProject(response.data);
      setActiveChapter(chapterResponse.data);

      showSuccess('Project created successfully');
      return response.data;
    } catch (err) {
      const errorMessage = 'Failed to create project';
      console.error('Error creating project:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProject, handleError, showSuccess]);

  const deleteProject = useCallback(async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      await projectsAPI.delete(projectId);
      await loadProjects();

      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveChapter(null);
      }

      showSuccess('Project deleted successfully');
    } catch (err) {
      const errorMessage = 'Failed to delete project';
      console.error('Error deleting project:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProject, handleError, showSuccess]);

  const renameProject = useCallback(async (projectId, newTitle) => {
    setLoading(true);
    setError(null);
    try {
      await projectsAPI.update(projectId, { title: newTitle });
      await loadProjects();

      if (activeProject?.id === projectId) {
        await loadProject(activeProject);
      }

      showSuccess('Project renamed successfully');
    } catch (err) {
      const errorMessage = 'Failed to rename project';
      console.error('Error renaming project:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProject, loadProject, handleError, showSuccess]);

  const createChapter = useCallback(async (data) => {
    if (!activeProject) return;

    setLoading(true);
    setError(null);
    try {
      const response = await chaptersAPI.create(activeProject.id, {
        ...data,
        order: activeProject.chapters.length,
      });

      const newChapter = response.data;
      const projectResponse = await projectsAPI.get(activeProject.id);
      setActiveProject(projectResponse.data);
      setActiveChapter(newChapter);

      showSuccess('Chapter created successfully');
      return newChapter;
    } catch (err) {
      const errorMessage = 'Failed to create chapter';
      console.error('Error creating chapter:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProject, handleError, showSuccess]);

  const selectChapter = useCallback((chapter) => {
    setActiveChapter(chapter);
  }, []);

  const updateChapterContent = useCallback((content) => {
    if (!activeProject || !activeChapter) return;

    const projectId = activeProject.id;
    const chapterId = activeChapter.id;

    // Store pending content for race condition handling
    pendingContentRef.current = { projectId, chapterId, content };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Prevent concurrent saves
      if (savingRef.current) {
        // Re-queue the save if one is in progress
        setTimeout(() => {
          if (pendingContentRef.current) {
            updateChapterContent(pendingContentRef.current.content);
          }
        }, SAVE_DEBOUNCE_MS);
        return;
      }

      savingRef.current = true;
      const pending = pendingContentRef.current;
      pendingContentRef.current = null;

      try {
        if (pending) {
          await chaptersAPI.update(pending.projectId, pending.chapterId, { content: pending.content });
        }
      } catch (err) {
        console.error('Error updating chapter:', err);
        handleError(err, 'Failed to save chapter content');
      } finally {
        savingRef.current = false;
      }
    }, SAVE_DEBOUNCE_MS);
  }, [activeProject, activeChapter, handleError]);

  const deleteChapter = useCallback(async (chapterId) => {
    if (!activeProject) return;

    setLoading(true);
    setError(null);
    try {
      await chaptersAPI.delete(activeProject.id, chapterId);
      await loadProject(activeProject);

      if (activeChapter?.id === chapterId) {
        const updatedProject = await projectsAPI.get(activeProject.id);
        if (updatedProject.data.chapters.length > 0) {
          setActiveChapter(updatedProject.data.chapters[0]);
        } else {
          setActiveChapter(null);
        }
      }

      showSuccess('Chapter deleted successfully');
    } catch (err) {
      const errorMessage = 'Failed to delete chapter';
      console.error('Error deleting chapter:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProject, activeChapter, loadProject, handleError, showSuccess]);

  const renameChapter = useCallback(async (chapterId, newTitle) => {
    if (!activeProject) return;

    setLoading(true);
    setError(null);
    try {
      await chaptersAPI.update(activeProject.id, chapterId, { title: newTitle });
      await loadProject(activeProject);

      showSuccess('Chapter renamed successfully');
    } catch (err) {
      const errorMessage = 'Failed to rename chapter';
      console.error('Error renaming chapter:', err);
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProject, loadProject, handleError, showSuccess]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    projects,
    activeProject,
    activeChapter,
    loading,
    error,

    // Project actions
    loadProject,
    createProject,
    deleteProject,
    renameProject,

    // Chapter actions
    createChapter,
    selectChapter,
    updateChapterContent,
    deleteChapter,
    renameChapter,

    // Utility
    clearError,
  };
}
