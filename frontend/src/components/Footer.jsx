import { useState } from 'react';

export default function Footer({ selectedModel, onModelChange, availableModels }) {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="model-selector">
          <label htmlFor="footerModelSelect">LLM Model:</label>
          <select
            id="footerModelSelect"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="model-select"
          >
            {availableModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </footer>
  );
}
