import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded">
          <h3 className="text-lg font-semibold text-red-700">Something went wrong</h3>
          <pre className="text-sm text-red-700 mt-2 whitespace-pre-wrap">{String(this.state.error && this.state.error.toString())}</pre>
          <div className="mt-3 text-sm text-gray-600">Try reloading the page or contact support with the error above.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
