import axios from 'axios';

/**
 * In development, the Vite proxy handles CORS by proxying /lyrics-api → external API.
 * In production, we call the external API directly via env variable.
 */
const isDev = import.meta.env.MODE === 'development';
const LYRICS_API_URL = import.meta.env.VITE_LYRICS_API_URL;
const LYRICS_BASE = isDev
  ? '/lyrics-api'   // Proxied by Vite dev server
  : `${LYRICS_API_URL}/api/lyrics`;

/**
 * Fetches lyrics for a song using its ID.
 * The API returns synced lyrics with timed lines (startTimeMs, endTimeMs).
 *
 * @param {string} songId - The song ID (e.g., "7hTy4BTR")
 * @returns {object|null} Processed lyrics data or null if not found
 */
export const fetchLyrics = async (songId) => {
  if (!songId) return null;

  try {
    // Use plain axios (NOT cachedGet) — lyrics are per-song and don't benefit much from caching,
    // plus cachedGet can cause issues with proxy URL handling
    const response = await axios.get(`${LYRICS_BASE}/${songId}/sync`);
    const result = response.data;

    if (!result?.success || !result?.data) {
      return null;
    }

    const data = result.data;

    // Build synced lines array — convert ms to seconds for audio sync
    const parsedSynced = (data.lines || []).map((line) => ({
      text: line.text,
      time: line.startTimeMs / 1000,        // Convert ms → seconds
      endTime: line.endTimeMs / 1000,        // Convert ms → seconds
    }));

    return {
      id: data.id,
      plainLyrics: data.lyrics || '',
      isSynced: data.hasSync && parsedSynced.length > 0,
      syncType: data.syncType || 'none',
      parsedSynced,
      source: data.source || 'unknown',
      duration: data.duration,
      snippet: data.snippet || '',
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('Lyrics not found for song:', songId);
      return null;
    }
    console.error('Error fetching lyrics:', error);
    return null;
  }
};
