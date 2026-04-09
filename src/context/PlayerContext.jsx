import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { buildSmartQueueForSong } from "../services/api";

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

export const PlayerProvider = ({ children }) => {
  const [songlink, setSonglink] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasRadioQueue, setHasRadioQueue] = useState(false);
  const [stationId, setStationId] = useState(null);
  const [currentRadioPage, setCurrentRadioPage] = useState(1);
  const [loadingMoreRadio, setLoadingMoreRadio] = useState(false);

  // Smart Queue state — persisted in localStorage so setting survives refresh
  const [smartQueueEnabled, setSmartQueueEnabled] = useState(() => {
    try { return localStorage.getItem('smartQueueEnabled') === 'true'; }
    catch { return false; }
  });
  const [smartQueueLoading, setSmartQueueLoading] = useState(false);

  // Persist smartQueueEnabled to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('smartQueueEnabled', String(smartQueueEnabled)); }
    catch {}
  }, [smartQueueEnabled]);

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

  // Build smart queue in background when a new song is played
  const triggerSmartQueue = useCallback(async (song, currentList, playedIndex, isRadioExplicit = false) => {
    // Skip if smart queue is off, no song, or user is explicitly playing a radio
    if (!smartQueueEnabled || !song?.id || isRadioExplicit) return;
    setSmartQueueLoading(true);
    try {
      const smartSongs = await buildSmartQueueForSong(song.id);
      if (smartSongs && smartSongs.length > 0) {
        // We want Smart Queue to take over immediately after the currently played song.
        // So we truncate the existing list at playedIndex + 1.
        const baseList = (currentList || []).slice(0, playedIndex + 1);
        
        // Filter out songs that are already in the base list
        const existingIds = new Set(baseList.map(s => s.id));
        const newSongs = smartSongs.filter(s => !existingIds.has(s.id));
        
        if (newSongs.length > 0) {
          setSongsList(prev => {
            // Also truncate 'prev' in case it updated in the meantime
            const safePrev = prev.slice(0, playedIndex + 1);
            const prevIds = new Set(safePrev.map(s => s.id));
            const filtered = newSongs.filter(s => !prevIds.has(s.id));
            return [...safePrev, ...filtered];
          });
          toast.success(`✨ Smart Queue: ${newSongs.length} songs taking over!`, {
            style: { borderRadius: '12px', background: '#1e293b', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' },
            duration: 2500,
          });
        }
      }
    } catch (e) {
      // Silent fail — existing queue stays intact
      console.warn('[SmartQueue] Background build failed, using existing queue.', e);
    } finally {
      setSmartQueueLoading(false);
    }
  }, [smartQueueEnabled]);

  const playSong = useCallback(
    (song, index, list, isRadioExplicit = false) => {
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
          } else {
            audio.play().catch((err) => console.error("Playback failed:", err));
          }
        }
      } else {
        // New song — set it and trigger smart queue build in background
        const newList = list || [];
        
        // If it's a normal playback explicitly, turn off radio mode globally
        // so it doesn't pollute the new queue
        if (!isRadioExplicit) {
           setHasRadioQueue(false);
           setStationId(null);
        }
        
        // If Smart Queue is taking over, we truncate the playlist UI instantly as well
        if (smartQueueEnabled && !isRadioExplicit) {
           if (list) setSongsList(newList.slice(0, index + 1));
        } else {
           if (list) setSongsList(newList);
        }
        
        setCurrentIndex(index);
        setSonglink([song]);
        setIsPlaying(true); // Optimistic UI update
        // Fire smart queue in background (non-blocking)
        triggerSmartQueue(song, newList, index, isRadioExplicit);
      }
    },
    [songlink, isHost, partyRoom, triggerSmartQueue]
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
  const next = useCallback(async () => {
    if (partyRoom && !isHost) return;
    if (songsList.length === 0) return;

    if (currentIndex < songsList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSonglink([songsList[nextIdx]]);
      
      // Infinite radio: preemptively fetch when 3 songs away
      if (hasRadioQueue && stationId && !loadingMoreRadio && nextIdx >= songsList.length - 3) {
        setLoadingMoreRadio(true);
        try {
          const nextPage = currentRadioPage + 1;
          const { getSongsByStationId } = await import("../services/api");
          const newSongsRes = await getSongsByStationId(stationId, 20, nextPage);
          if (newSongsRes && newSongsRes.data && newSongsRes.data.length > 0) {
             setSongsList(prev => [...prev, ...newSongsRes.data]);
             setCurrentRadioPage(nextPage);
          }
        } catch (error) {
          console.error("Failed to fetch more radio songs", error);
        } finally {
          setLoadingMoreRadio(false);
        }
      }
    } else {
      // Reached the end
      if (hasRadioQueue && stationId) {
        setLoadingMoreRadio(true);
        try {
          const nextPage = currentRadioPage + 1;
          const { getSongsByStationId } = await import("../services/api");
          const newSongsRes = await getSongsByStationId(stationId, 20, nextPage);
          if (newSongsRes && newSongsRes.data && newSongsRes.data.length > 0) {
             const newSongs = newSongsRes.data;
             setSongsList(prev => [...prev, ...newSongs]);
             setCurrentRadioPage(nextPage);
             const nextIdx = currentIndex + 1;
             setCurrentIndex(nextIdx);
             setSonglink([newSongs[0]]);
          } else {
             setCurrentIndex(0);
             setSonglink([songsList[0]]);
          }
        } catch (error) {
           setCurrentIndex(0);
           setSonglink([songsList[0]]);
        } finally {
          setLoadingMoreRadio(false);
        }
      } else {
        // Loop back
        setCurrentIndex(0);
        setSonglink([songsList[0]]);
      }
    }
  }, [currentIndex, songsList, partyRoom, isHost, hasRadioQueue, stationId, currentRadioPage, loadingMoreRadio]);

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

  // Store latest context details in a ref to avoid recreating MediaSession handlers,
  // which causes iOS/Safari to drop the Lock Screen controls!
  const sessionHandlersRef = useRef({ next, previous, partyRoom, isHost });
  useEffect(() => {
    sessionHandlersRef.current = { next, previous, partyRoom, isHost };
  }, [next, previous, partyRoom, isHost]);

  // Register Media Session Action Handlers EXACTLY ONCE
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        const { partyRoom: pr, isHost: ih } = sessionHandlersRef.current;
        if (pr && !ih) return;
        audioRef.current?.play().catch(console.error);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        const { partyRoom: pr, isHost: ih } = sessionHandlersRef.current;
        if (pr && !ih) return;
        audioRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        const { partyRoom: pr, isHost: ih, previous: prevFn } = sessionHandlersRef.current;
        if (pr && !ih) return;
        if (prevFn) prevFn();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        const { partyRoom: pr, isHost: ih, next: nextFn } = sessionHandlersRef.current;
        if (pr && !ih) return;
        if (nextFn) nextFn();
      });
    } catch (e) {
      console.warn("MediaSession action handler registration failed:", e);
    }
  }, []);

  // Update Media Session Metadata ONLY when song changes
  useEffect(() => {
    if (songlink.length === 0 || !("mediaSession" in navigator)) return;

    const song = songlink[0];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song?.name || song?.title || "Unknown Track",
        artist: song?.artists?.primary?.map(a => a.name).join(", ") || song?.album?.name || "Unknown Artist",
        artwork: [
          {
            src: song?.image?.[2]?.url || song?.image?.[1]?.url || song?.image?.[0]?.url || "",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      });
    } catch (e) {
      console.warn("MediaSession metadata update failed:", e);
    }
  }, [songlink]);

  // Sync actual Playback State to MediaSession to prevent lockscreen drop
  // Browsers aggressively kill background processes unless they are given explicit states.
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // Keep-alive heartbeat for paused state (Prevents Chrome/Windows from dropping session)
  // When paused, we continuously ping the position state so the OS knows the tab hasn't "abandoned" the session.
  useEffect(() => {
    if (!isPlaying && "mediaSession" in navigator && audioRef.current) {
      const keepAliveInterval = setInterval(() => {
        try {
          if (navigator.mediaSession.playbackState === "paused") {
            navigator.mediaSession.setPositionState({
              duration: audioRef.current.duration || 0,
              playbackRate: audioRef.current.playbackRate || 1,
              position: audioRef.current.currentTime || 0
            });
          }
        } catch (e) {
          // Ignore
        }
      }, 800); // Heartbeat every 0.8 seconds keeps OS awake for this session

      return () => clearInterval(keepAliveInterval);
    }
  }, [isPlaying]);

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
    hasRadioQueue,
    setHasRadioQueue,
    stationId,
    setStationId,
    setCurrentRadioPage,
    syncJoinTime,
    // Smart Queue
    smartQueueEnabled,
    setSmartQueueEnabled,
    smartQueueLoading,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
