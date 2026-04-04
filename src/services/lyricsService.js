import axios from 'axios';

/**
 * Parses LRC format string into an array of { time, text } objects.
 * Format: [mm:ss.xx] Lyric text
 */
export const parseLRC = (lrcString) => {
  if (!lrcString) return [];
  
  const lines = lrcString.split('\n');
  const result = [];
  // Matches [mm:ss], [mm:ss.xx], or [mm:ss.xxx]
  const timeRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/;

  lines.forEach(line => {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  });

  return result.sort((a, b) => a.time - b.time);
};

/**
 * Fetches lyrics from LRCLIB API.
 * @param {string} artist - Artist name
 * @param {string} title - Song title
 * @param {number} duration - Duration in seconds (optional but recommended for accuracy)
 */
export const fetchLyrics = async (artist, title, duration) => {
  try {
    // LRCLIB GET endpoint: /api/get?artist_name=...&track_name=...&duration=...
    const response = await axios.get('https://lrclib.net/api/get', {
      params: {
        artist_name: artist,
        track_name: title,
        duration: duration
      }
    });

    const data = response.data;
    
    return {
      id: data.id,
      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics,
      parsedSynced: data.syncedLyrics ? parseLRC(data.syncedLyrics) : [],
      isSynced: !!data.syncedLyrics
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('Lyrics not found on LRCLIB');
      return null;
    }
    console.error('Error fetching lyrics:', error);
    throw error;
  }
};
