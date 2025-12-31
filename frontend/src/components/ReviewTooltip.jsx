import { useEffect, useRef } from 'react';

const ISSUE_TYPE_LABELS = {
  grammar: 'Tata Bahasa',
  clarity: 'Kejelasan',
  style: 'Gaya Bahasa',
  redundancy: 'Pengulangan',
  word_choice: 'Pilihan Kata',
};

export default function ReviewTooltip({
  issue,
  position,
  onApply,
  onDismiss,
  onClose,
}) {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!tooltipRef.current || !position) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();

    // Adjust position if tooltip goes off-screen
    let adjustedX = position.x;
    let adjustedY = position.y;

    // Check right edge
    if (adjustedX + rect.width > window.innerWidth - 20) {
      adjustedX = window.innerWidth - rect.width - 20;
    }

    // Check left edge
    if (adjustedX < 20) {
      adjustedX = 20;
    }

    // Check bottom edge - if it goes below, show above the click point
    if (adjustedY + rect.height > window.innerHeight - 20) {
      adjustedY = position.y - rect.height - 10;
    }

    tooltip.style.left = `${adjustedX}px`;
    tooltip.style.top = `${adjustedY}px`;
  }, [position]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        // Check if the click is not on a review highlight
        const target = event.target;
        const isReviewHighlight =
          target.classList?.contains('live-review-critical') ||
          target.classList?.contains('live-review-warning');

        if (!isReviewHighlight) {
          onClose();
        }
      }
    };

    // Close on Escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!issue || !position) return null;

  const issueTypeLabel = ISSUE_TYPE_LABELS[issue.issue_type] || issue.issue_type;

  return (
    <div
      ref={tooltipRef}
      className="review-tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="review-tooltip-header">
        <span className={`severity-badge ${issue.severity}`}>
          {issue.severity === 'critical' ? 'Kritis' : 'Saran'}
        </span>
        <span className="issue-type-badge">{issueTypeLabel}</span>
        <button className="tooltip-close-btn" onClick={onClose} aria-label="Tutup">
          &times;
        </button>
      </div>

      <div className="review-tooltip-content">
        <div className="original-text">
          <strong>Teks asli:</strong>
          <p>{issue.original_text}</p>
        </div>

        <div className="suggestion-text">
          <strong>Saran perbaikan:</strong>
          <p>{issue.suggestion}</p>
        </div>

        {issue.explanation && (
          <div className="explanation-text">
            <em>{issue.explanation}</em>
          </div>
        )}
      </div>

      <div className="review-tooltip-actions">
        <button className="apply-btn" onClick={() => onApply(issue)}>
          Terapkan
        </button>
        <button className="dismiss-btn" onClick={() => onDismiss(issue)}>
          Abaikan
        </button>
      </div>
    </div>
  );
}
