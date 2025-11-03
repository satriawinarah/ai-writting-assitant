import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { aiAPI } from '../services/api';
import Footer from './Footer';

export default function Editor({ chapter, onUpdate }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [writingStyle, setWritingStyle] = useState('puitis'); // Default writing style
  const [paragraphCount, setParagraphCount] = useState(1); // Number of paragraphs to generate
  const [briefIdea, setBriefIdea] = useState(''); // Optional brief idea for the continuation
  const [selectedText, setSelectedText] = useState('');
  const [showImprovementPanel, setShowImprovementPanel] = useState(false);
  const [improvementInstruction, setImprovementInstruction] = useState('Perbaiki teks berikut agar lebih jelas dan mudah dimengerti.');
  const [improvementWritingStyle, setImprovementWritingStyle] = useState('puitis'); // Separate writing style for improvement
  const [improvedText, setImprovedText] = useState(null);
  const [improvementLoading, setImprovementLoading] = useState(false);
  const [improvementError, setImprovementError] = useState(null);
  const [titleStyle, setTitleStyle] = useState('click_bait'); // Title style for suggestions
  const [titleSuggestions, setTitleSuggestions] = useState(null);
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleError, setTitleError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b'); // Default model

  // Available models definition
  const availableModels = [
    { value: 'openai/gpt-oss-120b', label: 'OpenAI GPT OSS 120B' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
  ];

  // Writing styles definition
  const writingStyles = [
    { value: 'puitis', label: 'Puitis & Mendalam' },
    { value: 'naratif', label: 'Naratif Langsung' },
    { value: 'melankolik', label: 'Melankolik' },
    { value: 'dramatis', label: 'Dramatis' },
    { value: 'deskriptif', label: 'Deskriptif Sensorik' },
    { value: 'filosofis', label: 'Filosofis' },
    { value: 'romantis', label: 'Romantis' },
    { value: 'realis', label: 'Realis Sosial' },
    { value: 'dialog', label: 'Dialog-Focused' },
  ];

  // Title styles definition
  const titleStyles = [
    {
      value: 'click_bait',
      label: 'Click Bait',
      description: 'Catchy, attention-grabbing titles with suspense or curiosity'
    },
    {
      value: 'philosophy',
      label: 'Philosophy',
      description: 'Deep, thought-provoking, philosophical titles'
    },
    {
      value: 'mystery',
      label: 'Mystery',
      description: 'Enigmatic, mysterious titles that hint at secrets'
    },
    {
      value: 'poetic',
      label: 'Poetic',
      description: 'Artistic, lyrical titles with metaphors'
    },
    {
      value: 'direct',
      label: 'Direct',
      description: 'Clear, straightforward titles that describe the content'
    },
    {
      value: 'dramatic',
      label: 'Dramatic',
      description: 'Intense, emotional, high-stakes titles'
    },
    {
      value: 'symbolic',
      label: 'Symbolic',
      description: 'Titles using symbolism and deeper meanings'
    },
    {
      value: 'literary',
      label: 'Literary',
      description: 'Classic, elegant literary-style titles'
    },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
    ],
    content: chapter?.content || '',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();

      // Save content
      if (onUpdate) {
        onUpdate(content);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);

      // Show improvement panel if text is selected
      if (text.trim().length > 0) {
        setShowImprovementPanel(true);
      } else {
        setShowImprovementPanel(false);
        setImprovedText(null);
        setImprovementError(null);
      }
    },
  });

  useEffect(() => {
    if (editor && chapter?.content !== editor.getHTML()) {
      editor.commands.setContent(chapter?.content || '');
    }
  }, [chapter?.id]);

  const generateSuggestion = async () => {
    if (!editor) return;

    const text = editor.getText();
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

  const acceptSuggestion = () => {
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

  const regenerateSuggestion = () => {
    generateSuggestion();
  };

  const requestImprovement = async () => {
    if (!selectedText || selectedText.trim().length === 0) {
      setImprovementError('Please select some text to improve.');
      return;
    }

    setImprovementLoading(true);
    setImprovementError(null);
    setImprovedText(null);

    try {
      const response = await aiAPI.improve(selectedText, improvementInstruction, {
        writingStyle: improvementWritingStyle,
        model: selectedModel
      });
      setImprovedText(response.data.improved_text);
    } catch (err) {
      console.error('Error improving text:', err);
      setImprovementError(err.response?.data?.detail || 'Failed to improve text');
    } finally {
      setImprovementLoading(false);
    }
  };

  const applyImprovement = () => {
    if (!editor || !improvedText) return;

    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, improvedText).run();

    // Clear improvement state
    setImprovedText(null);
    setShowImprovementPanel(false);
    setSelectedText('');
  };

  const dismissImprovement = () => {
    setImprovedText(null);
    setImprovementError(null);
  };

  const suggestTitle = async () => {
    if (!editor) return;

    const content = editor.getText();
    if (!content || content.trim().length < 100) {
      setTitleError('Please write at least 100 characters before generating title suggestions.');
      return;
    }

    setTitleLoading(true);
    setTitleError(null);
    setTitleSuggestions(null);

    try {
      const response = await aiAPI.suggestTitle(content, {
        titleStyle,
        model: selectedModel
      });
      setTitleSuggestions(response.data.titles);
    } catch (err) {
      console.error('Error generating title suggestions:', err);
      setTitleError(err.response?.data?.detail || 'Failed to generate title suggestions');
    } finally {
      setTitleLoading(false);
    }
  };

  const dismissTitleSuggestions = () => {
    setTitleSuggestions(null);
    setTitleError(null);
  };

  return (
    <div className="editor-container">
      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>

      <div className="suggestion-sidebar">
        <h3>AI Suggestions</h3>

        {showImprovementPanel && (
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
                value={improvementWritingStyle}
                onChange={(e) => setImprovementWritingStyle(e.target.value)}
                className="style-select"
              >
                {writingStyles.map((style) => (
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
                value={improvementInstruction}
                onChange={(e) => setImprovementInstruction(e.target.value)}
                className="instruction-input"
                rows="3"
                placeholder="E.g., Make it more formal, fix grammar, enhance clarity..."
              />
            </div>

            <button
              className="improve-btn"
              onClick={requestImprovement}
              disabled={improvementLoading}
            >
              {improvementLoading ? 'Improving...' : 'Request Improvement'}
            </button>

            {improvementLoading && (
              <div className="loading">
                Improving text...
              </div>
            )}

            {improvementError && (
              <div className="error">
                {improvementError}
              </div>
            )}

            {improvedText && !improvementLoading && (
              <div className="improvement-result">
                <div className="improved-text">
                  <strong>Improved:</strong> {improvedText}
                </div>
                <div className="improvement-actions">
                  <button className="accept" onClick={applyImprovement}>
                    Replace
                  </button>
                  <button onClick={requestImprovement}>
                    Regenerate
                  </button>
                  <button onClick={dismissImprovement}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="title-suggestion-panel">
          <h4>Title Suggestions</h4>

          <div className="control-group">
            <label htmlFor="titleStyle">Title Style:</label>
            <select
              id="titleStyle"
              value={titleStyle}
              onChange={(e) => setTitleStyle(e.target.value)}
              className="style-select"
            >
              {titleStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label} - {style.description}
                </option>
              ))}
            </select>
          </div>

          <button
            className="generate-btn"
            onClick={suggestTitle}
            disabled={titleLoading}
          >
            {titleLoading ? 'Generating Titles...' : 'Suggest Titles'}
          </button>

          {titleLoading && (
            <div className="loading">
              Generating title suggestions...
            </div>
          )}

          {titleError && (
            <div className="error">
              {titleError}
            </div>
          )}

          {titleSuggestions && !titleLoading && (
            <div className="title-suggestions-result">
              <div className="titles-list">
                <strong>Suggested Titles:</strong>
                <ul>
                  {titleSuggestions.map((title, index) => (
                    <li key={index}>{title}</li>
                  ))}
                </ul>
              </div>
              <div className="title-actions">
                <button onClick={suggestTitle}>
                  Regenerate
                </button>
                <button onClick={dismissTitleSuggestions}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="suggestion-controls">
          <div className="control-group">
            <label htmlFor="writingStyle">Writing Style:</label>
            <select
              id="writingStyle"
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              className="style-select"
            >
              {writingStyles.map((style) => (
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
              onChange={(e) => setParagraphCount(parseInt(e.target.value, 10))}
              className="paragraph-select"
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
              onChange={(e) => setBriefIdea(e.target.value)}
              className="brief-idea-input"
              rows="2"
              placeholder="E.g., The character discovers a hidden door..."
            />
          </div>

          <button
            className="generate-btn"
            onClick={generateSuggestion}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Suggestion'}
          </button>
        </div>

        {loading && (
          <div className="loading">
            Generating suggestion...
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {suggestion && !loading && (
          <div className="suggestion-card">
            <div className="suggestion-text">
              {suggestion}
            </div>
            <div className="suggestion-actions">
              <button className="accept" onClick={acceptSuggestion}>
                Accept
              </button>
              <button onClick={regenerateSuggestion}>
                Regenerate
              </button>
              <button onClick={dismissSuggestion}>
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
      </div>

      <Footer
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
      />
    </div>
  );
}
