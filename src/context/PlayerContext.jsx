import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from "react";
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
      } else {
        // No smart songs found for this specific song
        toast.error("⚠️ Smart Queue unavailable for this track (no suggestions found).", {
          style: { borderRadius: '12px', background: '#1e293b', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' },
          duration: 3500,
        });
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

  // ═══════════════════════════════════════════════════════════════════
  // BULLETPROOF iOS/Safari Media Session — Lock Screen & Background Fix
  // ═══════════════════════════════════════════════════════════════════
  //
  // iOS Safari is extremely finicky about Media Session. Key rules:
  // 1. Action handlers MUST be re-registered AFTER playback starts
  // 2. seekbackward/seekforward set to null = iOS shows DEFAULT 10s seek
  //    → We must NOT touch these at all, only register nexttrack/previoustrack
  // 3. A separate AudioContext oscillator creates a COMPETING audio session
  //    → We must NOT use Web Audio API keepalive on iOS
  // 4. Metadata + handlers must be re-applied on every song change
  // 5. playbackState must NEVER have a gap (no brief "none" state)
  // ═══════════════════════════════════════════════════════════════════

  // Ref to always access latest next/previous without re-registering handlers
  const sessionHandlersRef = useRef({ next, previous, partyRoom, isHost });
  useEffect(() => {
    sessionHandlersRef.current = { next, previous, partyRoom, isHost };
  }, [next, previous, partyRoom, isHost]);

  // --- Helper: Build MediaMetadata for a song ---
  const buildMetadata = useCallback((song) => {
    if (!song) return null;
    const imgUrl = song?.image?.[2]?.url || song?.image?.[1]?.url || song?.image?.[0]?.url || "";
    return new MediaMetadata({
      title: song?.name || song?.title || "Unknown Track",
      artist: song?.artists?.primary?.map(a => a.name).join(", ") || song?.album?.name || "Unknown Artist",
      album: song?.album?.name || "",
      artwork: [
        { src: imgUrl, sizes: "96x96", type: "image/jpeg" },
        { src: imgUrl, sizes: "128x128", type: "image/jpeg" },
        { src: imgUrl, sizes: "192x192", type: "image/jpeg" },
        { src: imgUrl, sizes: "256x256", type: "image/jpeg" },
        { src: imgUrl, sizes: "384x384", type: "image/jpeg" },
        { src: imgUrl, sizes: "512x512", type: "image/jpeg" },
      ],
    });
  }, []);

  // --- Throttled Position State Update ---
  const lastPositionUpdateRef = useRef(0);

  const updatePositionStateNow = useCallback(() => {
    if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration) || !isFinite(audio.duration)) return;
    try {
      const position = Math.min(audio.currentTime || 0, audio.duration);
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.max(0, position),
      });
      lastPositionUpdateRef.current = Date.now();
    } catch (e) {
      // Ignore position out-of-bounds errors
    }
  }, []);

  const updatePositionStateThrottled = useCallback(() => {
    if (Date.now() - lastPositionUpdateRef.current < 2000) return;
    updatePositionStateNow();
  }, [updatePositionStateNow]);

  // Ref for use inside one-time useEffect closures
  const positionStateUpdaterRef = useRef({ updatePositionStateThrottled, updatePositionStateNow });
  useEffect(() => {
    positionStateUpdaterRef.current = { updatePositionStateThrottled, updatePositionStateNow };
  }, [updatePositionStateThrottled, updatePositionStateNow]);

  // --- Core: Register ALL Media Session handlers ---
  // This is the single function that sets up the entire Media Session.
  // It MUST be called after every play event on iOS for reliability.

  // Flag to prevent keepalive heartbeat from interfering during play attempts
  const playIntentRef = useRef(false);

  const reinforceMediaSession = useCallback(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      // ── Step 1: Set metadata ──
      const song = songlink[0];
      if (song) {
        const metadata = buildMetadata(song);
        if (metadata) {
          navigator.mediaSession.metadata = metadata;
        }
      }

      // ── Step 2: Set playback state ──
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        navigator.mediaSession.playbackState = "playing";
      } else if (!playIntentRef.current) {
        // Only set paused if we're not in the middle of a play attempt
        navigator.mediaSession.playbackState = "paused";
      }

      // ── Step 3: Register action handlers ──

      navigator.mediaSession.setActionHandler("play", () => {
        const { partyRoom: pr, isHost: ih } = sessionHandlersRef.current;
        if (pr && !ih) return;
        const a = audioRef.current;
        if (!a) return;

        // IMMEDIATELY signal play intent — prevents heartbeat from overriding
        playIntentRef.current = true;
        navigator.mediaSession.playbackState = "playing";

        a.play()
          .then(() => {
            navigator.mediaSession.playbackState = "playing";
            playIntentRef.current = false;
          })
          .catch((err) => {
            console.warn("Play failed, attempting reload:", err.message);
            // iOS releases audio buffer after background pause.
            // Save position, re-load, restore position, and retry.
            const savedTime = a.currentTime || 0;
            const savedSrc = a.src;

            if (savedSrc) {
              // Force re-load by re-setting src (triggers fresh network fetch)
              a.src = savedSrc;
              a.load();

              const onCanPlay = () => {
                a.removeEventListener('canplay', onCanPlay);
                a.currentTime = savedTime;
                a.play()
                  .then(() => {
                    navigator.mediaSession.playbackState = "playing";
                    playIntentRef.current = false;
                  })
                  .catch((retryErr) => {
                    console.error("Retry play also failed:", retryErr);
                    navigator.mediaSession.playbackState = "paused";
                    playIntentRef.current = false;
                  });
              };
              a.addEventListener('canplay', onCanPlay, { once: true });

              // Timeout fallback — if canplay never fires (network issue)
              setTimeout(() => {
                playIntentRef.current = false;
              }, 5000);
            } else {
              playIntentRef.current = false;
            }
          });
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        const { partyRoom: pr, isHost: ih } = sessionHandlersRef.current;
        if (pr && !ih) return;
        playIntentRef.current = false;
        const a = audioRef.current;
        if (a) {
          a.pause();
          navigator.mediaSession.playbackState = "paused";
        }
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        const { partyRoom: pr, isHost: ih, previous: prevFn } = sessionHandlersRef.current;
        if (pr && !ih) return;
        navigator.mediaSession.playbackState = "playing";
        if (prevFn) prevFn();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        const { partyRoom: pr, isHost: ih, next: nextFn } = sessionHandlersRef.current;
        if (pr && !ih) return;
        navigator.mediaSession.playbackState = "playing";
        if (nextFn) nextFn();
      });

      // ── Step 4: Handle seekto (progress bar scrubbing on lock screen) ──
      try {
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (audioRef.current && details.seekTime != null) {
            audioRef.current.currentTime = details.seekTime;
            positionStateUpdaterRef.current.updatePositionStateNow();
          }
        });
      } catch (e) {}

      // ── Step 5: Handle stop to prevent abrupt session drops ──
      try {
        navigator.mediaSession.setActionHandler("stop", () => {
          playIntentRef.current = false;
          const a = audioRef.current;
          if (a) { a.pause(); a.currentTime = 0; }
          navigator.mediaSession.playbackState = "paused";
        });
      } catch (e) {}

      // ── Step 6: Set position state ──
      if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(audio.currentTime || 0, audio.duration),
          });
        } catch (e) {}
      }
    } catch (e) {
      console.warn("reinforceMediaSession failed:", e);
    }
  }, [songlink, buildMetadata]);

  // Keep a ref so event handlers always call the latest version
  const reinforceRef = useRef(reinforceMediaSession);
  useEffect(() => {
    reinforceRef.current = reinforceMediaSession;
  }, [reinforceMediaSession]);

  // --- Initial handler registration (once on mount) ---
  useEffect(() => {
    reinforceRef.current();
  }, []);

  // --- Re-register on EVERY song change ---
  useEffect(() => {
    if (songlink.length === 0) return;
    reinforceRef.current();
    const t1 = setTimeout(() => reinforceRef.current(), 300);
    const t2 = setTimeout(() => reinforceRef.current(), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [songlink]);

  // --- Re-register when playback actually starts (CRITICAL for iOS) ---
  const playingListenerAttached = useRef(false);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playingListenerAttached.current) return;

    playingListenerAttached.current = true;

    const onPlaying = () => {
      setTimeout(() => reinforceRef.current(), 50);
    };

    const onLoadedData = () => {
      reinforceRef.current();
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadeddata', onLoadedData);
  }, [songlink]);

  // --- Sync playbackState to MediaSession ---
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // --- Keep-alive heartbeat ---
  // Prevents iOS/Chrome from dropping the media session during paused state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !audioRef.current) return;

    if (!isPlaying) {
      // Paused: heartbeat to keep session alive
      const keepAlive = setInterval(() => {
        // CRITICAL: Don't override playbackState if a play attempt is in progress
        if (playIntentRef.current) return;

        try {
          navigator.mediaSession.playbackState = "paused";
          const audio = audioRef.current;
          if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            navigator.mediaSession.setPositionState({
              duration: audio.duration,
              playbackRate: audio.playbackRate || 1,
              position: Math.min(audio.currentTime || 0, audio.duration),
            });
          }
        } catch (e) {}
      }, 500);
      return () => clearInterval(keepAlive);
    } else {
      // Playing: periodic position sync
      const sync = setInterval(() => {
        updatePositionStateNow();
      }, 5000);
      return () => clearInterval(sync);
    }
  }, [isPlaying, updatePositionStateNow]);

  // --- Visibility Change Handler ---
  // Re-affirm everything when screen locks/unlocks or tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!("mediaSession" in navigator)) return;
      // Always reinforce on visibility change — both directions
      reinforceRef.current();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-play when songlink changes (but not when just isPlaying status changes via syncHostState)
  const lastPlayedId = useRef(null);

  useEffect(() => {
    if (songlink.length > 0 && audioRef.current) {
      const currentId = songlink[0]?.id;
      
      // Only auto-play if it's a NEW song being loaded
      if (currentId !== lastPlayedId.current) {
        lastPlayedId.current = currentId;
        setIsPlaying(true);

        // CRITICAL: Set playbackState BEFORE play() — prevents iOS "none" gap
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }

        audioRef.current.play().then(() => {
          if (isHost) syncHostState(true);
          // Reinforce session after playback starts — iOS only accepts handlers reliably here
          reinforceRef.current();
        }).catch((err) => console.warn("Autoplay error:", err));

        // Additional reinforcements at staggered intervals for iOS reliability
        const t1 = setTimeout(() => reinforceRef.current(), 100);
        const t2 = setTimeout(() => reinforceRef.current(), 500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
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
