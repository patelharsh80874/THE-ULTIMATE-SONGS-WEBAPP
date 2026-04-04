import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

export const PlayerProvider = ({ children }) => {
  const [songlink, setSonglink] = useState([]);
  const [currentIndex, setCurrentIndex] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [songsList, setSongsList] = useState([]);
  const audioRef = useRef();
  
  const { partyRoom, isHost, socket, emitPlayback } = useSocket();

  // Host: Emit playback state changes
  const syncHostState = useCallback((forceIsPlaying) => {
    if (!isHost || !partyRoom || !audioRef.current || songlink.length === 0) return;
    
    emitPlayback({
      song: songlink[0],
      isPlaying: forceIsPlaying !== undefined ? forceIsPlaying : isPlaying,
      currentTime: audioRef.current.currentTime,
      timestamp: Date.now()
    });
  }, [isHost, partyRoom, songlink, isPlaying, emitPlayback]);

  // Listen for remote playback state (for followers)
  useEffect(() => {
    if (!socket || isHost || !partyRoom) return;

    const handlePlaybackState = (data) => {
      // data: { song, isPlaying: remoteIsPlaying, currentTime, timestamp }
      const { song, isPlaying: remoteIsPlaying, currentTime, timestamp } = data;

      // Update song if it's different ID
      setSonglink(prev => {
        if (!prev[0] || String(prev[0].id) !== String(song?.id)) {
          return [song];
        }
        return prev;
      });

      // Update playing status
      setIsPlaying(remoteIsPlaying);
      
      const audio = audioRef.current;
      if (audio) {
        if (remoteIsPlaying && audio.paused) {
          audio.play().catch(() => {});
        } else if (!remoteIsPlaying && !audio.paused) {
          audio.pause();
        }

        // Calculate actual remote time considering network latency
        const latency = (Date.now() - timestamp) / 1000;
        const actualRemoteTime = currentTime + (remoteIsPlaying ? latency : 0);

        // Sync time if drift is > 1.5 seconds
        if (Math.abs(audio.currentTime - actualRemoteTime) > 1.5) {
          audio.currentTime = actualRemoteTime;
        }
      }
    };

    socket.on("playback-state", handlePlaybackState);
    return () => socket.off("playback-state", handlePlaybackState);
  }, [socket, isHost, partyRoom]);

  // Request sync on join (for followers)
  const syncJoinTime = useCallback(() => {
    if (!socket || isHost || !partyRoom) return;
    socket.emit("request-sync", partyRoom);
  }, [socket, isHost, partyRoom]);

  useEffect(() => {
    syncJoinTime();
  }, [syncJoinTime]);

  // Host: Listen for sync requests from new joiners
  useEffect(() => {
    if (!socket || !isHost || !partyRoom) return;
    const handleNeedSync = () => syncHostState();
    socket.on("need-sync", handleNeedSync);
    return () => socket.off("need-sync", handleNeedSync);
  }, [socket, isHost, partyRoom, syncHostState]);

  // Set the songs list for next/prev navigation and play a song
  const playSong = useCallback(
    (song, index, list) => {
      // If in a party and NOT the host, prevent control
      if (partyRoom && !isHost) {
        toast.error("Only the host can control playback!", {
          icon: "🎧",
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        return;
      }

      const currentSong = songlink[0];
      const isSameSong = currentSong && String(currentSong.id) === String(song?.id);

      if (isSameSong) {
        // Same song — toggle play/pause
        const audio = audioRef.current;
        if (audio) {
          if (!audio.paused) {
            audio.pause();
            // syncHostState(false) will be handled by native onPause in PlayerBar -> useEffect
          } else {
            audio.play().catch((err) => console.error("Playback failed:", err));
            // syncHostState(true) will be handled by native onPlay in PlayerBar -> useEffect
          }
        }
      } else {
        // New song
        if (list) setSongsList(list);
        setCurrentIndex(index);
        setSonglink([song]);
        setIsPlaying(true); // Optimistic UI update
      }
    },
    [songlink, isHost, partyRoom]
  );
  
  // Auto-emit when host seeks manually or periodically
  useEffect(() => {
    if (!isHost || !partyRoom || !isPlaying) return;
    
    const interval = setInterval(() => {
      syncHostState();
    }, 5000); // Sync every 5 seconds to prevent drift

    return () => clearInterval(interval);
  }, [isHost, partyRoom, isPlaying, syncHostState]);

  // Instant host sync on play/pause
  useEffect(() => {
    if (isHost && partyRoom) {
      syncHostState();
    }
  }, [isPlaying, isHost, partyRoom, syncHostState]);

  // Play a specific song from the queue by index
  const playFromQueue = useCallback(
    (index) => {
      if (partyRoom && !isHost) return;
      if (index >= 0 && index < songsList.length) {
        setCurrentIndex(index);
        setSonglink([songsList[index]]);
      }
    },
    [songsList, partyRoom, isHost]
  );

  // Next track
  const next = useCallback(() => {
    if (partyRoom && !isHost) return;
    if (songsList.length === 0) return;
    const nextIdx = currentIndex < songsList.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    setSonglink([songsList[nextIdx]]);
  }, [currentIndex, songsList, partyRoom, isHost]);

  // Previous track
  const previous = useCallback(() => {
    if (partyRoom && !isHost) return;
    if (songsList.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : songsList.length - 1;
    setCurrentIndex(prevIdx);
    setSonglink([songsList[prevIdx]]);
  }, [currentIndex, songsList, partyRoom, isHost]);

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
      if (partyRoom && !isHost) return;
      audioRef.current?.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      if (partyRoom && !isHost) return;
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (partyRoom && !isHost) return;
      previous();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (partyRoom && !isHost) return;
      next();
    });
  }, [songlink, next, previous, partyRoom, isHost]);

  // Auto-play when songlink changes (but not when just isPlaying status changes via syncHostState)
  const lastPlayedId = useRef(null);

  useEffect(() => {
    if (songlink.length > 0 && audioRef.current) {
      const currentId = songlink[0]?.id;
      
      // Only auto-play if it's a NEW song being loaded
      if (currentId !== lastPlayedId.current) {
        lastPlayedId.current = currentId;
        setIsPlaying(true);
        audioRef.current.play().then(() => {
          if (isHost) syncHostState(true);
        }).catch((err) => console.warn("Autoplay error:", err));
      }
    } else if (songlink.length === 0) {
      lastPlayedId.current = null;
    }
  }, [songlink, isHost, syncHostState]);

  // Update document title
  useEffect(() => {
    const title = songlink[0]?.name;
    document.title = title ? title : "THE ULTIMATE SONGS";
  }, [songlink]);

  // Update Listening History
  useEffect(() => {
    if (songlink.length > 0 && isPlaying) {
      const updateHistory = async () => {
        try {
          await axios.post(`${API_BASE_URL}/api/users/history`, 
            { songId: songlink[0].id },
            { withCredentials: true }
          );
        } catch (error) {
          // Silent fail if not logged in or other error
          console.log("History update skipped (not logged in?)");
        }
      };
      
      // Debounce history update: wait 5 seconds of playback before adding to history
      const timer = setTimeout(updateHistory, 5000);
      return () => clearTimeout(timer);
    }
  }, [songlink, isPlaying]);

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
    syncJoinTime,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
