/**
 * Error boundary component for catching and handling React errors.
 *
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="error-boundary-container">
          <h2 className="error-boundary-title">
            Something went wrong
          </h2>
          <p className="error-boundary-message">
            An error occurred while rendering this component.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="error-boundary-details">
              <summary className="error-boundary-summary">
                Error Details
              </summary>
              <pre className="error-boundary-stack">
                {String(this.state.error?.message || this.state.error).replace(/[<>]/g, '')}
                {this.state.errorInfo?.componentStack &&
                  String(this.state.errorInfo.componentStack).replace(/[<>]/g, '')}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="error-boundary-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
