import axios from "axios";
import { cachedGet } from "../utils/cachedApiClient";
import { API_BASE_URL, API_HOME_URL } from "../constants";
import BACKEND_URL from '../config/api';

export const getHomeModules = (language) =>
  cachedGet(`${API_HOME_URL}/modules?language=${language}`);

export const searchSongs = (query, page, limit = 40) =>
  cachedGet(`${API_BASE_URL}/search/songs?query=${query}&page=${page}&limit=${limit}`);

export const getSongSuggestions = (id) =>
  cachedGet(`${API_BASE_URL}/songs/${id}/suggestions`);

export const getAlbumDetails = (id) =>
  cachedGet(`${API_BASE_URL}/albums?id=${id}`);

export const getPlaylistDetails = (id, limit = 100) =>
  cachedGet(`${API_BASE_URL}/playlists?id=${id}&limit=${limit}`);

export const getArtistSongs = (id, page) =>
  cachedGet(`${API_BASE_URL}/artists/${id}/songs?page=${page}`);

export const getArtistDetails = (id) =>
  cachedGet(`${API_BASE_URL}/artists/${id}`);

export const getSongDetails = (id) =>
  cachedGet(`${API_BASE_URL}/songs/${id}`);

export const getSongsDetails = (ids) =>
  cachedGet(`${API_BASE_URL}/songs?ids=${ids}`);

// --- RADIO FEATURE ENDPOINTS ---

export const fetchFeaturedRadios = async (language = 'hindi') => {
  const response = await cachedGet(`${BACKEND_URL}/api/radio/featured?language=${language}`);
  return response.data;
};

export const fetchArtistsRadios = async () => {
  const response = await cachedGet(`${BACKEND_URL}/api/radio/artists`);
  return response.data?.top_artists || [];
};

export const fetchUniqueArtists = async (language) => {
  const response = await cachedGet(`${BACKEND_URL}/api/radio/trending?language=${language}`);
  const uniqueArtists = [];
  const addedIds = new Set();

  response.data?.forEach(song => {
    const primaryArtists = song?.more_info?.artistMap?.primary_artists || [];
    primaryArtists.forEach(artist => {
      if (!artist.image || !artist.image.includes("artists")) return;
      if (addedIds.has(artist.id)) return;
      uniqueArtists.push({ ...artist, language: song.language });
      addedIds.add(artist.id);
    });
  });
  return uniqueArtists;
};

export const fetchStarringArtists = async (language) => {
  const response = await cachedGet(`${BACKEND_URL}/api/radio/starring?language=${language}`);
  const uniqueArtists = [];
  const addedIds = new Set();
  
  response.data?.results?.forEach(song => {
    const artists = song?.more_info?.artistMap?.artists || [];
    artists.forEach(artist => {
      if (artist.role !== "starring") return;
      if (!artist.image || !artist.image.includes("artists")) return;
      if (addedIds.has(artist.id)) return;
      uniqueArtists.push({ ...artist, language: song.language });
      addedIds.add(artist.id);
    });
  });
  return uniqueArtists;
};

export const getTrendingLabels = async (language = 'hindi') => {
  const trending = await cachedGet(`${BACKEND_URL}/api/radio/trending?language=${language}`);
  const unique = new Set();
  const results = [];

  for (const item of (trending.data || [])) {
    const label_url = item?.more_info?.label_url;
    if (!label_url) continue;

    const parts = label_url.split("/");
    const token = parts[parts.length - 1];

    if (unique.has(token)) continue;
    unique.add(token);

    try {
      const detailRes = await cachedGet(`${BACKEND_URL}/api/radio/label?token=${token}`);
      if (detailRes.data) {
        results.push({
          label_url,
          token,
          labelId: detailRes.data.labelId,
          name: detailRes.data.name,
          image: detailRes.data.image,
        });
      }
    } catch(e) {}
  }
  return results;
};

export const getDetailedLabel = async (token, page = 0, n_song = 20, n_album = 20, category = 'popularity', sortOrder = 'desc', language = 'hindi') => {
  const response = await cachedGet(`${BACKEND_URL}/api/radio/label`, {
    params: {
      token,
      p: page,
      n_song,
      n_album,
      category,
      sort_order: sortOrder,
      language
    }
  });
  return response.data;
};

// --- STATION CREATION AND FETCHING ---
export const createStationId = async (language, radioId) => {
  try {
    const response = await cachedGet(`${BACKEND_URL}/api/radio/create-station?language=${language}&id=${radioId}`);
    return response.data?.stationid || null;
  } catch (error) { return null; }
};

export const createArtitsStationId = async (radioId) => {
  try {
    const response = await cachedGet(`${BACKEND_URL}/api/radio/create-artist-station?id=${radioId}`);
    return response.data?.stationid || null;
  } catch (error) { return null; }
};

