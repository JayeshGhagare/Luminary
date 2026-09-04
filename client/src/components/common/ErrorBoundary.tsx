import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Luminary UI uncaught error boundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[250px] flex items-center justify-center p-6 select-none">
          <div
            className="max-w-md w-full rounded-2xl p-6 border shadow-2xl flex flex-col items-center text-center card-theme"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-main)' }}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </h3>

            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {this.props.fallbackMessage ||
                this.state.error?.message ||
                'An unexpected error occurred in this section of the meeting.'}
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2 rounded-xl text-xs font-bold btn-primary flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
