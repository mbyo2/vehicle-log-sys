
import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorMonitoringBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to our monitoring system
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = user.user ? await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.user.id)
        .single() : { data: null };

      await supabase.rpc('log_error', {
        p_error_type: 'react_error_boundary',
        p_error_message: error.message,
        p_stack_trace: error.stack || 'No stack trace available',
        p_user_id: user.user?.id || null,
        p_company_id: profile?.company_id || null,
        p_url: window.location.href,
        p_user_agent: navigator.userAgent,
        p_error_data: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring system:', loggingError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p className="font-semibold">Something went wrong</p>
                  <p className="text-sm">
                    An unexpected error occurred. The error has been logged and our team has been notified.
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs">Error Details (Development)</summary>
                      <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto">
                        {this.state.error.message}
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
