import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Algo salió mal</CardTitle>
              </div>
              <CardDescription>
                La aplicación encontró un error inesperado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-mono text-sm text-destructive">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="p-4 bg-muted rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">
                    Stack Trace
                  </summary>
                  <pre className="text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <Button onClick={this.handleReset}>
                  Volver al inicio
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
