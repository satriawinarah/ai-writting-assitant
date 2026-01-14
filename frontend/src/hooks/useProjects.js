/**
 * Custom hook for project and chapter management.
 *
 * Handles CRUD operations for projects and chapters,
 * including debounced content saving.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { projectsAPI, chaptersAPI } from '../services/api';

export default function useProjects(isAuthenticated) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Load projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    } else {
      // Clear state when logged out
      setProjects([]);
      setActiveProject(null);
      setActiveChapter(null);
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProject = useCallback(async (project) => {
    try {
      const response = await projectsAPI.get(project.id);
      setActiveProject(response.data);

      // Load first chapter if available
      if (response.data.chapters.length > 0) {
        setActiveChapter(response.data.chapters[0]);
      } else {
        setActiveChapter(null);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  }, []);

  const createProject = useCallback(async (data) => {
    try {
      const response = await projectsAPI.create(data);
      await loadProjects();

      // Create first chapter automatically
      const chapterResponse = await chaptersAPI.create(response.data.id, {
        title: 'Chapter 1',
        content: '',
        order: 0,
      });

      await loadProject(response.data);
      setActiveChapter(chapterResponse.data);

      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, [loadProject]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await projectsAPI.delete(projectId);
      await loadProjects();

      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveChapter(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [activeProject]);

  const renameProject = useCallback(async (projectId, newTitle) => {
    try {
      await projectsAPI.update(projectId, { title: newTitle });
      await loadProjects();

      if (activeProject?.id === projectId) {
        await loadProject(activeProject);
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      throw error;
    }
  }, [activeProject, loadProject]);

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

      return newChapter;
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  }, [activeProject]);

  const selectChapter = useCallback((chapter) => {
    setActiveChapter(chapter);
  }, []);

  const updateChapterContent = useCallback((content) => {
    if (!activeProject || !activeChapter) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save (1 second)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await chaptersAPI.update(activeProject.id, activeChapter.id, { content });
      } catch (error) {
        console.error('Error updating chapter:', error);
      }
    }, 1000);
  }, [activeProject, activeChapter]);

  const deleteChapter = useCallback(async (chapterId) => {
    if (!activeProject) return;

    try {
      await chaptersAPI.delete(activeProject.id, chapterId);
      await loadProject(activeProject);

      if (activeChapter?.id === chapterId) {
        // Select first remaining chapter or null
        const updatedProject = await projectsAPI.get(activeProject.id);
        if (updatedProject.data.chapters.length > 0) {
          setActiveChapter(updatedProject.data.chapters[0]);
        } else {
          setActiveChapter(null);
        }
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  }, [activeProject, activeChapter, loadProject]);

  const renameChapter = useCallback(async (chapterId, newTitle) => {
    if (!activeProject) return;

    try {
      await chaptersAPI.update(activeProject.id, chapterId, { title: newTitle });
      await loadProject(activeProject);
    } catch (error) {
      console.error('Error renaming chapter:', error);
      throw error;
    }
  }, [activeProject, loadProject]);

  return {
    // State
    projects,
    activeProject,
    activeChapter,

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
}
