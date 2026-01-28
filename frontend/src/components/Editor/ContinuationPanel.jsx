/**
 * ContinuationPanel - AI-powered text continuation panel component.
 *
 * Generates text continuations based on the current content with
 * customizable writing style, paragraph count, and optional brief idea.
 */

import { WRITING_STYLES } from '../../constants/styles';

export default function ContinuationPanel({
  suggestion,
  writingStyle,
  paragraphCount,
  briefIdea,
  loading,
  error,
  onSetWritingStyle,
  onSetParagraphCount,
  onSetBriefIdea,
  onGenerate,
  onAccept,
  onRegenerate,
  onDismiss,
}) {
  return (
    <>
      <div className="suggestion-controls">
        <div className="control-group">
          <label htmlFor="writingStyle">Writing Style:</label>
          <select
            id="writingStyle"
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
          <label htmlFor="paragraphCount">Number of Paragraphs:</label>
          <select
            id="paragraphCount"
            value={paragraphCount}
            onChange={(e) => onSetParagraphCount(parseInt(e.target.value, 10))}
            className="style-select"
          >
            <option value="1">1 paragraph</option>
            <option value="2">2 paragraphs</option>
            <option value="3">3 paragraphs</option>
            <option value="4">4 paragraphs</option>
            <option value="5">5 paragraphs</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="briefIdea">Brief Idea (Optional):</label>
          <textarea
            id="briefIdea"
            value={briefIdea}
            onChange={(e) => onSetBriefIdea(e.target.value)}
            className="brief-idea-input"
            rows="2"
            placeholder="E.g., The character discovers a hidden door..."
          />
        </div>

        <button
          className="generate-btn"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Suggestion'}
        </button>
      </div>

      {loading && (
        <div className="loading">Generating suggestion...</div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {suggestion && !loading && (
        <div className="suggestion-card">
          <div className="suggestion-text">
            {suggestion}
          </div>
          <div className="suggestion-actions">
            <button className="accept" onClick={onAccept}>
              Accept
            </button>
            <button onClick={onRegenerate}>
              Regenerate
            </button>
            <button onClick={onDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!suggestion && !loading && !error && (
        <div className="loading">
          Click "Generate Suggestion" to get AI suggestions...
        </div>
      )}
    </>
  );
}
