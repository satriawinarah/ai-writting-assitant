/**
 * TitleSuggestionPanel - AI-powered title suggestion panel component.
 *
 * Generates title suggestions based on the content with
 * customizable title styles.
 */

import { TITLE_STYLES } from '../../constants/styles';

export default function TitleSuggestionPanel({
  titleStyle,
  suggestions,
  loading,
  error,
  onSetTitleStyle,
  onSuggestTitles,
  onDismiss,
}) {
  return (
    <div className="title-suggestion-panel">
      <h4>Title Suggestions</h4>

      <div className="control-group">
        <label htmlFor="titleStyle">Title Style:</label>
        <select
          id="titleStyle"
          value={titleStyle}
          onChange={(e) => onSetTitleStyle(e.target.value)}
          className="style-select"
        >
          {TITLE_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label} - {style.description}
            </option>
          ))}
        </select>
      </div>

      <button
        className="generate-btn"
        onClick={onSuggestTitles}
        disabled={loading}
      >
        {loading ? 'Generating Titles...' : 'Suggest Titles'}
      </button>

      {loading && (
        <div className="loading">Generating title suggestions...</div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {suggestions && !loading && (
        <div className="title-suggestions-result">
          <div className="titles-list">
            <strong>Suggested Titles:</strong>
            <ul>
              {suggestions.map((title, index) => (
                <li key={index}>{title}</li>
              ))}
            </ul>
          </div>
          <div className="title-actions">
            <button onClick={onSuggestTitles}>
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
