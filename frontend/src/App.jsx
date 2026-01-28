/**
 * Main application component for DiksiAI.
 *
 * Manages authentication flow and application layout using
 * custom hooks for auth and project management.
 */

import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Settings from './components/Settings';
import ProjectModal from './components/ProjectModal';
import ChapterModal from './components/ChapterModal';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import EditorErrorBoundary from './components/EditorErrorBoundary';
import NotificationContainer from './components/NotificationContainer';
import { useAuth, useProjects } from './hooks';
import { VIEWS } from './constants';

/**
 * Loading screen component displayed during auth check.
 */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <h2>Loading...</h2>
    </div>
  );
}

/**
 * User bar component with welcome message and logout button.
 */
function UserBar({ userName, onLogout }) {
  return (
    <div className="user-bar">
      <span>Welcome, {userName}</span>
      <button onClick={onLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

/**
 * Empty state component for when no project/chapter is selected.
 */
function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

/**
 * Main content area component.
 */
function MainContent({
  currentView,
  activeProject,
  activeChapter,
  onUpdateChapter,
}) {
  if (currentView === VIEWS.SETTINGS) {
    return (
      <ErrorBoundary>
        <Settings />
      </ErrorBoundary>
    );
  }

  if (activeProject && activeChapter) {
    return (
      <EditorErrorBoundary>
        <Editor chapter={activeChapter} onUpdate={onUpdateChapter} />
      </EditorErrorBoundary>
    );
  }

  if (activeProject) {
    return (
      <EmptyState
        title={activeProject.title}
        message="Select or create a chapter to start writing"
      />
    );
  }

  return (
    <EmptyState
      title="Welcome to DiksiAI"
      message="Create a new project to start writing"
    />
  );
}

/**
 * Authentication screens wrapper component.
 */
function AuthScreens({ auth }) {
  if (auth.showLanding) {
    return <LandingPage onGoToLogin={auth.goToLogin} />;
  }

  if (auth.showRegister) {
    return (
      <Register
        onRegister={auth.register}
        onSwitchToLogin={auth.goToLogin}
      />
    );
  }

  return (
    <Login
      onLogin={auth.login}
      onSwitchToRegister={auth.goToRegister}
    />
  );
}

export default function App() {
  const auth = useAuth();
  const projectManager = useProjects(auth.isAuthenticated);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [currentView, setCurrentView] = useState(VIEWS.EDITOR);

  const handleCreateProject = useCallback(async (data) => {
    await projectManager.createProject(data);
    setShowProjectModal(false);
  }, [projectManager]);

  const handleCreateChapter = useCallback(async (data) => {
    await projectManager.createChapter(data);
    setShowChapterModal(false);
  }, [projectManager]);

  const openProjectModal = useCallback(() => setShowProjectModal(true), []);
  const closeProjectModal = useCallback(() => setShowProjectModal(false), []);
  const openChapterModal = useCallback(() => setShowChapterModal(true), []);
  const closeChapterModal = useCallback(() => setShowChapterModal(false), []);
  const viewSettings = useCallback(() => setCurrentView(VIEWS.SETTINGS), []);
  const viewEditor = useCallback(() => setCurrentView(VIEWS.EDITOR), []);

  // Show loading screen while checking auth
  if (auth.loading) {
    return <LoadingScreen />;
  }

  // Show auth screens if not authenticated
  if (!auth.isAuthenticated) {
    return <AuthScreens auth={auth} />;
  }

  // Main authenticated app layout
  return (
    <div className="app">
      <NotificationContainer />

      <ErrorBoundary>
        <Sidebar
          projects={projectManager.projects}
          activeProject={projectManager.activeProject}
          activeChapter={projectManager.activeChapter}
          currentView={currentView}
          onSelectProject={projectManager.loadProject}
          onSelectChapter={projectManager.selectChapter}
          onNewProject={openProjectModal}
          onNewChapter={openChapterModal}
          onViewSettings={viewSettings}
          onViewEditor={viewEditor}
          onDeleteProject={projectManager.deleteProject}
          onDeleteChapter={projectManager.deleteChapter}
          onRenameProject={projectManager.renameProject}
          onRenameChapter={projectManager.renameChapter}
        />
      </ErrorBoundary>

      <div className="main-content">
        <UserBar
          userName={auth.user?.full_name || 'User'}
          onLogout={auth.logout}
        />

        <MainContent
          currentView={currentView}
          activeProject={projectManager.activeProject}
          activeChapter={projectManager.activeChapter}
          onUpdateChapter={projectManager.updateChapterContent}
        />
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={closeProjectModal}
        onSubmit={handleCreateProject}
      />

      <ChapterModal
        isOpen={showChapterModal}
        onClose={closeChapterModal}
        onSubmit={handleCreateChapter}
      />
    </div>
  );
}
