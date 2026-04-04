import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config/api";


const STORAGE_KEY = "likeData";
const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };

const LikedSongsContext = createContext(null);

export const LikedSongsProvider = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const { user } = useContext(AuthContext); // Get auth state

  // Real-time backend sync explicitly called
  const loadLikedSongs = useCallback(async () => {
    if (user) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/users/likes`, { withCredentials: true });

        if (data && Array.isArray(data) && data.length > 0) {
          const idsString = data.join(',');
          const saavnRes = await axios.get(`https://jiosaavn-roan.vercel.app/api/songs?ids=${idsString}`);
          setLikedSongs(saavnRes.data.data || []);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saavnRes.data.data || []));
        } else {
          setLikedSongs([]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [user]);

  // Load liked songs from backend if user exists, else clear
  useEffect(() => {
    loadLikedSongs();
  }, [user, loadLikedSongs]);

  // Check if a song is liked
  const isLiked = useCallback(
    (songId) => likedSongs.some((item) => item.id === songId),
    [likedSongs]
  );

  // Toggle like/unlike a song leveraging the backend
  const toggleLike = useCallback(
    async (song) => {
      if (!user) {
        toast.error("Please login to save your liked songs", {
          style: TOAST_STYLE,
        });
        return;
      }

      const exists = likedSongs.some((item) => item.id === song.id);

      try {
        if (!exists) {
          // Optimistic UI update
          const updated = [...likedSongs, song];
          setLikedSongs(updated);
          
          await axios.post(`${API_BASE_URL}/api/users/likes`, { id: song.id }, { withCredentials: true });

          toast(`Song (${song?.name}) added to your Cloud Likes`, {
            icon: "✅",
            duration: 1500,
            style: TOAST_STYLE,
          });
        } else {
          // Optimistic UI update
          const updated = likedSongs.filter((item) => item.id !== song.id);
          setLikedSongs(updated);
          
          await axios.delete(`${API_BASE_URL}/api/users/likes/${song.id}`, { withCredentials: true });

          toast(`Song (${song?.name}) removed from Cloud Likes`, {
            icon: "⚠️",
            duration: 1500,
            style: TOAST_STYLE,
          });
        }
      } catch (error) {
        console.error("Like toggle failed", error);
        toast.error("Failed to sync with cloud. Try again.");
      }
    },
    [likedSongs, user]
  );

  // Remove a song by id (used in Likes page)
  const removeSong = useCallback(
    async (songId) => {
      if (!user) return;
      try {
        const song = likedSongs.find((item) => item.id === songId);
        const updated = likedSongs.filter((item) => item.id !== songId);
        setLikedSongs(updated);
        
        await axios.delete(`${API_BASE_URL}/api/users/likes/${songId}`, { withCredentials: true });

        if (song) {
          toast(`Song removed successfully.`, {
            icon: "✅",
            duration: 1500,
            style: TOAST_STYLE,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove song from cloud");
      }
    },
    [likedSongs, user]
  );

  const removeSongsBulk = useCallback(
    async (songIds) => {
      if (!user || !Array.isArray(songIds) || songIds.length === 0) return;
      try {
        const updated = likedSongs.filter((item) => !songIds.includes(item.id));
        setLikedSongs(updated);
        
        await axios.delete(`${API_BASE_URL}/api/users/likes-bulk`, { 
          data: { songIds }, 
          withCredentials: true 
        });

        toast(`${songIds.length} songs removed from favorites.`, {
          icon: "✅",
          duration: 1500,
          style: TOAST_STYLE,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to sync some unlikes with cloud");
        loadLikedSongs();
      }
    },
    [likedSongs, user, loadLikedSongs]
  );

  const importLikes = useCallback(async (songIds) => {
    if (user && songIds.length > 0) {
      try {
        await axios.post(`${API_BASE_URL}/api/users/likes/import`, { songIds }, { withCredentials: true });

        toast.success(`Playlist Imported Successfully! Syncing to backend...`, {
          style: TOAST_STYLE
        });

        // Re-fetch to merge cleanly in state
        await loadLikedSongs();
        return true;
      } catch (error) {
        console.error("Import failed:", error);
        toast.error("Failed to import playlist", { style: TOAST_STYLE });
        return false;
      }
    }
  }, [user, loadLikedSongs]);

  // Reorder liked songs
  const reorderLikes = useCallback(async (newOrderedSongs) => {
    if (!user) return;
    const toastId = toast.loading("Syncing likes order...", { style: TOAST_STYLE });
    try {
      const songIds = newOrderedSongs.map(s => s.id);
      setLikedSongs(newOrderedSongs); // Optimistic UI update
      
      await axios.put(`${API_BASE_URL}/api/users/likes/reorder`, { songIds }, { withCredentials: true });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrderedSongs));
      toast.success("Likes reordered!", { id: toastId, style: TOAST_STYLE });
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync new order", { id: toastId, style: TOAST_STYLE });
      // Re-fetch to revert to server state
      loadLikedSongs();
    }
  }, [user, loadLikedSongs]);

  return (
    <LikedSongsContext.Provider
      value={{ likedSongs, isLiked, toggleLike, removeSong, removeSongsBulk, loadLikedSongs, importLikes, reorderLikes }}
    >
      {children}
    </LikedSongsContext.Provider>
  );
};

// Hook to consume the context
const useLikedSongs = () => {
  const context = useContext(LikedSongsContext);
  if (!context) {
    throw new Error("useLikedSongs must be used within a LikedSongsProvider");
  }
  return context;
};

export default useLikedSongs;
