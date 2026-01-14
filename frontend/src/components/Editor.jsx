/**
 * Rich text editor component with AI-powered writing assistance.
 *
 * Uses TipTap for rich text editing and custom hooks for AI features:
 * - Text continuation
 * - Text improvement
 * - Title suggestions
 * - Live review
 */

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Footer from './Footer';
import ReviewTooltip from './ReviewTooltip';
import { LiveReviewExtension } from '../extensions/LiveReviewExtension';
import { useContinuation, useImprovement, useTitleSuggestion, useLiveReview } from '../hooks';
import { WRITING_STYLES, TITLE_STYLES, AVAILABLE_MODELS, DEFAULT_MODEL } from '../constants/styles';

export default function Editor({ chapter, onUpdate }) {
  // Model selection
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

  // Custom hooks for AI features
  const continuation = useContinuation();
  const improvement = useImprovement();
  const titleSuggestion = useTitleSuggestion();
  const liveReview = useLiveReview();

  // TipTap Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
      LiveReviewExtension.configure({
        issues: [],
        onIssueClick: liveReview.handleIssueClick,
      }),
    ],
    content: chapter?.content || '',
    onUpdate: ({ editor: ed }) => {
      const content = ed.getHTML();

      if (onUpdate) {
        onUpdate(content);
      }

      // Mark review as stale if there are issues and content changed
      liveReview.markAsStale(ed);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      const text = ed.state.doc.textBetween(from, to, ' ');
      improvement.handleSelectionChange(text);
    },
  });

  // Update editor content when chapter changes
  useEffect(() => {
    if (editor && chapter?.content !== editor.getHTML()) {
      editor.commands.setContent(chapter?.content || '');
    }
  }, [chapter?.id]);

  // Event handlers that wrap hook methods with editor context
  const handleGenerateSuggestion = () => {
    if (editor) {
      continuation.generateSuggestion(editor.getText(), selectedModel);
    }
  };

  const handleAcceptSuggestion = () => {
    continuation.acceptSuggestion(editor);
  };

  const handleRegenerateSuggestion = () => {
    if (editor) {
      continuation.regenerateSuggestion(editor.getText(), selectedModel);
    }
  };

  const handleRequestImprovement = () => {
    improvement.requestImprovement(selectedModel);
  };

  const handleApplyImprovement = () => {
    improvement.applyImprovement(editor);
  };

  const handleSuggestTitle = () => {
    if (editor) {
      titleSuggestion.suggestTitles(editor.getText(), selectedModel);
    }
  };

  const handleRunReview = () => {
    liveReview.runReview(editor, selectedModel);
  };

  const handleApplyIssueFix = (issue) => {
    liveReview.applyIssueFix(editor, issue);
  };

  const handleDismissIssue = (issue) => {
    liveReview.dismissIssue(editor, issue);
  };

  const handleToggleLiveReview = () => {
    liveReview.toggle(editor);
  };

  const handleClearReview = () => {
    liveReview.clearReview(editor);
  };

  return (
    <div className="editor-container">
      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>

      <div className="suggestion-sidebar">
        <h3>AI Suggestions</h3>

        {/* Live Review Panel */}
        <div className="live-review-panel">
          <div className="live-review-header">
            <h4>Live Review</h4>
            <button
              className={`live-review-toggle ${liveReview.enabled ? 'active' : ''}`}
              onClick={handleToggleLiveReview}
            >
              {liveReview.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {liveReview.enabled && (
            <div className="live-review-content">
              <p className="live-review-description">
                Analisis teks untuk menemukan area yang perlu diperbaiki.
                Masalah akan di-highlight langsung di editor.
              </p>

              <button
                className="review-btn"
                onClick={handleRunReview}
                disabled={liveReview.loading}
              >
                {liveReview.loading ? 'Menganalisis...' : 'Jalankan Review'}
              </button>

              {liveReview.issues.length > 0 && (
                <div className="review-status">
                  <span className="issue-count">
                    {liveReview.issues.length} masalah ditemukan
                  </span>
                  {liveReview.stale && (
                    <span className="stale-warning">
                      (hasil sudah tidak valid, jalankan ulang review)
                    </span>
                  )}
                  <button className="clear-review-btn" onClick={handleClearReview}>
                    Hapus
                  </button>
                </div>
              )}

              {liveReview.error && (
                <div className={liveReview.issues.length === 0 && !liveReview.error.includes('Gagal') ? 'success' : 'error'}>
                  {liveReview.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Improvement Panel */}
        {improvement.showPanel && (
          <div className="improvement-panel">
            <h4>Improve Selected Text</h4>
            <div className="selected-text-preview">
              <strong>Selected:</strong> {improvement.selectedText.substring(0, 100)}
              {improvement.selectedText.length > 100 && '...'}
            </div>

            <div className="control-group">
              <label htmlFor="improvementWritingStyle">Writing Style:</label>
              <select
                id="improvementWritingStyle"
                value={improvement.writingStyle}
                onChange={(e) => improvement.setWritingStyle(e.target.value)}
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
                value={improvement.instruction}
                onChange={(e) => improvement.setInstruction(e.target.value)}
                className="instruction-input"
                rows="3"
                placeholder="E.g., Make it more formal, fix grammar, enhance clarity..."
              />
            </div>

            <button
              className="improve-btn"
              onClick={handleRequestImprovement}
              disabled={improvement.loading}
            >
              {improvement.loading ? 'Improving...' : 'Request Improvement'}
            </button>

            {improvement.loading && (
              <div className="loading">Improving text...</div>
            )}

            {improvement.error && (
              <div className="error">{improvement.error}</div>
            )}

            {improvement.improvedText && !improvement.loading && (
              <div className="improvement-result">
                <div className="improved-text">
                  <strong>Improved:</strong> {improvement.improvedText}
                </div>
                <div className="improvement-actions">
                  <button className="accept" onClick={handleApplyImprovement}>
                    Replace
                  </button>
                  <button onClick={handleRequestImprovement}>
                    Regenerate
                  </button>
                  <button onClick={improvement.dismissImprovement}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title Suggestion Panel */}
        <div className="title-suggestion-panel">
          <h4>Title Suggestions</h4>

          <div className="control-group">
            <label htmlFor="titleStyle">Title Style:</label>
            <select
              id="titleStyle"
              value={titleSuggestion.titleStyle}
              onChange={(e) => titleSuggestion.setTitleStyle(e.target.value)}
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
            onClick={handleSuggestTitle}
            disabled={titleSuggestion.loading}
          >
            {titleSuggestion.loading ? 'Generating Titles...' : 'Suggest Titles'}
          </button>

          {titleSuggestion.loading && (
            <div className="loading">Generating title suggestions...</div>
          )}

          {titleSuggestion.error && (
            <div className="error">{titleSuggestion.error}</div>
          )}

          {titleSuggestion.suggestions && !titleSuggestion.loading && (
            <div className="title-suggestions-result">
              <div className="titles-list">
                <strong>Suggested Titles:</strong>
                <ul>
                  {titleSuggestion.suggestions.map((title, index) => (
                    <li key={index}>{title}</li>
                  ))}
                </ul>
              </div>
              <div className="title-actions">
                <button onClick={handleSuggestTitle}>
                  Regenerate
                </button>
                <button onClick={titleSuggestion.dismissSuggestions}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Continuation Controls */}
        <div className="suggestion-controls">
          <div className="control-group">
            <label htmlFor="writingStyle">Writing Style:</label>
            <select
              id="writingStyle"
              value={continuation.writingStyle}
              onChange={(e) => continuation.setWritingStyle(e.target.value)}
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
              value={continuation.paragraphCount}
              onChange={(e) => continuation.setParagraphCount(parseInt(e.target.value, 10))}
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
              value={continuation.briefIdea}
              onChange={(e) => continuation.setBriefIdea(e.target.value)}
              className="brief-idea-input"
              rows="2"
              placeholder="E.g., The character discovers a hidden door..."
            />
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerateSuggestion}
            disabled={continuation.loading}
          >
            {continuation.loading ? 'Generating...' : 'Generate Suggestion'}
          </button>
        </div>

        {continuation.loading && (
          <div className="loading">Generating suggestion...</div>
        )}

        {continuation.error && (
          <div className="error">{continuation.error}</div>
        )}

        {continuation.suggestion && !continuation.loading && (
          <div className="suggestion-card">
            <div className="suggestion-text">
              {continuation.suggestion}
            </div>
            <div className="suggestion-actions">
              <button className="accept" onClick={handleAcceptSuggestion}>
                Accept
              </button>
              <button onClick={handleRegenerateSuggestion}>
                Regenerate
              </button>
              <button onClick={continuation.dismissSuggestion}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!continuation.suggestion && !continuation.loading && !continuation.error && (
          <div className="loading">
            Click "Generate Suggestion" to get AI suggestions...
          </div>
        )}
      </div>

      <Footer
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={AVAILABLE_MODELS}
      />

      {/* Live Review Tooltip */}
      {liveReview.activeTooltip && (
        <ReviewTooltip
          issue={liveReview.activeTooltip.issue}
          position={liveReview.tooltipPosition}
          onApply={handleApplyIssueFix}
          onDismiss={handleDismissIssue}
          onClose={liveReview.closeTooltip}
        />
      )}
    </div>
  );
}
