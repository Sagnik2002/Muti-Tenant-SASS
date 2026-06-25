import { useState, useEffect, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';

/**
 * Custom hook for persisting unsaved form drafts to IndexedDB.
 * Implements offline support as per the assessment requirements.
 */
export function useIndexedDB<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        const value = await get(key);
        if (value !== undefined) {
          setStoredValue(value as T);
        }
      } catch (error) {
        console.error('Failed to load from IndexedDB:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadValue();
  }, [key]);

  // Save to IndexedDB
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
        await set(key, newValue);
      } catch (error) {
        console.error('Failed to save to IndexedDB:', error);
      }
    },
    [key, storedValue],
  );

  // Delete from IndexedDB
  const deleteValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      await del(key);
    } catch (error) {
      console.error('Failed to delete from IndexedDB:', error);
    }
  }, [key, initialValue]);

  return { value: storedValue, setValue, deleteValue, isLoaded };
}
