import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <div style={{ fontSize: 56, marginBottom: 16 }}>💥</div>
          <h2>Something Went Wrong</h2>
          <p>
            An unexpected error occurred. Try refreshing the page — if the
            problem persists, please check the console for details.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "auto" }}
            onClick={() => window.location.reload()}
            id="error-reload-btn"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
