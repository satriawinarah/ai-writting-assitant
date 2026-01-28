/**
 * Project Context for centralized project and chapter state management.
 *
 * This context eliminates prop drilling by providing project/chapter
 * state and actions to any component in the tree.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { projectsAPI, chaptersAPI } from '../services/api';
import { useNotifications } from './NotificationContext';
import useErrorHandler from '../hooks/useErrorHandler';

const ProjectContext = createContext();

const SAVE_DEBOUNCE_MS = 1000;

export function ProjectProvider({ children, isAuthenticated }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
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
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
      handleError(err, 'Failed to load projects');
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
      console.error('Error loading project:', err);
      setError('Failed to load project');
      handleError(err, 'Failed to load project');
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
        title: 'Chapter 1',
        content: '',
        order: 0,
      });

      await loadProject(response.data);
      setActiveChapter(chapterResponse.data);

      showSuccess('Project created successfully');
      return response.data;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      handleError(err, 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProject, handleError, showSuccess]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await projectsAPI.delete(projectId);
      await loadProjects();

      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveChapter(null);
      }

      showSuccess('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      handleError(err, 'Failed to delete project');
      throw err;
    }
  }, [activeProject, handleError, showSuccess]);

  const renameProject = useCallback(async (projectId, newTitle) => {
    try {
      await projectsAPI.update(projectId, { title: newTitle });
      await loadProjects();

      if (activeProject?.id === projectId) {
        await loadProject(activeProject);
      }

      showSuccess('Project renamed successfully');
    } catch (err) {
      console.error('Error renaming project:', err);
      handleError(err, 'Failed to rename project');
      throw err;
    }
  }, [activeProject, loadProject, handleError, showSuccess]);

  const createChapter = useCallback(async (data) => {
    if (!activeProject) return;

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
      console.error('Error creating chapter:', err);
      handleError(err, 'Failed to create chapter');
      throw err;
    }
  }, [activeProject, handleError, showSuccess]);

  const selectChapter = useCallback((chapter) => {
    setActiveChapter(chapter);
  }, []);

  const updateChapterContent = useCallback((content) => {
    if (!activeProject || !activeChapter) return;

    const projectId = activeProject.id;
    const chapterId = activeChapter.id;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await chaptersAPI.update(projectId, chapterId, { content });
      } catch (err) {
        console.error('Error updating chapter:', err);
        handleError(err, 'Failed to save chapter content');
      }
    }, SAVE_DEBOUNCE_MS);
  }, [activeProject, activeChapter, handleError]);

  const deleteChapter = useCallback(async (chapterId) => {
    if (!activeProject) return;

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
      console.error('Error deleting chapter:', err);
      handleError(err, 'Failed to delete chapter');
      throw err;
    }
  }, [activeProject, activeChapter, loadProject, handleError, showSuccess]);

  const renameChapter = useCallback(async (chapterId, newTitle) => {
    if (!activeProject) return;

    try {
      await chaptersAPI.update(activeProject.id, chapterId, { title: newTitle });
      await loadProject(activeProject);

      showSuccess('Chapter renamed successfully');
    } catch (err) {
      console.error('Error renaming chapter:', err);
      handleError(err, 'Failed to rename chapter');
      throw err;
    }
  }, [activeProject, loadProject, handleError, showSuccess]);

  const value = {
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
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
