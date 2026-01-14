/**
 * Main application component for DiksiAI.
 *
 * Manages authentication flow and application layout using
 * custom hooks for auth and project management.
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Settings from './components/Settings';
import ProjectModal from './components/ProjectModal';
import ChapterModal from './components/ChapterModal';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import { useAuth, useProjects } from './hooks';

export default function App() {
  // Custom hooks for auth and project management
  const auth = useAuth();
  const projectManager = useProjects(auth.isAuthenticated);

  // UI state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [currentView, setCurrentView] = useState('editor');

  // Event handlers
  const handleCreateProject = async (data) => {
    await projectManager.createProject(data);
    setShowProjectModal(false);
  };

  const handleCreateChapter = async (data) => {
    await projectManager.createChapter(data);
    setShowChapterModal(false);
  };

  // Show loading screen while checking auth
  if (auth.loading) {
    return (
      <div className="loading-screen">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Show landing/login/register if not authenticated
  if (!auth.isAuthenticated) {
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

  // Show main app if authenticated
  const renderMainContent = () => {
    if (currentView === 'settings') {
      return <Settings />;
    }

    if (projectManager.activeProject && projectManager.activeChapter) {
      return (
        <Editor
          chapter={projectManager.activeChapter}
          onUpdate={projectManager.updateChapterContent}
        />
      );
    }

    if (projectManager.activeProject) {
      return (
        <div className="empty-state">
          <h2>{projectManager.activeProject.title}</h2>
          <p>Select or create a chapter to start writing</p>
        </div>
      );
    }

    return (
      <div className="empty-state">
        <h2>Welcome to DiksiAI</h2>
        <p>Create a new project to start writing</p>
      </div>
    );
  };

  return (
    <div className="app">
      <Sidebar
        projects={projectManager.projects}
        activeProject={projectManager.activeProject}
        activeChapter={projectManager.activeChapter}
        currentView={currentView}
        onSelectProject={projectManager.loadProject}
        onSelectChapter={projectManager.selectChapter}
        onNewProject={() => setShowProjectModal(true)}
        onNewChapter={() => setShowChapterModal(true)}
        onViewSettings={() => setCurrentView('settings')}
        onViewEditor={() => setCurrentView('editor')}
        onDeleteProject={projectManager.deleteProject}
        onDeleteChapter={projectManager.deleteChapter}
        onRenameProject={projectManager.renameProject}
        onRenameChapter={projectManager.renameChapter}
      />

      <div className="main-content">
        <div className="user-bar">
          <span>Welcome, {auth.user?.full_name || 'User'}</span>
          <button onClick={auth.logout} className="logout-button">
            Logout
          </button>
        </div>

        {renderMainContent()}
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
