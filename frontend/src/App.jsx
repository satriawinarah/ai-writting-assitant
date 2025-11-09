import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Settings from './components/Settings';
import ProjectModal from './components/ProjectModal';
import ChapterModal from './components/ChapterModal';
import Login from './components/Login';
import Register from './components/Register';
import { projectsAPI, chaptersAPI, authAPI } from './services/api';

export default function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // App state
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [currentView, setCurrentView] = useState('editor'); // 'editor' or 'settings'

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load projects when user is authenticated
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    const response = await authAPI.login(credentials);
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
  };

  const handleRegister = async (userData) => {
    await authAPI.register(userData);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setProjects([]);
      setActiveProject(null);
      setActiveChapter(null);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProject = async (project) => {
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
  };

  const handleCreateProject = async (data) => {
    try {
      const response = await projectsAPI.create(data);
      await loadProjects();
      await loadProject(response.data);
      setShowProjectModal(false);

      // Create first chapter
      const chapterResponse = await chaptersAPI.create(response.data.id, {
        title: 'Chapter 1',
        content: '',
        order: 0,
      });
      setActiveChapter(chapterResponse.data);
      await loadProject(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateChapter = async (data) => {
    if (!activeProject) return;

    try {
      const response = await chaptersAPI.create(activeProject.id, {
        ...data,
        order: activeProject.chapters.length,
      });
      setActiveChapter(response.data);
      await loadProject(activeProject);
      setShowChapterModal(false);
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  };

  const handleUpdateChapter = async (content) => {
    if (!activeProject || !activeChapter) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounce save
    const timeout = setTimeout(async () => {
      try {
        await chaptersAPI.update(activeProject.id, activeChapter.id, { content });
      } catch (error) {
        console.error('Error updating chapter:', error);
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  const handleSelectChapter = (chapter) => {
    setActiveChapter(chapter);
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Show main app if authenticated
  return (
    <div className="app">
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        activeChapter={activeChapter}
        currentView={currentView}
        onSelectProject={loadProject}
        onSelectChapter={handleSelectChapter}
        onNewProject={() => setShowProjectModal(true)}
        onNewChapter={() => setShowChapterModal(true)}
        onViewSettings={() => setCurrentView('settings')}
        onViewEditor={() => setCurrentView('editor')}
        onDeleteProject={async (projectId) => {
          try {
            await projectsAPI.delete(projectId);
            await loadProjects();
            if (activeProject?.id === projectId) {
              setActiveProject(null);
              setActiveChapter(null);
            }
          } catch (error) {
            console.error('Error deleting project:', error);
          }
        }}
        onDeleteChapter={async (chapterId) => {
          if (!activeProject) return;
          try {
            await chaptersAPI.delete(activeProject.id, chapterId);
            await loadProject(activeProject);
            if (activeChapter?.id === chapterId) {
              if (activeProject.chapters.length > 0) {
                setActiveChapter(activeProject.chapters[0]);
              } else {
                setActiveChapter(null);
              }
            }
          } catch (error) {
            console.error('Error deleting chapter:', error);
          }
        }}
        onRenameProject={async (projectId, newTitle) => {
          try {
            await projectsAPI.update(projectId, { title: newTitle });
            await loadProjects();
            if (activeProject?.id === projectId) {
              await loadProject(activeProject);
            }
          } catch (error) {
            console.error('Error renaming project:', error);
          }
        }}
        onRenameChapter={async (chapterId, newTitle) => {
          if (!activeProject) return;
          try {
            await chaptersAPI.update(activeProject.id, chapterId, { title: newTitle });
            await loadProject(activeProject);
          } catch (error) {
            console.error('Error renaming chapter:', error);
          }
        }}
      />

      <div className="main-content">
        <div className="user-bar">
          <span>Welcome, {user.full_name}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        {currentView === 'settings' ? (
          <Settings />
        ) : activeProject && activeChapter ? (
          <Editor chapter={activeChapter} onUpdate={handleUpdateChapter} />
        ) : (
          <div className="empty-state">
            <h2>Welcome to DiksiAI</h2>
            <p>Create a new project to start writing</p>
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSubmit={handleCreateProject}
      />

      <ChapterModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        onSubmit={handleCreateChapter}
      />
    </div>
  );
}
