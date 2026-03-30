import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "likeData";
const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };

const LikedSongsContext = createContext(null);

export const LikedSongsProvider = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState([]);

  // Load liked songs from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      setLikedSongs(JSON.parse(data));
    }
  }, []);

  // Check if a song is liked
  const isLiked = useCallback(
    (songId) => likedSongs.some((item) => item.id === songId),
    [likedSongs]
  );

  // Toggle like/unlike a song
  const toggleLike = useCallback(
    (song) => {
      const exists = likedSongs.some((item) => item.id === song.id);

      if (!exists) {
        const updated = [...likedSongs, song];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setLikedSongs(updated);
        toast(`Song (${song?.name}) added to Likes section`, {
          icon: "✅",
          duration: 1500,
          style: TOAST_STYLE,
        });
      } else {
        const updated = likedSongs.filter((item) => item.id !== song.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setLikedSongs(updated);
        toast(`Song (${song?.name}) removed successfully.`, {
          icon: "⚠️",
          duration: 1500,
          style: TOAST_STYLE,
        });
      }
    },
    [likedSongs]
  );

  // Remove a song by id (used in Likes page)
  const removeSong = useCallback(
    (songId) => {
      const song = likedSongs.find((item) => item.id === songId);
      const updated = likedSongs.filter((item) => item.id !== songId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setLikedSongs(updated);
      if (song) {
        toast(`Song removed successfully.`, {
          icon: "✅",
          duration: 1500,
          style: TOAST_STYLE,
        });
      } else {
        toast.error("Song not found in localStorage.");
      }
    },
    [likedSongs]
  );

  // Reload from localStorage (used after import)
  const loadLikedSongs = useCallback(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      setLikedSongs(JSON.parse(data));
    } else {
      setLikedSongs([]);
    }
  }, []);

  return (
    <LikedSongsContext.Provider
      value={{ likedSongs, isLiked, toggleLike, removeSong, loadLikedSongs }}
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
