/**
 * Editor - Rich text editor with AI-powered writing assistance.
 *
 * Uses TipTap for rich text editing and custom hooks for AI features.
 * Sub-components handle individual AI feature panels for better maintainability.
 */

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Footer from '../Footer';
import ReviewTooltip from '../ReviewTooltip';
import LiveReviewPanel from './LiveReviewPanel';
import ImprovementPanel from './ImprovementPanel';
import TitleSuggestionPanel from './TitleSuggestionPanel';
import ContinuationPanel from './ContinuationPanel';
import { LiveReviewExtension } from '../../extensions/LiveReviewExtension';
import { useContinuation, useImprovement, useTitleSuggestion, useLiveReview } from '../../hooks';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '../../constants/styles';

export default function Editor({ chapter, onUpdate }) {
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

        <LiveReviewPanel
          enabled={liveReview.enabled}
          loading={liveReview.loading}
          issues={liveReview.issues}
          stale={liveReview.stale}
          error={liveReview.error}
          onToggle={handleToggleLiveReview}
          onRunReview={handleRunReview}
          onClearReview={handleClearReview}
        />

        <ImprovementPanel
          showPanel={improvement.showPanel}
          selectedText={improvement.selectedText}
          improvedText={improvement.improvedText}
          instruction={improvement.instruction}
          writingStyle={improvement.writingStyle}
          loading={improvement.loading}
          error={improvement.error}
          onSetWritingStyle={improvement.setWritingStyle}
          onSetInstruction={improvement.setInstruction}
          onRequestImprovement={handleRequestImprovement}
          onApplyImprovement={handleApplyImprovement}
          onDismiss={improvement.dismissImprovement}
        />

        <TitleSuggestionPanel
          titleStyle={titleSuggestion.titleStyle}
          suggestions={titleSuggestion.suggestions}
          loading={titleSuggestion.loading}
          error={titleSuggestion.error}
          onSetTitleStyle={titleSuggestion.setTitleStyle}
          onSuggestTitles={handleSuggestTitle}
          onDismiss={titleSuggestion.dismissSuggestions}
        />

        <ContinuationPanel
          suggestion={continuation.suggestion}
          writingStyle={continuation.writingStyle}
          paragraphCount={continuation.paragraphCount}
          briefIdea={continuation.briefIdea}
          loading={continuation.loading}
          error={continuation.error}
          onSetWritingStyle={continuation.setWritingStyle}
          onSetParagraphCount={continuation.setParagraphCount}
          onSetBriefIdea={continuation.setBriefIdea}
          onGenerate={handleGenerateSuggestion}
          onAccept={handleAcceptSuggestion}
          onRegenerate={handleRegenerateSuggestion}
          onDismiss={continuation.dismissSuggestion}
        />
      </div>

      <Footer
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={AVAILABLE_MODELS}
      />

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
