/**
 * Specialized error boundary for the Editor component.
 *
 * Provides specific error handling and recovery for editor-related errors,
 * with a user-friendly fallback UI that maintains access to other features.
 */

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

export default function EditorErrorBoundary({ children }) {
  const fallback = (error, reset) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '30px',
          border: '1px solid #ff6b6b',
          borderRadius: '12px',
          backgroundColor: '#fff5f5',
        }}>
          <h2 style={{ color: '#d32f2f', marginTop: 0 }}>
            Editor Error
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            The editor encountered an unexpected error. This could be due to:
          </p>
          <ul style={{
            textAlign: 'left',
            color: '#666',
            marginBottom: '20px',
          }}>
            <li>Corrupted document state</li>
            <li>Browser extension conflicts</li>
            <li>Memory issues with large documents</li>
          </ul>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Reload Editor
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#d32f2f',
                border: '1px solid #d32f2f',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Refresh Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#d32f2f',
              }}>
                Technical Details
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '12px',
                textAlign: 'left',
              }}>
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
