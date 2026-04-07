import axios from "axios";
import { API_BASE_URL, API_HOME_URL } from "../constants";
import BACKEND_URL from '../config/api';

export const getHomeModules = (language) =>
  axios.get(`${API_HOME_URL}/modules?language=${language}`);

export const searchSongs = (query, page, limit = 40) =>
  axios.get(`${API_BASE_URL}/search/songs?query=${query}&page=${page}&limit=${limit}`);

export const getSongSuggestions = (id) =>
  axios.get(`${API_BASE_URL}/songs/${id}/suggestions`);

export const getAlbumDetails = (id) =>
  axios.get(`${API_BASE_URL}/albums?id=${id}`);

export const getPlaylistDetails = (id, limit = 100) =>
  axios.get(`${API_BASE_URL}/playlists?id=${id}&limit=${limit}`);

export const getArtistSongs = (id, page) =>
  axios.get(`${API_BASE_URL}/artists/${id}/songs?page=${page}`);

export const getArtistDetails = (id) =>
  axios.get(`${API_BASE_URL}/artists/${id}`);

export const getSongDetails = (id) =>
  axios.get(`${API_BASE_URL}/songs/${id}`);

export const getSongsDetails = (ids) =>
  axios.get(`${API_BASE_URL}/songs?ids=${ids}`);

// --- RADIO FEATURE ENDPOINTS ---

export const fetchFeaturedRadios = async (language = 'hindi') => {
  const response = await axios.get(`${BACKEND_URL}/api/radio/featured?language=${language}`);
  return response.data;
};

export const fetchArtistsRadios = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/radio/artists`);
  return response.data?.top_artists || [];
};

export const fetchUniqueArtists = async (language) => {
  const response = await axios.get(`${BACKEND_URL}/api/radio/trending?language=${language}`);
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
  const response = await axios.get(`${BACKEND_URL}/api/radio/starring?language=${language}`);
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
  const trending = await axios.get(`${BACKEND_URL}/api/radio/trending?language=${language}`);
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
      const detailRes = await axios.get(`${BACKEND_URL}/api/radio/label?token=${token}`);
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
  const response = await axios.get(`${BACKEND_URL}/api/radio/label`, {
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
    const response = await axios.get(`${BACKEND_URL}/api/radio/create-station?language=${language}&id=${radioId}`);
    return response.data?.stationid || null;
  } catch (error) { return null; }
};

export const createArtitsStationId = async (radioId) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/radio/create-artist-station?id=${radioId}`);
    return response.data?.stationid || null;
  } catch (error) { return null; }
};

export const getSongsByStationId = async (stationId, limit = 20, next = 1) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/radio/station-songs?stationid=${stationId}&limit=${limit}&next=${next}`);
    
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
    const detailRes = await axios.get(`${API_BASE_URL}/songs?ids=${idsParam}`);
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
