/**
 * Modal - Generic modal component for dialogs.
 *
 * Provides a reusable modal structure with customizable content,
 * reducing duplication across ProjectModal and ChapterModal.
 */

import { useEffect, useCallback } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  // Close on Escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {title && <h2 id="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/**
 * ModalForm - Form wrapper for modal content
 */
export function ModalForm({ onSubmit, children }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

/**
 * ModalField - Form field wrapper for consistent styling
 */
export function ModalField({ label, htmlFor, required, children }) {
  return (
    <div className="modal-field">
      <label htmlFor={htmlFor}>
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

/**
 * ModalActions - Action buttons wrapper for modal
 */
export function ModalActions({ children }) {
  return <div className="modal-actions">{children}</div>;
}
