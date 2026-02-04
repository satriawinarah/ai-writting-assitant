import { useState, useEffect, useRef, useCallback } from 'react';
import './ProjectTree.css';

export default function ProjectTree({
  projects,
  activeProject,
  activeChapter,
  onSelectProject,
  onSelectChapter,
  onNewChapter,
  onDeleteProject,
  onDeleteChapter,
  onRenameProject,
  onRenameChapter,
}) {
  const [expandedProjects, setExpandedProjects] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const contextMenuRef = useRef(null);

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('expandedProjects');
    if (saved) {
      try {
        setExpandedProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading expanded projects:', e);
      }
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('expandedProjects', JSON.stringify(expandedProjects));
  }, [expandedProjects]);

  // Memoized click outside handler to prevent memory leaks
  const handleClickOutside = useCallback((event) => {
    if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
      setContextMenu(null);
    }
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu, handleClickOutside]);

  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleProjectClick = (project) => {
    // Expand/collapse the project
    toggleProject(project.id);

    // Load the project if not already loaded
    if (!activeProject || activeProject.id !== project.id) {
      onSelectProject(project);
    }
  };

  const handleChapterClick = (e, chapter) => {
    e.stopPropagation();
    onSelectChapter(chapter);
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    });
  };

  const handleRename = () => {
    if (contextMenu) {
      setEditingItem({ ...contextMenu.item, type: contextMenu.type });
      setEditingTitle(contextMenu.item.title);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      const confirmMsg =
        contextMenu.type === 'project'
          ? `Are you sure you want to delete "${contextMenu.item.title}"? This will delete all chapters in this project.`
          : `Are you sure you want to delete "${contextMenu.item.title}"?`;

      if (window.confirm(confirmMsg)) {
        if (contextMenu.type === 'project') {
          onDeleteProject(contextMenu.item.id);
        } else {
          onDeleteChapter(contextMenu.item.id);
        }
      }
      setContextMenu(null);
    }
  };

  const handleTitleChange = (e) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (!editingItem || !editingTitle.trim()) {
      setEditingItem(null);
      return;
    }

    if (editingItem.type === 'project') {
      onRenameProject(editingItem.id, editingTitle.trim());
    } else {
      onRenameChapter(editingItem.id, editingTitle.trim());
    }
    setEditingItem(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditingItem(null);
    }
  };

  const handleNewChapter = (e, projectId) => {
    e.stopPropagation();
    // Make sure the project is expanded and loaded
    if (!expandedProjects[projectId]) {
      toggleProject(projectId);
    }
    const project = projects.find((p) => p.id === projectId);
    if (project && (!activeProject || activeProject.id !== projectId)) {
      onSelectProject(project);
    }
    onNewChapter();
  };

  // Get chapters for a project (from activeProject if it's the same project)
  const getProjectChapters = (project) => {
    if (activeProject && activeProject.id === project.id) {
      return activeProject.chapters || [];
    }
    return [];
  };

  return (
    <div className="project-tree">
      {projects.length === 0 ? (
        <div className="tree-empty">No projects yet. Create one to get started!</div>
      ) : (
        <ul className="tree-list">
          {projects.map((project) => {
            const isExpanded = expandedProjects[project.id];
            const chapters = getProjectChapters(project);
            const isActive = activeProject?.id === project.id;

            return (
              <li key={project.id} className="tree-project">
                <div
                  className={`tree-item project-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleProjectClick(project)}
                  onContextMenu={(e) => handleContextMenu(e, project, 'project')}
                >
                  <span className="tree-icon">{isExpanded ? '📂' : '📁'}</span>
                  {editingItem?.id === project.id && editingItem?.type === 'project' ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={handleTitleChange}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="tree-input"
                    />
                  ) : (
                    <>
                      <span className="tree-label">{project.title}</span>
                      <span className="tree-meta">
                        {project.chapter_count} {project.chapter_count === 1 ? 'chapter' : 'chapters'}
                      </span>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="tree-children">
                    <ul className="chapter-list">
                      {chapters.map((chapter) => (
                        <li key={chapter.id} className="tree-chapter">
                          <div
                            className={`tree-item chapter-item ${
                              activeChapter?.id === chapter.id ? 'active' : ''
                            }`}
                            onClick={(e) => handleChapterClick(e, chapter)}
                            onContextMenu={(e) => handleContextMenu(e, chapter, 'chapter')}
                          >
                            <span className="tree-icon">📄</span>
                            {editingItem?.id === chapter.id && editingItem?.type === 'chapter' ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={handleTitleChange}
                                onBlur={handleTitleSave}
                                onKeyDown={handleTitleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="tree-input"
                              />
                            ) : (
                              <span className="tree-label">{chapter.title}</span>
                            )}
                          </div>
                        </li>
                      ))}
                      <li className="tree-chapter">
                        <button
                          className="new-chapter-btn"
                          onClick={(e) => handleNewChapter(e, project.id)}
                        >
                          + New Chapter
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <button onClick={handleRename}>Rename</button>
          <button onClick={handleDelete} className="danger">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
