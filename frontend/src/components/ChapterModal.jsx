/**
 * ChapterModal - Modal for creating/editing chapters.
 *
 * Uses the generic Modal component for consistent structure.
 */

import { useState, useEffect } from 'react';
import Modal, { ModalForm, ModalField, ModalActions } from './Modal';

export default function ChapterModal({ isOpen, onClose, onSubmit, chapter = null }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || '');
    } else {
      setTitle('');
    }
  }, [chapter, isOpen]);

  const handleSubmit = () => {
    onSubmit({ title });
    setTitle('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chapter ? 'Edit Chapter' : 'New Chapter'}
    >
      <ModalForm onSubmit={handleSubmit}>
        <ModalField label="Title" htmlFor="chapter-title" required>
          <input
            id="chapter-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title"
            required
            autoFocus
          />
        </ModalField>

        <ModalActions>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            {chapter ? 'Update' : 'Create'}
          </button>
        </ModalActions>
      </ModalForm>
    </Modal>
  );
}
