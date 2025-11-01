import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ProjectModal from './components/ProjectModal';
import ChapterModal from './components/ChapterModal';
import { projectsAPI, chaptersAPI } from './services/api';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

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

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={loadProject}
        onNewProject={() => setShowProjectModal(true)}
      />

      <div className="main-content">
        {activeProject && activeChapter ? (
          <>
            <div className="editor-header">
              <h2>{activeProject.title}</h2>
              <div className="editor-controls">
                <button onClick={() => setShowChapterModal(true)}>
                  + New Chapter
                </button>
                {activeProject.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    className={chapter.id === activeChapter.id ? 'primary' : ''}
                    onClick={() => handleSelectChapter(chapter)}
                  >
                    {chapter.title}
                  </button>
                ))}
              </div>
            </div>

            <Editor chapter={activeChapter} onUpdate={handleUpdateChapter} />
          </>
        ) : (
          <div className="empty-state">
            <h2>Welcome to Author's Cursor</h2>
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
