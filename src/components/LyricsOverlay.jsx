import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLyrics } from "../services/lyricsService";
import { usePlayer } from "../context/PlayerContext";
import Loading from "./Loading";

const LyricsOverlay = ({ onClose }) => {
  const { songlink, audioRef, isPlaying } = usePlayer();
  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const [containerHeight, setContainerHeight] = useState(0);

  const currentSong = songlink[0];

  // 1. Fetch Lyrics
  useEffect(() => {
    const getLyrics = async () => {
      if (!currentSong) return;
      setLoading(true);
      setError(null);
      try {
        const artist = currentSong.artists?.primary?.[0]?.name || currentSong.album?.name || "Unknown";
        const title = currentSong.name;
        const duration = currentSong.duration;
        const data = await fetchLyrics(artist, title, duration);
        setLyricsData(data);
      } catch (err) {
        setError("Could not load lyrics.");
      } finally {
        setLoading(false);
      }
    };
    getLyrics();
  }, [currentSong]);

  // 2. Track Time & Layout
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener("timeupdate", updateTime);

    const updateHeight = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      window.removeEventListener("resize", updateHeight);
    };
  }, [audioRef]);

  // 3. Sync Logic
  const activeIndex = useMemo(() => {
    if (!lyricsData?.parsedSynced) return -1;
    let index = -1;
    for (let i = 0; i < lyricsData.parsedSynced.length; i++) {
      if (currentTime >= lyricsData.parsedSynced[i].time) index = i;
      else break;
    }
    return index;
  }, [currentTime, lyricsData]);

  // 4. Transform Calculation
  const translateY = useMemo(() => {
    if (activeIndex === -1 || !lineRefs.current[activeIndex] || !containerHeight) return 0;
    const activeLine = lineRefs.current[activeIndex];
    // Center = -(Line OffsetTop - Half Container Height + Half Line Height)
    return -(activeLine.offsetTop - (containerHeight / 2) + (activeLine.offsetHeight / 2));
  }, [activeIndex, containerHeight]);

  const handleLineClick = (time) => {
    if (audioRef.current && time !== undefined) audioRef.current.currentTime = time;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] w-full h-full bg-slate-950/98 backdrop-blur-3xl overflow-hidden flex flex-col items-center select-none"
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
      <div className="relative z-10 w-full flex items-center justify-between px-8 py-6 sm:px-4 border-b border-white/5 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <img src={currentSong?.image?.[1]?.url} className="w-12 h-12 rounded-xl shadow-2xl border border-white/10 sm:w-10 sm:h-10" alt="" />
          <div>
            <h2 className="text-white font-black text-lg sm:text-sm line-clamp-1">{currentSong?.name}</h2>
            <p className="text-white/40 text-sm sm:text-xs font-bold uppercase tracking-wider line-clamp-1">
              {currentSong?.artists?.primary?.[0]?.name || "Unknown Artist"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all">
          <i className="ri-close-line text-2xl"></i>
        </button>
      </div>

      {/* Content Viewport */}
      <div ref={containerRef} className="relative z-10 flex-1 w-full max-w-5xl overflow-hidden px-6 text-white">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="l" className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/50 uppercase text-[10px] font-black tracking-[0.3em]">
              <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
              Loading Sync...
            </motion.div>
          ) : error || !lyricsData ? (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-center flex-col gap-4">
              <i className="ri-music-2-line text-6xl opacity-10" />
              <p className="font-bold uppercase tracking-[0.2em] text-sm">Lyrics not synced for this track</p>
            </div>
          ) : lyricsData.isSynced ? (
            <motion.div
              animate={{ y: translateY }}
              transition={{ 
                type: "spring",
                stiffness: 70,
                damping: 18,
                mass: 0.8
              }}
              style={{ willChange: "transform" }}
              className="flex flex-col items-center gap-2"
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
                      opacity: isActive ? 1 : (isPassed ? 0.3 : 0.15),
                      scale: isActive ? 1.15 : 1,
                      filter: isActive ? "blur(0px)" : "blur(1px)",
                      y: isActive ? 0 : (isPassed ? -5 : 5)
                    }}
                    transition={{ duration: 0.5 }}
                    style={{ willChange: "transform, opacity, filter" }}
                    className={`cursor-pointer max-w-2xl px-8 py-5 rounded-3xl transition-all text-center origin-center
                      ${isActive ? "text-white font-black text-5xl sm:text-2xl drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" : "text-white/40 font-bold text-3xl sm:text-xl hover:text-white/60"}
                    `}
                  >
                    {line.text}
                  </motion.div>
                );
              })}
              <div className="h-[40vh]" /> {/* Bottom Offset */}
            </motion.div>
          ) : (
            <div className="w-full h-full overflow-y-auto no-scrollbar py-20 flex flex-col items-center gap-6">
               <div className="text-[10px] font-black tracking-[0.4em] text-amber-500/50 uppercase border border-amber-500/20 px-4 py-2 rounded-full mb-10">Static View</div>
               <div className="text-white/60 text-2xl sm:text-lg font-bold leading-relaxed text-center whitespace-pre-wrap max-w-2xl px-6">
                {lyricsData.plainLyrics}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full pb-8 pt-4 flex flex-col items-center gap-1 opacity-20 pointer-events-none">
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Supported by LRCLIB</div>
      </div>
    </motion.div>
  );
};

export default LyricsOverlay;
