import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HelpSearchDialog } from './HelpSearchDialog';

interface HelpSearchContextType {
  openSearch: () => void;
  isOpen: boolean;
}

const HelpSearchContext = createContext<HelpSearchContextType>({
  openSearch: () => {},
  isOpen: false,
});

interface HelpSearchProviderProps {
  children: ReactNode;
}

export function HelpSearchProvider({ children }: HelpSearchProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Global keyboard shortcut: Ctrl+/ or Cmd+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+/ or Cmd+/ (forward slash)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <HelpSearchContext.Provider value={{ 
      openSearch: () => setSearchOpen(true),
      isOpen: searchOpen
    }}>
      {children}
      <HelpSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </HelpSearchContext.Provider>
  );
}

/**
 * Hook to open the global help search from any component
 */
export function useGlobalHelpSearch() {
  return useContext(HelpSearchContext);
}
