/**
 * 错误边界组件 - 捕获子组件渲染错误
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 捕获错误:', error.message, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: '40px', background: '#fee', border: '2px solid red', borderRadius: '8px', margin: '20px' }}>
          <h2 style={{ color: '#c00' }}>渲染错误</h2>
          <p style={{ color: '#666' }}>{this.state.error?.message}</p>
          <details style={{ marginTop: '16px', whiteSpace: 'pre-wrap' }}>
            <summary>错误详情</summary>
            {this.state.error?.stack}
            {'\n\n'}
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
