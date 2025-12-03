/**
 * Simple in-memory cache for when database is unavailable.
 * This cache persists across API calls within the same serverless function instance.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global in-memory cache (persists within serverless function lifetime)
const memoryCache = new Map<string, CacheEntry<any>>();

// Default TTL: 24 hours (in milliseconds)
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Get item from memory cache
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  // Check if still valid (within TTL)
  if (Date.now() - entry.timestamp > DEFAULT_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set item in memory cache
 */
export function setInMemoryCache<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear specific key from cache
 */
export function clearFromMemoryCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllMemoryCache(): void {
  memoryCache.clear();
}

/**
 * Get cache stats
 */
export function getMemoryCacheStats(): { size: number; keys: string[] } {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

// Cache key generators
export const cacheKeys = {
  marketSnapshot: () => "market:snapshot",
  stock: (symbol: string) => `stock:${symbol.toUpperCase()}`,
  mutualFund: (code: string) => `mf:${code}`,
  ipo: (id: string) => `ipo:${id}`,
  ipoList: (type: "current" | "upcoming" | "past") => `ipo:list:${type}`,
};

