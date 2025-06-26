import { useState, useEffect, useCallback } from 'react';

interface UseDebounceSearchOptions {
  delay?: number;
  onSearch: (searchTerm: string) => void;
  initialValue?: string;
}

export const useDebounceSearch = ({ 
  delay = 1500, 
  onSearch, 
  initialValue = '' 
}: UseDebounceSearchOptions) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Call the search callback when debounced term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  // Function to update search term (to be used in input onChange)
  const updateSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Function to clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    updateSearchTerm,
    clearSearch,
    isSearching: searchTerm !== debouncedSearchTerm
  };
}; 