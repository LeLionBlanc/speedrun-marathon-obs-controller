/**
 * Local storage caching utility
 * Provides type-safe methods for storing and retrieving data from localStorage
 * with automatic JSON parsing/stringifying and error handling
 */

export const useLocalCache = () => {
  /**
   * Get an item from localStorage with type safety
   * @param key The key to retrieve
   * @param defaultValue Default value to return if key doesn't exist or on error
   * @returns The stored value or defaultValue
   */
  const getItem = <T>(key: string, defaultValue: T): T => {
    // Skip on server side
    if (process.server) return defaultValue;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      return JSON.parse(stored) as T;
    } catch (e) {
      console.error(`Error retrieving ${key} from localStorage:`, e);
      return defaultValue;
    }
  };
  
  /**
   * Store an item in localStorage with type safety
   * @param key The key to store under
   * @param value The value to store
   * @param expiry Optional expiry time in milliseconds
   */
  const setItem = <T>(key: string, value: T, expiry?: number): void => {
    // Skip on server side
    if (process.server) return;
    
    try {
      const item = expiry 
        ? { value, expiry: Date.now() + expiry }
        : { value };
        
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error(`Error storing ${key} in localStorage:`, e);
    }
  };
  
  /**
   * Remove an item from localStorage
   * @param key The key to remove
   */
  const removeItem = (key: string): void => {
    // Skip on server side
    if (process.server) return;
    
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e);
    }
  };
  
  /**
   * Check if an item exists and is not expired
   * @param key The key to check
   * @returns boolean indicating if the item exists and is valid
   */
  const hasValidItem = (key: string): boolean => {
    // Skip on server side
    if (process.server) return false;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return false;
      
      const item = JSON.parse(stored);
      
      // Check if item has expiry and if it's expired
      if (item.expiry && Date.now() > item.expiry) {
        // Remove expired item
        localStorage.removeItem(key);
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  };
  
  return {
    getItem,
    setItem,
    removeItem,
    hasValidItem
  };
};