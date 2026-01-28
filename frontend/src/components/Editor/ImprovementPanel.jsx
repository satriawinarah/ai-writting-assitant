/**
 * ImprovementPanel - AI-powered text improvement panel component.
 *
 * Allows users to select text and request AI-powered improvements
 * with customizable writing style and instructions.
 */

import { WRITING_STYLES } from '../../constants/styles';

export default function ImprovementPanel({
  showPanel,
  selectedText,
  improvedText,
  instruction,
  writingStyle,
  loading,
  error,
  onSetWritingStyle,
  onSetInstruction,
  onRequestImprovement,
  onApplyImprovement,
  onDismiss,
}) {
  if (!showPanel) return null;

  return (
    <div className="improvement-panel">
      <h4>Improve Selected Text</h4>
      <div className="selected-text-preview">
        <strong>Selected:</strong> {selectedText.substring(0, 100)}
        {selectedText.length > 100 && '...'}
      </div>

      <div className="control-group">
        <label htmlFor="improvementWritingStyle">Writing Style:</label>
        <select
          id="improvementWritingStyle"
          value={writingStyle}
          onChange={(e) => onSetWritingStyle(e.target.value)}
          className="style-select"
        >
          {WRITING_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="improvementInstruction">Instruction:</label>
        <textarea
          id="improvementInstruction"
          value={instruction}
          onChange={(e) => onSetInstruction(e.target.value)}
          className="instruction-input"
          rows="3"
          placeholder="E.g., Make it more formal, fix grammar, enhance clarity..."
        />
      </div>

      <button
        className="improve-btn"
        onClick={onRequestImprovement}
        disabled={loading}
      >
        {loading ? 'Improving...' : 'Request Improvement'}
      </button>

      {loading && (
        <div className="loading">Improving text...</div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {improvedText && !loading && (
        <div className="improvement-result">
          <div className="improved-text">
            <strong>Improved:</strong> {improvedText}
          </div>
          <div className="improvement-actions">
            <button className="accept" onClick={onApplyImprovement}>
              Replace
            </button>
            <button onClick={onRequestImprovement}>
              Regenerate
            </button>
            <button onClick={onDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
