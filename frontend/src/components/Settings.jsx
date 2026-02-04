import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import '../styles/Settings.css';

export default function Settings() {
  const [defaultPrompts, setDefaultPrompts] = useState(null);
  const [customPrompts, setCustomPrompts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [expandedStyle, setExpandedStyle] = useState(null);

  // Fetch default prompts and user settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [defaults, userSettings] = await Promise.all([
          settingsAPI.getDefaultPrompts(),
          settingsAPI.getMySettings()
        ]);

        setDefaultPrompts(defaults);
        setCustomPrompts(userSettings.custom_prompts || {});
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handlePromptChange = (styleKey, value) => {
    setCustomPrompts(prev => ({
      ...prev,
      [styleKey]: value
    }));
  };

  const handleReset = (styleKey) => {
    setCustomPrompts(prev => {
      const newPrompts = { ...prev };
      delete newPrompts[styleKey];
      return newPrompts;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await settingsAPI.updateMySettings({ custom_prompts: customPrompts });

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getPromptValue = (styleKey) => {
    return customPrompts[styleKey] || defaultPrompts?.writing_styles[styleKey]?.description || '';
  };

  const isCustomized = (styleKey) => {
    return styleKey in customPrompts && customPrompts[styleKey] !== '';
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">Loading settings...</div>
      </div>
    );
  }

  if (!defaultPrompts) {
    return (
      <div className="settings-container">
        <div className="settings-error">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Writing Style Settings</h1>
        <p className="settings-description">
          Customize the prompts for each writing style. Leave empty to use the default prompt.
        </p>
      </div>

      {error && (
        <div className="settings-alert settings-alert-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="settings-alert settings-alert-success">
          {successMessage}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-section">
          <h2>Writing Styles</h2>
          <div className="settings-list">
            {Object.entries(defaultPrompts.writing_styles).map(([key, style]) => (
              <div key={key} className="settings-item">
                <div
                  className="settings-item-header"
                  onClick={() => setExpandedStyle(expandedStyle === key ? null : key)}
                >
                  <div className="settings-item-title">
                    <h3>{style.name}</h3>
                    {isCustomized(key) && (
                      <span className="settings-badge">Customized</span>
                    )}
                  </div>
                  <button className="settings-expand-btn">
                    {expandedStyle === key ? '▼' : '▶'}
                  </button>
                </div>

                {expandedStyle === key && (
                  <div className="settings-item-content">
                    <label className="settings-label">
                      Prompt for {style.name}
                    </label>
                    <textarea
                      className="settings-textarea"
                      value={getPromptValue(key)}
                      onChange={(e) => handlePromptChange(key, e.target.value)}
                      rows={12}
                      placeholder={`Enter custom prompt for ${style.name}...`}
                    />
                    <div className="settings-item-actions">
                      <button
                        className="settings-btn settings-btn-secondary"
                        onClick={() => handleReset(key)}
                        disabled={!isCustomized(key)}
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button
          className="settings-btn settings-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
