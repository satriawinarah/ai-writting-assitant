import ProjectTree from './ProjectTree';

export default function Sidebar({
  projects,
  activeProject,
  activeChapter,
  currentView,
  onSelectProject,
  onSelectChapter,
  onNewProject,
  onNewChapter,
  onViewSettings,
  onViewEditor,
  onDeleteProject,
  onDeleteChapter,
  onRenameProject,
  onRenameChapter,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>DiksiAI</h1>
        <button className="new-project-btn" onClick={onNewProject}>
          + New Project
        </button>
      </div>

      <div className="sidebar-navigation">
        <button
          className={`sidebar-nav-btn ${currentView === 'editor' ? 'active' : ''}`}
          onClick={onViewEditor}
        >
          <span className="nav-icon">📝</span>
          <span>Editor</span>
        </button>
        <button
          className={`sidebar-nav-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={onViewSettings}
        >
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      <div className="sidebar-content">
        <h3 className="sidebar-section-title">
          Projects
        </h3>
        <ProjectTree
          projects={projects}
          activeProject={activeProject}
          activeChapter={activeChapter}
          onSelectProject={onSelectProject}
          onSelectChapter={onSelectChapter}
          onNewChapter={onNewChapter}
          onDeleteProject={onDeleteProject}
          onDeleteChapter={onDeleteChapter}
          onRenameProject={onRenameProject}
          onRenameChapter={onRenameChapter}
        />
      </div>
    </div>
  );
}
