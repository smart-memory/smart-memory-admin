import React from 'react';

class ErrorTracker {
  constructor() {
    this.enabled = import.meta.env.PROD;
    this.endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT;
  }

  captureError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    if (!this.enabled) {
      console.error('Error captured:', errorData);
      return;
    }

    console.error('Error:', error.message);

    if (this.endpoint) {
      this.sendToBackend(errorData);
    }
  }

  captureException(error, level = 'error', tags = {}) {
    this.captureError(error, { level, tags });
  }

  captureMessage(message, level = 'info', context = {}) {
    const messageData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    if (!this.enabled) {
      console.log('Message captured:', messageData);
      return;
    }

    if (this.endpoint) {
      this.sendToBackend(messageData);
    }
  }

  async sendToBackend(data) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to send error to tracking service:', err);
    }
  }

  setUser(user) {
    this.userContext = user ? { id: user.id, email: user.email } : null;
  }
}

export const errorTracker = new ErrorTracker();

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    errorTracker.captureException(error, 'error', {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              We've been notified and are working to fix the issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default errorTracker;
