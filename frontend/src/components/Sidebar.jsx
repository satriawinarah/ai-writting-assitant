import ProjectTree from './ProjectTree';

export default function Sidebar({
  projects,
  activeProject,
  activeChapter,
  onSelectProject,
  onSelectChapter,
  onNewProject,
  onNewChapter,
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

      <div className="sidebar-content">
        <h3 style={{ fontSize: '12px', color: '#b0b0b0', marginBottom: '10px', textTransform: 'uppercase' }}>
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
