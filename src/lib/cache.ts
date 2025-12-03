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

/**
 * Get item from memory cache
 * Cache is indefinite - no TTL. Data persists until manual refresh or serverless function restart.
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  // No TTL check - cache is indefinite
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
  watchlist: (userId: string) => `watchlist:${userId}`,
};

