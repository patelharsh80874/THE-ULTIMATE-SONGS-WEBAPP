import axios from "axios";
import { API_BASE_URL, API_HOME_URL } from "../constants";

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
