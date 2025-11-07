import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
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
  const [editingProjectTitle, setEditingProjectTitle] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [tempProjectTitle, setTempProjectTitle] = useState('');
  const [tempChapterTitle, setTempChapterTitle] = useState('');

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

  const handleProjectTitleDoubleClick = () => {
    setEditingProjectTitle(true);
    setTempProjectTitle(activeProject.title);
  };

  const handleProjectTitleChange = (e) => {
    setTempProjectTitle(e.target.value);
  };

  const handleProjectTitleSave = async () => {
    if (!activeProject || !tempProjectTitle.trim()) {
      setEditingProjectTitle(false);
      return;
    }

    try {
      await projectsAPI.update(activeProject.id, { title: tempProjectTitle.trim() });
      await loadProject(activeProject);
      await loadProjects();
      setEditingProjectTitle(false);
    } catch (error) {
      console.error('Error updating project title:', error);
    }
  };

  const handleProjectTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleProjectTitleSave();
    } else if (e.key === 'Escape') {
      setEditingProjectTitle(false);
    }
  };

  const handleChapterTitleDoubleClick = (chapter) => {
    setEditingChapterId(chapter.id);
    setTempChapterTitle(chapter.title);
  };

  const handleChapterTitleChange = (e) => {
    setTempChapterTitle(e.target.value);
  };

  const handleChapterTitleSave = async (chapterId) => {
    if (!activeProject || !tempChapterTitle.trim()) {
      setEditingChapterId(null);
      return;
    }

    try {
      await chaptersAPI.update(activeProject.id, chapterId, { title: tempChapterTitle.trim() });
      await loadProject(activeProject);
      setEditingChapterId(null);
    } catch (error) {
      console.error('Error updating chapter title:', error);
    }
  };

  const handleChapterTitleKeyDown = (e, chapterId) => {
    if (e.key === 'Enter') {
      handleChapterTitleSave(chapterId);
    } else if (e.key === 'Escape') {
      setEditingChapterId(null);
    }
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
        onSelectProject={loadProject}
        onNewProject={() => setShowProjectModal(true)}
      />

      <div className="main-content">
        <div className="user-bar">
          <span>Welcome, {user.full_name}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        {activeProject && activeChapter ? (
          <>
            <div className="editor-header">
              {editingProjectTitle ? (
                <input
                  type="text"
                  value={tempProjectTitle}
                  onChange={handleProjectTitleChange}
                  onBlur={handleProjectTitleSave}
                  onKeyDown={handleProjectTitleKeyDown}
                  autoFocus
                  className="project-title-input"
                />
              ) : (
                <h2
                  onDoubleClick={handleProjectTitleDoubleClick}
                  title="Double-click to edit"
                  style={{ cursor: 'pointer' }}
                >
                  {activeProject.title}
                </h2>
              )}
              <div className="editor-controls">
                <button onClick={() => setShowChapterModal(true)}>
                  + New Chapter
                </button>
                {activeProject.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    className={chapter.id === activeChapter.id ? 'primary' : ''}
                    onClick={() => handleSelectChapter(chapter)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleChapterTitleDoubleClick(chapter);
                    }}
                    title="Double-click to edit"
                  >
                    {editingChapterId === chapter.id ? (
                      <input
                        type="text"
                        value={tempChapterTitle}
                        onChange={handleChapterTitleChange}
                        onBlur={() => handleChapterTitleSave(chapter.id)}
                        onKeyDown={(e) => handleChapterTitleKeyDown(e, chapter.id)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="chapter-title-input"
                      />
                    ) : (
                      chapter.title
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Editor chapter={activeChapter} onUpdate={handleUpdateChapter} />
          </>
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
