import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// Market
export function useMarketSnapshot(refresh = false) {
  return useSWR(
    `/api/market/snapshot${refresh ? "?refresh=true" : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

// Stocks
export function useStock(symbol: string | null, refresh = false) {
  return useSWR(
    symbol ? `/api/stocks/${encodeURIComponent(symbol)}${refresh ? "?refresh=true" : ""}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

export function useStockSearch(query: string) {
  return useSWR(
    query ? `/api/stocks/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );
}

// Mutual Funds
export function useMutualFund(code: string | null, refresh = false) {
  return useSWR(
    code ? `/api/mutual-funds/${encodeURIComponent(code)}${refresh ? "?refresh=true" : ""}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

export function useMutualFundSearch(query: string) {
  return useSWR(
    query ? `/api/mutual-funds/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );
}

// IPOs
export function useCurrentIPOs(refresh = false) {
  return useSWR(
    `/api/ipo/current${refresh ? "?refresh=true" : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

export function useUpcomingIPOs(refresh = false) {
  return useSWR(
    `/api/ipo/upcoming${refresh ? "?refresh=true" : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

export function usePastIPOs(refresh = false) {
  return useSWR(
    `/api/ipo/past${refresh ? "?refresh=true" : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

export function useIPO(id: string | null, refresh = false) {
  return useSWR(
    id ? `/api/ipo/${encodeURIComponent(id)}${refresh ? "?refresh=true" : ""}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}

// Watchlist
export function useWatchlistItems(userId: string | null) {
  return useSWR(
    userId ? `/api/watchlist/items?userId=${encodeURIComponent(userId)}` : null,
    fetcher
  );
}

export function useWatchlistPreferences(
  userId: string | null,
  entityType: "stock" | "mutual_fund" | "ipo"
) {
  return useSWR(
    userId
      ? `/api/watchlist/preferences?userId=${encodeURIComponent(userId)}&entityType=${entityType}`
      : null,
    fetcher
  );
}

// Helper to mutate SWR cache
export async function refreshData(key: string) {
  const { mutate } = await import("swr");
  return mutate(key);
}

