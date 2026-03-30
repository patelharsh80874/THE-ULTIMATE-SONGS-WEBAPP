import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [songlink, setSonglink] = useState([]);
  const [currentIndex, setCurrentIndex] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [songsList, setSongsList] = useState([]);
  const audioRef = useRef();

  // Set the songs list for next/prev navigation and play a song
  const playSong = useCallback(
    (song, index, list) => {
      if (songlink[0]?.id === song?.id) {
        // Same song — toggle play/pause
        const audio = audioRef.current;
        if (audio) {
          if (!audio.paused) {
            audio.pause();
            setIsPlaying(false);
          } else {
            setIsPlaying(true);
            audio.play().catch((err) => console.error("Playback failed:", err));
          }
        }
      } else {
        // New song
        if (list) setSongsList(list);
        setCurrentIndex(index);
        setSonglink([song]);
      }
    },
    [songlink]
  );

  // Play a specific song from the queue by index
  const playFromQueue = useCallback(
    (index) => {
      if (index >= 0 && index < songsList.length) {
        setCurrentIndex(index);
        setSonglink([songsList[index]]);
      }
    },
    [songsList]
  );

  // Next track
  const next = useCallback(() => {
    if (songsList.length === 0) return;
    const nextIdx = currentIndex < songsList.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    setSonglink([songsList[nextIdx]]);
  }, [currentIndex, songsList]);

  // Previous track
  const previous = useCallback(() => {
    if (songsList.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : songsList.length - 1;
    setCurrentIndex(prevIdx);
    setSonglink([songsList[prevIdx]]);
  }, [currentIndex, songsList]);

  // Remove song from queue
  const removeFromQueue = useCallback(
    (index) => {
      if (songsList.length <= 1) return; // don't remove last song
      const newList = [...songsList];
      newList.splice(index, 1);
      setSongsList(newList);

      // Adjust currentIndex
      if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (index === currentIndex) {
        // If removing currently playing song, play next
        const newIdx = index < newList.length ? index : 0;
        setCurrentIndex(newIdx);
        setSonglink([newList[newIdx]]);
      }
    },
    [songsList, currentIndex]
  );

  // Move song up in queue
  const moveUp = useCallback(
    (index) => {
      if (index <= 0) return;
      const newList = [...songsList];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      setSongsList(newList);

      // Adjust currentIndex if needed
      if (currentIndex === index) setCurrentIndex(index - 1);
      else if (currentIndex === index - 1) setCurrentIndex(index);
    },
    [songsList, currentIndex]
  );

  // Move song down in queue
  const moveDown = useCallback(
    (index) => {
      if (index >= songsList.length - 1) return;
      const newList = [...songsList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setSongsList(newList);

      // Adjust currentIndex if needed
      if (currentIndex === index) setCurrentIndex(index + 1);
      else if (currentIndex === index + 1) setCurrentIndex(index);
    },
    [songsList, currentIndex]
  );

  // Reorder queue via drag-and-drop
  const reorderQueue = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const newList = [...songsList];
      const [movedItem] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedItem);
      setSongsList(newList);

      // Adjust currentIndex
      if (currentIndex === fromIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [songsList, currentIndex]
  );

  // Add a song to the end of the queue
  const addToQueue = useCallback(
    (song) => {
      if (!song) return;
      // If no songs playing yet, start playing this song
      if (songsList.length === 0) {
        setSongsList([song]);
        setCurrentIndex(0);
        setSonglink([song]);
        return true;
      }
      // Check if already in queue
      if (songsList.some((s) => s.id === song.id)) {
        return false; // duplicate
      }
      setSongsList((prev) => [...prev, song]);
      return true;
    },
    [songsList]
  );

  // Clear queue (keep only currently playing)
  const clearQueue = useCallback(() => {
    if (songlink.length > 0) {
      setSongsList([songlink[0]]);
      setCurrentIndex(0);
    }
  }, [songlink]);

  // Reset player
  const resetPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSonglink([]);
    setCurrentIndex("");
    setSongsList([]);
    setIsPlaying(false);
  }, []);

  // Media Session API
  useEffect(() => {
    if (songlink.length === 0 || !("mediaSession" in navigator)) return;

    const song = songlink[0];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song?.name || "",
      artist: song?.album?.name || "",
      artwork: [
        {
          src: song?.image?.[2]?.url || "",
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => previous());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
  }, [songlink, next, previous]);

  // Auto-play when songlink changes
  useEffect(() => {
    if (songlink.length > 0 && audioRef.current) {
      setIsPlaying(true);
      audioRef.current.play().catch((err) => console.warn("Autoplay error:", err));
    }
  }, [songlink]);

  // Update document title
  useEffect(() => {
    const title = songlink[0]?.name;
    document.title = title ? title : "THE ULTIMATE SONGS";
  }, [songlink]);

  const value = {
    songlink,
    setSonglink,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    songsList,
    setSongsList,
    audioRef,
    playSong,
    playFromQueue,
    next,
    previous,
    resetPlayer,
    removeFromQueue,
    moveUp,
    moveDown,
    reorderQueue,
    addToQueue,
    clearQueue,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
