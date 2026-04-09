import axios from 'axios';

const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes cache
const memoryCache = new Map();

/**
 * Generate a consistent cache key based on URL and query params
 */
const generateCacheKey = (url, params = {}) => {
  const urlObj = new URL(url, window.location.origin); // Ensure full URL for proper param parsing
  const searchParams = new URLSearchParams(urlObj.search);
  
  // Append any extra axios params
  Object.keys(params).forEach(key => {
    searchParams.append(key, params[key]);
  });
  
  searchParams.sort(); // Sort params to ensure consistency (e.g. ?a=1&b=2 is same as ?b=2&a=1)
  
  return `api_cache_${urlObj.pathname}?${searchParams.toString()}`;
};

/**
 * A wrapper around axios.get that implements in-memory and sessionStorage caching.
 * Maintains the exact same response signature as a normal axios.get request.
 */
export const cachedGet = async (url, config = {}) => {
  const key = generateCacheKey(url, config.params);

  // 1. Try to fetch from fast memory cache
  const memItem = memoryCache.get(key);
  if (memItem && Date.now() - memItem.timestamp < CACHE_EXPIRY) {
    return Promise.resolve(memItem.response);
  }

  // 2. Try to fetch from persistent sessionStorage
  try {
    const sessionStr = sessionStorage.getItem(key);
    if (sessionStr) {
      const sessionItem = JSON.parse(sessionStr);
      if (Date.now() - sessionItem.timestamp < CACHE_EXPIRY) {
        // Sync memory cache
        memoryCache.set(key, sessionItem);
        return Promise.resolve(sessionItem.response);
      } else {
        // Remove expired item
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    // Ignore JSON parse errors or sessionStorage not available
  }

  // 3. Fallback to actual network request
  const response = await axios.get(url, config);

  // Only cache successful requests
  if (response.status >= 200 && response.status < 300) {
    // Only pick what we need to avoid circular references and DOM elements in Axios response
    const responseToCache = {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };

    const cacheItem = {
      timestamp: Date.now(),
      response: responseToCache
    };

    // Save to memory cache
    memoryCache.set(key, cacheItem);

    // Save to sessionStorage
    try {
      sessionStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Clear all API cache from session storage if full
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('api_cache_')) {
            sessionStorage.removeItem(k);
          }
        });
        // Try setting it one more time
        try {
          sessionStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (err) {}
      }
    }
  }

  return response;
};
