/**
 * Custom hook for AI text continuation functionality.
 *
 * Manages state and logic for generating AI-powered text continuations
 * based on the current editor content.
 */

import { useState } from 'react';
import { aiAPI } from '../services/api';

export default function useContinuation() {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [writingStyle, setWritingStyle] = useState('puitis');
  const [paragraphCount, setParagraphCount] = useState(1);
  const [briefIdea, setBriefIdea] = useState('');

  const generateSuggestion = async (text, selectedModel) => {
    if (!text || text.trim().length < 50) {
      setError('Please write at least 50 characters before generating suggestions.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await aiAPI.continue(text, {
        writingStyle,
        paragraphCount,
        briefIdea: briefIdea.trim() || undefined,
        model: selectedModel
      });
      setSuggestion(response.data.continuation);
    } catch (err) {
      console.error('Error generating suggestion:', err);
      setError(err.response?.data?.detail || 'Failed to generate suggestion');
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = (editor) => {
    if (editor && suggestion) {
      const currentContent = editor.getText();
      const lastChar = currentContent.slice(-1);
      const prefix = lastChar === ' ' || lastChar === '\n' ? '' : ' ';
      editor.commands.insertContent(prefix + suggestion);
      setSuggestion(null);
    }
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
  };

  const regenerateSuggestion = (text, selectedModel) => {
    generateSuggestion(text, selectedModel);
  };

  return {
    // State
    suggestion,
    loading,
    error,
    writingStyle,
    paragraphCount,
    briefIdea,

    // Setters
    setWritingStyle,
    setParagraphCount,
    setBriefIdea,

    // Actions
    generateSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    regenerateSuggestion,
  };
}
