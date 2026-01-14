/**
 * Custom hook for AI title suggestion functionality.
 *
 * Manages state and logic for generating title suggestions
 * based on story content.
 */

import { useState } from 'react';
import { aiAPI } from '../services/api';

export default function useTitleSuggestion() {
  const [titleStyle, setTitleStyle] = useState('click_bait');
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestTitles = async (content, selectedModel) => {
    if (!content || content.trim().length < 100) {
      setError('Please write at least 100 characters before generating title suggestions.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await aiAPI.suggestTitle(content, {
        titleStyle,
        model: selectedModel
      });
      setSuggestions(response.data.titles);
    } catch (err) {
      console.error('Error generating title suggestions:', err);
      setError(err.response?.data?.detail || 'Failed to generate title suggestions');
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestions = () => {
    setSuggestions(null);
    setError(null);
  };

  return {
    // State
    titleStyle,
    suggestions,
    loading,
    error,

    // Setters
    setTitleStyle,

    // Actions
    suggestTitles,
    dismissSuggestions,
  };
}
