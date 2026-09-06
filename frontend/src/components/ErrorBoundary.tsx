import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('React error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-abyss-950 p-4">
          <div className="glass-panel rounded-xl p-6 max-w-md w-full border-l-2 border-l-status-danger/70">
            <h2 className="text-xl font-display font-bold text-status-danger mb-2">System Fault Detected</h2>
            <p className="text-ink-300 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <pre className="bg-panel-900 text-ink-500 p-3 rounded text-xs overflow-auto max-h-40 mb-4 font-mono">
              {this.state.error?.stack}
            </pre>
            <button
              className="btn btn-primary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
