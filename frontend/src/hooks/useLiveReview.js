/**
 * Custom hook for AI live review functionality.
 *
 * Manages state and logic for real-time text analysis
 * and issue highlighting in the editor.
 */

import { useState, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { setLiveReviewIssues, clearLiveReviewIssues } from '../extensions/LiveReviewExtension';

export default function useLiveReview() {
  const [enabled, setEnabled] = useState(false);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleIssueClick = useCallback((issue, event, issueIndex) => {
    setActiveTooltip({ issue, index: issueIndex });
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY + 10,
    });
  }, []);

  const closeTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const runReview = async (editor, selectedModel) => {
    if (!editor) return;

    const text = editor.getText();
    if (!text || text.trim().length < 50) {
      setError('Tulis minimal 50 karakter sebelum menjalankan review.');
      return;
    }

    setLoading(true);
    setError(null);
    setStale(false);
    setActiveTooltip(null);

    try {
      const response = await aiAPI.liveReview(text, {
        model: selectedModel
      });

      const newIssues = response.data.issues || [];
      setIssues(newIssues);

      // Update decorations in the editor
      setLiveReviewIssues(editor, newIssues);

      if (newIssues.length === 0) {
        setError('Tidak ada masalah ditemukan. Teks Anda sudah baik!');
      }
    } catch (err) {
      console.error('Error running live review:', err);
      setError(err.response?.data?.detail || 'Gagal menjalankan review');
      setIssues([]);
      clearLiveReviewIssues(editor);
    } finally {
      setLoading(false);
    }
  };

  const applyIssueFix = (editor, issue) => {
    if (!editor || !issue) return;

    const text = editor.getText();
    const startOffset = text.indexOf(issue.original_text);

    if (startOffset === -1) {
      setError('Tidak dapat menemukan teks yang akan diperbaiki.');
      return;
    }

    // Convert text offset to ProseMirror position
    let currentOffset = 0;
    let from = null;
    let to = null;

    editor.state.doc.descendants((node, pos) => {
      if (from !== null && to !== null) return false;

      if (node.isText) {
        const textLength = node.text.length;
        if (from === null && currentOffset + textLength > startOffset) {
          from = pos + (startOffset - currentOffset);
        }
        if (from !== null && to === null && currentOffset + textLength >= startOffset + issue.original_text.length) {
          to = pos + (startOffset + issue.original_text.length - currentOffset);
        }
        currentOffset += textLength;
      }
      return true;
    });

    if (from !== null && to !== null) {
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, issue.suggestion).run();

      // Remove this issue from the list
      const newIssues = issues.filter((i) => i !== issue);
      setIssues(newIssues);

      // Clear all decorations since positions changed
      clearLiveReviewIssues(editor);

      // Mark as stale if there are remaining issues
      if (newIssues.length > 0) {
        setStale(true);
      }
    }

    setActiveTooltip(null);
  };

  const dismissIssue = (editor, issue) => {
    const issueIndex = issues.findIndex((i) => i === issue);
    if (issueIndex === -1) return;

    const newIssues = issues.filter((_, idx) => idx !== issueIndex);
    setIssues(newIssues);

    // Update decorations
    setLiveReviewIssues(editor, newIssues);

    setActiveTooltip(null);
  };

  const toggle = (editor) => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    if (!newEnabled && editor) {
      // Clear everything when disabling
      setIssues([]);
      setError(null);
      setStale(false);
      setActiveTooltip(null);
      clearLiveReviewIssues(editor);
    }
  };

  const clearReview = (editor) => {
    setIssues([]);
    setError(null);
    setStale(false);
    setActiveTooltip(null);
    if (editor) {
      clearLiveReviewIssues(editor);
    }
  };

  const markAsStale = (editor) => {
    if (issues.length > 0) {
      setStale(true);
      if (editor) {
        clearLiveReviewIssues(editor);
      }
    }
  };

  return {
    // State
    enabled,
    issues,
    loading,
    error,
    stale,
    activeTooltip,
    tooltipPosition,

    // Actions
    handleIssueClick,
    closeTooltip,
    runReview,
    applyIssueFix,
    dismissIssue,
    toggle,
    clearReview,
    markAsStale,
  };
}
