import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback p-6 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-error/20 rounded-full flex items-center justify-center">
              <span className="text-error text-lg">⚠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-error">Something went wrong</h3>
              <p className="text-sm text-muted">This component encountered an error and couldn't render properly.</p>
            </div>
          </div>
          
          {this.state.error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-muted hover:text-primary">
                View error details
              </summary>
              <pre className="mt-2 p-3 bg-secondary rounded text-xs overflow-auto">
                {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {'\n\nStack trace:\n'}
                    {this.state.error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <button 
              className="btn btn-primary text-xs"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </button>
            <button 
              className="btn btn-ghost text-xs"
              onClick={() => window.location.reload()}
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

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specific error boundary for chart components
export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="chart-error-fallback p-4 bg-secondary rounded-lg border border-muted">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <h4 className="font-medium text-primary mb-1">Chart Unavailable</h4>
            <p className="text-sm text-muted">Unable to render chart data at this time.</p>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Chart rendering error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Map error boundary for geospatial components
export function MapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="map-error-fallback p-6 bg-secondary rounded-lg border border-muted">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h4 className="font-medium text-primary mb-1">Map Unavailable</h4>
            <p className="text-sm text-muted mb-4">Unable to load map data at this time.</p>
            <button className="btn btn-primary text-xs">
              Retry Map Loading
            </button>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error('Map rendering error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}