export const getSongsByStationId = async (stationId, limit = 20, next = 1) => {
  try {
    const response = await cachedGet(`${BACKEND_URL}/api/radio/station-songs?stationid=${stationId}&limit=${limit}&next=${next}`);
    
    // Convert generic object { "0": {...}, "1": {...} } to array of song IDs
    const data = response.data;
    if (!data) return { data: [] };
    
    // Jiosaavn returns the songs as an object map. Handle it like native app.
    const songIds = Object.keys(data)
      .filter(key => !isNaN(key))
      .map(key => data[key]?.song?.id)
      .filter(id => id); // filter out undefined
      
    if (songIds.length === 0) return { data: [] };
    
    // FIX: Use query param format (?ids=) not path format (/ids)
    const idsParam = songIds.join(',');
    const detailRes = await cachedGet(`${API_BASE_URL}/songs?ids=${idsParam}`);
    const songs = detailRes.data?.data;
    return { data: Array.isArray(songs) ? songs : (songs ? [songs] : []) };
  } catch (error) {
    console.error("Error fetching station songs:", error?.response?.status, error?.message);
    return { data: [] };
  }
};

export const fetchRadioSongs = async (language, radioId) => {
  const stationId = await createStationId(language, radioId);
  if (!stationId) return { fullSongs: { data: [] } };
  const fullSongs = await getSongsByStationId(stationId, 20, 1);
  return { fullSongs, stationId };
};

export const fetchArtitsRadioSongs = async (radioId) => {
  const stationId = await createArtitsStationId(radioId);
  if (!stationId) return { fullSongs: { data: [] } };
  const fullSongs = await getSongsByStationId(stationId, 20, 1);
  return { fullSongs, stationId };
};

// =============================================================
// --- SMART QUEUE SYSTEM ---
// =============================================================

/**
 * Internal: Get song suggestion IDs for a given song ID
 */
const _getSuggestionIds = async (songId) => {
  try {
    const res = await cachedGet(`${API_BASE_URL}/songs/${songId}/suggestions`);
    const songs = res.data?.data || [];
    return songs.map(s => s.id).filter(Boolean).slice(0, 10);
  } catch (e) {
    return [];
  }
};

/**
 * Internal: Create entity station from a list of song IDs
 * Proxied via our backend to avoid CORS errors
 */
const _createEntityStation = async (songIds) => {
  try {
    const idsParam = songIds.join(',');
    const res = await axios.get(`${BACKEND_URL}/api/radio/create-entity-station?ids=${encodeURIComponent(idsParam)}`);
    return res.data?.stationid || null;
  } catch (e) {
    return null;
  }
};

/**
 * Internal: Get song IDs from a smart radio station
 * Proxied via our backend to avoid CORS errors
 */
const _getStationSongIds = async (stationId, count = 20) => {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/radio/smart-queue-songs?stationid=${stationId}&k=${count}`);
    const data = res.data;
    if (!data) return [];
    return Object.keys(data)
      .filter(key => !isNaN(key))
      .map(key => data[key]?.song?.id)
      .filter(Boolean);
  } catch (e) {
    return [];
  }
};

/**
 * Internal: Fetch full song details from JioSaavn formatted API
 */
const _getFullSongDetails = async (ids) => {
  try {
    if (!ids || ids.length === 0) return [];
    const idsParam = ids.join(',');
    const res = await cachedGet(`${API_BASE_URL}/songs?ids=${idsParam}`);
    const songs = res.data?.data;
    return Array.isArray(songs) ? songs : (songs ? [songs] : []);
  } catch (e) {
    return [];
  }
};

/**
 * MAIN: Build a Smart Queue for a given song.
 * Full pipeline: suggestions → entity station → station songs → full song details
 * Returns an array of fully-formed song objects ready to add to the queue.
 * Returns [] if any step fails (caller should fall back to existing queue logic).
 */
export const buildSmartQueueForSong = async (songId) => {
  try {
    // Step 1: Get suggestion IDs from current song
    const allSuggestions = await _getSuggestionIds(songId);
    if (allSuggestions.length === 0) return [];

    // Helper: Get a random subset from an array
    const getSubset = (arr, size) => {
      return [...arr].sort(() => 0.5 - Math.random()).slice(0, size);
    };

    // Step 2: Create 3 DIFFERENT stations in parallel with different seeds (for variety)
    const stationPromises = [
      _createEntityStation(getSubset(allSuggestions, 5)),
      _createEntityStation(getSubset(allSuggestions, 5)),
      _createEntityStation(getSubset(allSuggestions, 5))
    ];
    
    const stationIds = (await Promise.all(stationPromises)).filter(Boolean);
    if (stationIds.length === 0) return [];

    // Step 3: Get song IDs from each unique station
    const songPromises = stationIds.map(id => _getStationSongIds(id, 15));
    const songResults = await Promise.all(songPromises);
    
    // Merge all results and remove duplicates
    const stationSongIds = [...new Set(songResults.flat())];
    if (stationSongIds.length === 0) return [];

    // Step 4: Fetch full song details
    const fullSongs = await _getFullSongDetails(stationSongIds);
    
    // Step 5: Final Shuffle for maximum variety
    return fullSongs.sort(() => 0.5 - Math.random());
  } catch (e) {
    console.error('[SmartQueue] Pipeline failed:', e);
    return [];
  }
};
