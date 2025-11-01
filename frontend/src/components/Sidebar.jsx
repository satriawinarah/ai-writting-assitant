export default function Sidebar({ projects, activeProject, onSelectProject, onNewProject }) {
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
        <ul className="project-list">
          {projects.map((project) => (
            <li
              key={project.id}
              className={`project-item ${activeProject?.id === project.id ? 'active' : ''}`}
              onClick={() => onSelectProject(project)}
            >
              <h3>{project.title}</h3>
              <p>
                {project.chapter_count} chapter{project.chapter_count !== 1 ? 's' : ''}
                {' • '}
                {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </li>
          ))}

          {projects.length === 0 && (
            <div style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No projects yet. Create one to get started!
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
