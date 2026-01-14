/**
 * Custom hook for AI text improvement functionality.
 *
 * Manages state and logic for improving selected text
 * using AI-powered suggestions.
 */

import { useState } from 'react';
import { aiAPI } from '../services/api';

export default function useImprovement() {
  const [selectedText, setSelectedText] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [instruction, setInstruction] = useState(
    'Perbaiki teks berikut agar lebih jelas dan mudah dimengerti.'
  );
  const [writingStyle, setWritingStyle] = useState('puitis');
  const [improvedText, setImprovedText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectionChange = (text) => {
    setSelectedText(text);

    if (text.trim().length > 0) {
      setShowPanel(true);
    } else {
      setShowPanel(false);
      setImprovedText(null);
      setError(null);
    }
  };

  const requestImprovement = async (selectedModel) => {
    if (!selectedText || selectedText.trim().length === 0) {
      setError('Please select some text to improve.');
      return;
    }

    setLoading(true);
    setError(null);
    setImprovedText(null);

    try {
      const response = await aiAPI.improve(selectedText, instruction, {
        writingStyle,
        model: selectedModel
      });
      setImprovedText(response.data.improved_text);
    } catch (err) {
      console.error('Error improving text:', err);
      setError(err.response?.data?.detail || 'Failed to improve text');
    } finally {
      setLoading(false);
    }
  };

  const applyImprovement = (editor) => {
    if (!editor || !improvedText) return;

    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, improvedText).run();

    // Clear state
    setImprovedText(null);
    setShowPanel(false);
    setSelectedText('');
  };

  const dismissImprovement = () => {
    setImprovedText(null);
    setError(null);
  };

  return {
    // State
    selectedText,
    showPanel,
    instruction,
    writingStyle,
    improvedText,
    loading,
    error,

    // Setters
    setInstruction,
    setWritingStyle,

    // Actions
    handleSelectionChange,
    requestImprovement,
    applyImprovement,
    dismissImprovement,
  };
}
