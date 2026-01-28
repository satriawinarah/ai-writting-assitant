/**
 * ProjectModal - Modal for creating/editing projects.
 *
 * Uses the generic Modal component for consistent structure.
 */

import { useState, useEffect } from 'react';
import Modal, { ModalForm, ModalField, ModalActions } from './Modal';

export default function ProjectModal({ isOpen, onClose, onSubmit, project = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [project, isOpen]);

  const handleSubmit = () => {
    onSubmit({ title, description });
    setTitle('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'New Project'}
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField label="Title" htmlFor="project-title" required>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            required
            autoFocus
          />
        </ModalField>

        <ModalField label="Description" htmlFor="project-description">
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project description (optional)"
          />
        </ModalField>

        <ModalActions>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {project ? 'Update' : 'Create'}
          </button>
        </ModalActions>
      </ModalForm>
    </Modal>
  );
}
