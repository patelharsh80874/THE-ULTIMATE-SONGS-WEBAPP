import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLyrics } from "../services/lyricsService";
import { usePlayer } from "../context/PlayerContext";
import useLikedSongs from "../hooks/useLikedSongs";
import handleGenerateAudio from "../utils/audioUtils";
import AddToPlaylistModal from "./AddToPlaylistModal";
import toast from "react-hot-toast";

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const LyricsOverlay = ({ onClose }) => {
  const { songlink, audioRef, isPlaying, setIsPlaying, next, previous, songsList } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const overlayRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showHints, setShowHints] = useState(false);

  // Show keyboard hints on first visit
  useEffect(() => {
    const hasSeenHints = localStorage.getItem('lyrics-shortcuts-seen');
    if (!hasSeenHints) {
      setShowHints(true);
      localStorage.setItem('lyrics-shortcuts-seen', 'true');
      const timer = setTimeout(() => setShowHints(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentSong = songlink[0];

  // 1. Fetch Lyrics by Song ID
  useEffect(() => {
    const getLyrics = async () => {
      if (!currentSong?.id) return;
      setLoading(true);
      setError(null);
      setLyricsData(null);
      try {
        const data = await fetchLyrics(currentSong.id);
        setLyricsData(data);
      } catch (err) {
        setError("Could not load lyrics.");
      } finally {
        setLoading(false);
      }
    };
    getLyrics();
  }, [currentSong?.id]);

  // 2. Track Time & Layout
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use requestAnimationFrame for buttery smooth 60fps time tracking
    // (timeupdate only fires ~4 times/sec which makes the karaoke fill choppy)
    let rafId;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const updateHeight = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);

    // Track duration
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener('loadedmetadata', onMeta);
    if (audio.duration) setDuration(audio.duration);

    return () => {
      cancelAnimationFrame(rafId);
      audio.removeEventListener('loadedmetadata', onMeta);
      window.removeEventListener("resize", updateHeight);
    };
  }, [audioRef]);

  // Seek handler for progress bar
  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (audioRef.current && duration) {
      audioRef.current.currentTime = pct * duration;
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
    } else {
      a.play().catch(() => {
        const savedTime = a.currentTime || 0;
        const savedSrc = a.src;
        if (savedSrc) {
          a.src = savedSrc;
          a.load();
          a.addEventListener('canplay', () => {
            a.currentTime = savedTime;
            a.play().catch(console.error);
          }, { once: true });
        }
      });
    }
  };

  // 3. Sync Logic — find active lyric line based on current audio time
  const activeIndex = useMemo(() => {
    if (!lyricsData?.parsedSynced?.length) return -1;
    let index = -1;
    for (let i = 0; i < lyricsData.parsedSynced.length; i++) {
      if (currentTime >= lyricsData.parsedSynced[i].time) index = i;
      else break;
    }
    return index;
  }, [currentTime, lyricsData]);

  // 4. Transform Calculation — smoothly scroll active line to center
  const translateY = useMemo(() => {
    if (activeIndex === -1 || !lineRefs.current[activeIndex] || !containerHeight) return 0;
    const activeLine = lineRefs.current[activeIndex];
    return -(activeLine.offsetTop - (containerHeight / 2) + (activeLine.offsetHeight / 2));
  }, [activeIndex, containerHeight]);

  // Click on a lyric line to seek to that time
  const handleLineClick = (time) => {
    if (audioRef.current && time !== undefined) audioRef.current.currentTime = time;
  };

  // Calculate progress within the active line (for the glow bar effect)
  const lineProgress = useMemo(() => {
    if (activeIndex === -1 || !lyricsData?.parsedSynced?.[activeIndex]) return 0;
    const line = lyricsData.parsedSynced[activeIndex];
    const duration = (line.endTime || line.time + 3) - line.time;
    if (duration <= 0) return 0;
    return Math.min(1, Math.max(0, (currentTime - line.time) / duration));
  }, [currentTime, activeIndex, lyricsData]);

  // ══════ Fullscreen Toggle ══════
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      overlayRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Sync fullscreen state with browser
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ══════ Auto-hide controls in fullscreen ══════
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    if (isFullscreen) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      showControls();
    } else {
      setControlsVisible(true);
      clearTimeout(hideTimerRef.current);
    }
    return () => clearTimeout(hideTimerRef.current);
  }, [isFullscreen, showControls]);

  // ══════ Keyboard Shortcuts ══════
  useEffect(() => {
    const handleKey = (e) => {
      // Don't capture when typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previous();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
        case 'KeyF':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, next, previous, togglePlay, toggleFullscreen, onClose]);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] w-full h-full bg-slate-950/98 backdrop-blur-3xl overflow-hidden flex flex-col items-center select-none"
      onMouseMove={showControls}
      onTouchStart={showControls}
      style={{ cursor: isFullscreen && !controlsVisible ? 'none' : 'auto' }}
    >
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 z-0 opacity-25 blur-[100px] scale-150 transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${currentSong?.image?.[2]?.url})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />

      {/* Header */}
      <div 
        className={`relative z-10 w-full flex items-center justify-between px-8 py-4 sm:px-4 sm:py-3 border-b border-white/5 bg-gradient-to-b from-black/20 to-transparent transition-all duration-500 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <img src={currentSong?.image?.[1]?.url} className="w-12 h-12 rounded-xl shadow-2xl border border-white/10 sm:w-10 sm:h-10 flex-shrink-0" alt="" />
          <div className="min-w-0">
            <h2 className="text-white font-black text-lg sm:text-sm line-clamp-1">{currentSong?.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-white/40 text-sm sm:text-xs font-bold uppercase tracking-wider line-clamp-1 flex-shrink-0">
                {currentSong?.artists?.primary?.[0]?.name || "Unknown Artist"}
              </p>
              {/* Up Next with thumbnail */}
              {(() => {
                const currentIdx = songsList.findIndex(s => s.id === currentSong?.id);
                const nextSong = currentIdx >= 0 && currentIdx < songsList.length - 1 ? songsList[currentIdx + 1] : null;
                return nextSong ? (
                  <div className="hidden sm:hidden md:flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    <img src={nextSong.image?.[0]?.url} className="w-5 h-5 rounded-md object-cover" alt="" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/25">Next</span>
                    <span className="text-[10px] font-bold text-white/35 line-clamp-1 max-w-[140px]">{nextSong.name}</span>
                    <span className="text-[9px] text-white/15 font-bold line-clamp-1">{nextSong.artists?.primary?.[0]?.name}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sync badge */}
          {lyricsData?.isSynced && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400">Synced</span>
            </div>
          )}
          <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all" title="Fullscreen (F)">
            <i className={`${isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'} text-xl`}></i>
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all" title="Close (Esc)">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Content Viewport */}
      <div ref={containerRef} className="relative z-10 flex-1 w-full max-w-5xl overflow-hidden px-6 text-white">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/50 uppercase text-[10px] font-black tracking-[0.3em]"
            >
              <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
              Loading Lyrics...
            </motion.div>
          ) : error || !lyricsData ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center text-white/20 text-center flex-col gap-4"
            >
              <i className="ri-music-2-line text-6xl opacity-10" />
              <p className="font-bold uppercase tracking-[0.2em] text-sm">Lyrics not available for this track</p>
              <p className="text-white/10 text-xs max-w-xs">The lyrics for this song could not be found. Try another song.</p>
            </motion.div>
          ) : lyricsData.isSynced ? (
            /* ══════ SYNCED LYRICS VIEW ══════ */
            <motion.div
              key="synced"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: translateY }}
              transition={{ 
                opacity: { duration: 0.3 },
                y: {
                  type: "spring",
                  stiffness: 60,
                  damping: 16,
                  mass: 0.8
                }
              }}
              style={{ willChange: "transform" }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-[40vh]" /> {/* Top Offset */}
              {lyricsData.parsedSynced.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPassed = idx < activeIndex;
                return (
                  <motion.div
                    key={idx}
                    ref={el => lineRefs.current[idx] = el}
                    onClick={() => handleLineClick(line.time)}
                    animate={{ 
                      opacity: isActive ? 1 : (isPassed ? 0.25 : 0.12),
                      scale: isActive ? 1.08 : 1,
                      filter: isActive ? "blur(0px)" : (isPassed ? "blur(0.5px)" : "blur(1.5px)"),
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ willChange: "transform, opacity, filter" }}
                    className={`cursor-pointer max-w-3xl w-full px-6 py-4 rounded-2xl text-center origin-center relative transition-colors
                      ${isActive 
                        ? "text-white font-black text-4xl sm:text-2xl" 
                        : "text-white/40 font-bold text-2xl sm:text-lg hover:text-white/50"
                      }
                    `}
                  >
                    {/* Active line glow background */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-white/[0.04] pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    {/* Karaoke-style text: green fills left-to-right based on progress */}
                    {isActive ? (
                      <span
                        className="relative z-10 drop-shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                        style={{
                          backgroundImage: `linear-gradient(to right, #4ade80 ${Math.max(0, lineProgress * 100 - 4)}%, rgba(255,255,255,0.95) ${Math.min(100, lineProgress * 100 + 4)}%)`,
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {line.text}
                      </span>
                    ) : (
                      <span>{line.text}</span>
                    )}
                  </motion.div>
                );
              })}
              <div className="h-[40vh]" /> {/* Bottom Offset */}
            </motion.div>
          ) : (
            /* ══════ PLAIN LYRICS (NO SYNC) VIEW ══════ */
            <motion.div 
              key="plain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-y-auto no-scrollbar py-20 flex flex-col items-center gap-6"
            >
              <div className="text-[10px] font-black tracking-[0.4em] text-amber-500/50 uppercase border border-amber-500/20 px-4 py-2 rounded-full mb-6">
                Static Lyrics
              </div>
              <div className="text-white/60 text-2xl sm:text-lg font-bold leading-relaxed text-center whitespace-pre-wrap max-w-2xl px-6">
                {lyricsData.plainLyrics}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════ Mini Player Controls ══════ */}
      <div className={`relative z-10 w-full px-6 pb-5 pt-2 sm:px-4 sm:pb-4 transition-all duration-500 ${
        controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-3">
          <div
            className="w-full h-2 sm:h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-none"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-500/40 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
            />
          </div>
          {/* Time + Line Counter */}
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[10px] font-bold text-white/30 tabular-nums">{formatTime(currentTime)}</span>
            {lyricsData?.isSynced && lyricsData.parsedSynced.length > 0 && (
              <span className="text-[9px] font-black text-white/15 uppercase tracking-widest">
                {activeIndex >= 0 ? activeIndex + 1 : '–'} / {lyricsData.parsedSynced.length} lines
              </span>
            )}
            <span className="text-[10px] font-bold text-white/30 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          {/* Left — Smart Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentSong && toggleLike(currentSong)}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
                isLiked(currentSong?.id)
                  ? 'text-red-500 bg-red-500/10 border-red-500/20'
                  : 'text-white/40 hover:text-white bg-white/[0.03] border-white/[0.06] hover:bg-white/10 hover:border-white/10'
              }`}
              title="Like"
            >
              <i className={`${isLiked(currentSong?.id) ? 'ri-heart-3-fill' : 'ri-heart-3-line'} text-lg`}></i>
            </button>
            <button
              onClick={() => setShowPlaylistModal(true)}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
              title="Add to Playlist"
            >
              <i className="ri-play-list-add-line text-lg"></i>
            </button>
          </div>

          {/* Center — Playback Controls */}
          <div className="flex items-center gap-4 sm:gap-3">
            <button
              onClick={previous}
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
              title="Previous (←)"
            >
              <i className="ri-skip-back-fill text-xl"></i>
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-b from-white to-white/90 flex items-center justify-center text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
              title={`${isPlaying ? 'Pause' : 'Play'} (Space)`}
            >
              <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-2xl sm:text-xl ${!isPlaying ? 'ml-0.5' : ''}`}></i>
            </button>
            <button
              onClick={next}
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
              title="Next (→)"
            >
              <i className="ri-skip-forward-fill text-xl"></i>
            </button>
          </div>

          {/* Right — Copy, Share, Download */}
          <div className="flex items-center gap-2">
            {/* Copy Lyrics */}
            <button
              onClick={() => {
                if (lyricsData?.plainLyrics) {
                  navigator.clipboard.writeText(lyricsData.plainLyrics);
                  toast.success('Lyrics copied!', {
                    style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                  });
                }
              }}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
                lyricsData?.plainLyrics
                  ? 'text-white/40 hover:text-white bg-white/[0.03] border-white/[0.06] hover:bg-white/10 hover:border-white/10'
                  : 'text-white/15 bg-white/[0.01] border-white/[0.03] cursor-not-allowed'
              }`}
              disabled={!lyricsData?.plainLyrics}
              title="Copy Lyrics"
            >
              <i className="ri-file-copy-line text-lg"></i>
            </button>

            {/* Download */}
            <button
              onClick={() => {
                if (currentSong) {
                  handleGenerateAudio({
                    audioUrl: currentSong.downloadUrl?.[4]?.url || currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1]?.url,
                    imageUrl: currentSong.image?.[2]?.url,
                    songName: currentSong.name,
                    year: currentSong.year,
                    album: currentSong.album?.name,
                    artist: currentSong.artists?.primary?.[0]?.name,
                  });
                }
              }}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white bg-white/[0.03] border border-white/[0.06] hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
              title="Download"
            >
              <i className="ri-download-2-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center mt-3 opacity-15 pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white">Powered by The Ultimate Songs</span>
        </div>
      </div>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <AddToPlaylistModal
          songs={currentSong}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}

      {/* Keyboard Hints Overlay */}
      <AnimatePresence>
        {showHints && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowHints(false)}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer"
          >
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 text-center mb-3">Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {[
                ['Space', 'Play / Pause'],
                ['←', 'Previous Song'],
                ['→', 'Next Song'],
                ['Esc', 'Close / Exit'],
                ['F', 'Fullscreen'],
                ['F11', 'Fullscreen'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <kbd className="min-w-[36px] px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-bold text-white/60 text-center">{key}</kbd>
                  <span className="text-[11px] text-white/40 font-medium whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-white/15 text-center mt-3 uppercase tracking-wider">Click to dismiss</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LyricsOverlay;
