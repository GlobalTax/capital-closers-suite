import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Supabase auth token key pattern
const SUPABASE_AUTH_KEY_PREFIX = 'sb-';
const SUPABASE_AUTH_KEY_SUFFIX = '-auth-token';

export function LoadingScreen() {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    // Preserve Supabase auth tokens when clearing cache
    const authTokens: Record<string, string> = {};
    
    // Find and save all Supabase auth tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SUPABASE_AUTH_KEY_PREFIX) && key.endsWith(SUPABASE_AUTH_KEY_SUFFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          authTokens[key] = value;
        }
      }
    }

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Restore auth tokens
    Object.entries(authTokens).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Conectando con el servidor...</p>
        
        {showRetry && (
          <div className="space-y-3 pt-4">
            <p className="text-sm text-destructive">La conexión está tardando más de lo esperado</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={handleClearCache} variant="ghost" size="sm">
                Limpiar caché y reintentar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
