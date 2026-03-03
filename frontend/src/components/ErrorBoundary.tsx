import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep logging lightweight; backend logging/monitoring can capture richer traces.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-primary)" }}>
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </h1>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            {this.state.message || "An unexpected error occurred while rendering this page."}
          </p>
          <button onClick={this.handleReload} className="btn-primary w-full" aria-label="Reload app">
            Reload App
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
