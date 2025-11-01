import { useState, useEffect } from 'react';

export default function ChapterModal({ isOpen, onClose, onSubmit, chapter = null }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || '');
    } else {
      setTitle('');
    }
  }, [chapter, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title });
    setTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{chapter ? 'Edit Chapter' : 'New Chapter'}</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chapter title"
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              {chapter ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
