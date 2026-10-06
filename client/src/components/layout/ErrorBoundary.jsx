import { Component } from "react";

// Last line of defence: a render crash shows a way out instead of a blank page
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <div className="max-w-sm space-y-4">
          <p className="label-mono">Something broke</p>
          <h1 className="text-2xl tracking-tightest">This page hit an error.</h1>
          <p className="text-muted">Your credits and bookings are safe; they live on the server. Reloading usually fixes it.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.location.reload()} className="h-10 px-4 rounded bg-accent text-accent-ink text-sm font-medium">
              Reload
            </button>
            <a href="/" className="h-10 px-4 rounded border border-line text-sm flex items-center">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
