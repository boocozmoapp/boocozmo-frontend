// src/components/ErrorBoundary.tsx - Graceful Error Handling with Beautiful UI
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { FaBook, FaRedo, FaHome, FaExclamationTriangle } from "react-icons/fa";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/home";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f1ea] to-[#e8e0d5] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-red-600 p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                
                {/* Sad book mascot */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 transform -rotate-6 shadow-lg">
                    <div className="relative">
                      <FaBook className="text-white text-4xl" />
                      <FaExclamationTriangle className="absolute -bottom-1 -right-1 text-amber-300 text-lg" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-white text-center">Oops! Something went wrong</h1>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <div className="bg-[#fdfaf5] rounded-2xl p-5 border border-[#e8e0d5] mb-6">
                  <p className="text-center text-[#555] leading-relaxed mb-4">
                    Don't worry! Our book elves are already working on fixing this magical mishap.
                  </p>
                  
                  {/* Error details (collapsible) */}
                  <details className="text-left">
                    <summary className="text-sm text-[#999] cursor-pointer hover:text-[#555] transition-colors">
                      Technical details (for developers)
                    </summary>
                    <pre className="mt-3 p-3 bg-[#382110]/5 rounded-xl text-xs text-[#382110] overflow-auto max-h-32">
                      {this.state.error?.toString()}
                      {this.state.errorInfo?.componentStack?.slice(0, 500)}
                    </pre>
                  </details>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-[#d8d8d8] text-[#555] font-semibold hover:bg-[#f4f1ea] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FaHome />
                    Go Home
                  </button>
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#382110] to-[#5a3e2b] text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FaRedo />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer message */}
            <p className="text-center text-[#999] text-sm mt-6">
              If this keeps happening, please contact support 📚
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
