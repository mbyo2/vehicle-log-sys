
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { router } from './routes';
import './index.css';
import { RouterProvider } from 'react-router-dom';

// Create a client with default error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Query error:', error);
      }
    }
  }
});

// Create a fallback UI component
const FallbackUI = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h2 className="text-xl font-semibold mb-2">Application Error</h2>
    <p className="mb-4">There was an issue loading the application.</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
    >
      Reload Application
    </button>
  </div>
);

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error("Application error:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <RouterProvider router={router} />
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Fatal rendering error:", error);
  
  // Render fallback UI directly if main rendering fails
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <FallbackUI />
    </React.StrictMode>
  );
}
