import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import API_BASE_URL from "../config/api";

const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };
const API = `${API_BASE_URL}/api/playlists`;


const PlaylistContext = createContext(null);

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylist must be used within a PlaylistProvider");
  }
  return context;
};

export const PlaylistProvider = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch user's playlists (owned and collaborations)
  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      setCollaborations([]);
      return;
    }
    setLoadingPlaylists(true);
    try {
      // Fetch owned
      const resOwned = await axios.get(`${API}/my`, { withCredentials: true });
      setPlaylists(resOwned.data);
      
      // Fetch collaborations
      const resCollab = await axios.get(`${API}/collaborations`, { withCredentials: true });
      setCollaborations(resCollab.data);
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [user]);

  // Load playlists when user logs in/out
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Create a new playlist
  const createPlaylist = useCallback(async (name, description = '', isPublic = false) => {
    if (!user) {
      toast.error("Please login to create playlists", { style: TOAST_STYLE });
      return null;
    }
    try {
      const { data } = await axios.post(API, { name, description, isPublic }, { withCredentials: true });
      setPlaylists(prev => [data, ...prev]);
      toast.success(`Playlist "${name}" created!`, { style: TOAST_STYLE });
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create playlist", { style: TOAST_STYLE });
      return null;
    }
  }, [user]);

  // Delete a playlist
  const deletePlaylist = useCallback(async (playlistId) => {
    try {
      await axios.delete(`${API}/${playlistId}`, { withCredentials: true });
      setPlaylists(prev => prev.filter(p => p._id !== playlistId));
      toast.success("Playlist deleted", { style: TOAST_STYLE });
    } catch (error) {
      toast.error("Failed to delete playlist", { style: TOAST_STYLE });
    }
  }, []);

  // Add a song to a playlist
  const addSongToPlaylist = useCallback(async (playlistId, songId) => {
    try {
      const { data } = await axios.post(
        `${API}/${playlistId}/songs`,
        { songId },
        { withCredentials: true }
      );
      // Update local state for both owned and collaborations
      setPlaylists(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      setCollaborations(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      toast.success("Song added to playlist!", { style: TOAST_STYLE, duration: 1500 });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add song";
      if (msg === 'Song already in playlist') {
        toast("Song already in this playlist", { icon: "⚠️", style: TOAST_STYLE, duration: 1500 });
      } else {
        toast.error(msg, { style: TOAST_STYLE });
      }
      return false;
    }
  }, []);
  
  // Add multiple songs to a playlist (Bulk)
  const addSongsToPlaylistBulk = useCallback(async (playlistId, songIds) => {
    const toastId = toast.loading(`Adding ${songIds.length} songs...`, { style: TOAST_STYLE });
    try {
      const { data } = await axios.post(
        `${API}/${playlistId}/songs-bulk`,
        { songIds },
        { withCredentials: true }
      );
      setPlaylists(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      setCollaborations(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      toast.success(`Successfully added ${songIds.length} songs!`, { id: toastId, style: TOAST_STYLE });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add songs", { id: toastId, style: TOAST_STYLE });
      return false;
    }
  }, []);

  // Remove a song from a playlist
  const removeSongFromPlaylist = useCallback(async (playlistId, songId) => {
    try {
      const { data } = await axios.delete(
        `${API}/${playlistId}/songs/${songId}`,
        { withCredentials: true }
      );
      setPlaylists(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      setCollaborations(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      toast.success("Song removed from playlist", { style: TOAST_STYLE, duration: 1500 });
    } catch (error) {
      toast.error("Failed to remove song", { style: TOAST_STYLE });
    }
  }, []);

  // Import (clone) another user's playlist
  const importPlaylist = useCallback(async (playlistId) => {
    try {
      const { data } = await axios.post(
        `${API}/${playlistId}/import`,
        {},
        { withCredentials: true }
      );
      setPlaylists(prev => [data, ...prev]);
      toast.success("Playlist imported to your library!", { style: TOAST_STYLE });
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to import playlist", { style: TOAST_STYLE });
      return null;
    }
  }, []);

  // Toggle playlist public/private
  const togglePlaylistVisibility = useCallback(async (playlistId, isPublic) => {
    try {
      const { data } = await axios.put(
        `${API}/${playlistId}`,
        { isPublic },
        { withCredentials: true }
      );
      setPlaylists(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, isPublic: data.isPublic } : p))
      );
      toast.success(isPublic ? "Playlist is now public" : "Playlist is now private", { style: TOAST_STYLE });
      return data;
    } catch (error) {
      toast.error("Failed to update playlist", { style: TOAST_STYLE });
      return null;
    }
  }, []);

  // Reorder songs in a playlist
  const reorderSongs = useCallback(async (playlistId, songIds) => {
    const toastId = toast.loading("Saving new order...", { style: TOAST_STYLE });
    try {
      const { data } = await axios.put(
        `${API}/${playlistId}/songs/reorder`,
        { songIds },
        { withCredentials: true }
      );
      // Update local state
      setPlaylists(prev =>
        prev.map(p => (p._id === playlistId ? { ...p, songs: data.songs } : p))
      );
      toast.success("Order saved!", { id: toastId, style: TOAST_STYLE });
      return true;
    } catch (error) {
      toast.error("Failed to save new order", { id: toastId, style: TOAST_STYLE });
      return false;
    }
  }, []);

  // Fetch community playlists (all public ones)
  const fetchCommunityPlaylists = useCallback(async (page = 1, search = '', sortBy = 'updatedAt') => {
    try {
      const { data } = await axios.get(`${API}/community`, {
        params: { page, search, sortBy, limit: 12 },
        withCredentials: true
      });
      return data; // returns { playlists, total, page, totalPages, hasMore }
    } catch (error) {
      console.error("Failed to fetch community playlists:", error);
      return null;
    }
  }, []);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        collaborations,
        loadingPlaylists,
        fetchPlaylists,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        addSongsToPlaylistBulk,
        removeSongFromPlaylist,
        importPlaylist,
        togglePlaylistVisibility,
        reorderSongs,
        fetchCommunityPlaylists,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export default PlaylistContext;
