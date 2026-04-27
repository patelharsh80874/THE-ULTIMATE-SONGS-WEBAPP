import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import { usePlayer } from "../context/PlayerContext";
import useLikedSongs from "../hooks/useLikedSongs";
import handleGenerateAudio from "../utils/audioUtils";
import handleGenerateAudio2 from "../utils/audioUtils2";
import Queue from "./Queue";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";
import PartyDashboard from "./PartyDashboard";
import { useSocket } from "../context/SocketContext";
import LyricsOverlay from "./LyricsOverlay";

const PlayerBar = () => {
  const navigate = useNavigate();
  const {
    songlink,
    currentIndex,
    isPlaying,
    setIsPlaying,
    audioRef,
    next,
    previous,
    songsList,
    syncJoinTime,
  } = usePlayer();

  const { isLiked, toggleLike } = useLikedSongs();
  const { partyRoom, participants, isHost, isSocketSupported } = useSocket();
  const [showQueue, setShowQueue] = useState(false);
  const [showParty, setShowParty] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);
  
  // Custom Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error("Playback failed:", err));
      }
    }
  };

  // Throttled position state update — iOS thrashes if called on every timeupdate (~4x/sec)
  const lastPosUpdate = useRef(0);
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      
      // Throttle MediaSession position updates to once every 2 seconds
      // PlayerContext handles the aggressive heartbeat for paused state
      const now = Date.now();
      if (now - lastPosUpdate.current >= 2000) {
        lastPosUpdate.current = now;
        if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
          try {
            const dur = audioRef.current.duration;
            if (dur && !isNaN(dur) && isFinite(dur)) {
              navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: audioRef.current.playbackRate || 1,
                position: Math.min(audioRef.current.currentTime || 0, dur),
              });
            }
          } catch (e) {
            // Ignore if position out of bounds error
          }
        }
      }
    }
  };

  const handleSeek = (e) => {
    if (partyRoom && !isHost) return;
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (partyRoom && !isHost) {
      setShowQueue(false);
    }
  }, [partyRoom, isHost]);

  const handlePartyToggle = () => {
    if (!isSocketSupported) {
      toast.error("Listening Party is currently unavailable on Vercel due to platform limitations.", {
        icon: '⚠️',
        duration: 4000
      });
      return;
    }
    setShowParty(true);
  };

  if (songlink.length === 0) return null;

  return (
    <>
      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && <Queue onClose={() => setShowQueue(false)} />}
      </AnimatePresence>

      {/* Party Dashboard */}
      <AnimatePresence>
        {showParty && <PartyDashboard onClose={() => setShowParty(false)} />}
      </AnimatePresence>

      {/* Lyrics Overlay */}
      <AnimatePresence>
        {showLyrics && <LyricsOverlay onClose={() => setShowLyrics(false)} />}
      </AnimatePresence>

      {/* ═══ PERSISTENT AUDIO ELEMENT ═══
           This MUST live outside the songlink.map() loop.
           Inside the map, the key={e?.id} changes on every song,
           causing React to DESTROY and RECREATE the audio element.
           That instantly kills the iOS Media Session.
           By placing it here, the audio element is NEVER unmounted. */}
      <audio
        ref={audioRef}
        onPause={() => setIsPlaying(false)}
        onPlay={() => {
          setIsPlaying(true);
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(ev) => {
          handleTimeUpdate();
          if (partyRoom && !isHost) syncJoinTime();
          if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
            try {
              const dur = ev.target.duration;
              if (dur && !isNaN(dur) && isFinite(dur)) {
                navigator.mediaSession.setPositionState({
                  duration: dur,
                  playbackRate: 1,
                  position: 0,
                });
              }
            } catch (e) {}
          }
        }}
        autoPlay
        playsInline
        webkit-playsinline="true"
        preload="auto"
        onEnded={next}
        src={songlink[0]?.downloadUrl?.[4]?.url}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ ease: Circ.easeOut, duration: 0.5 }}
        className="fixed z-[99] bottom-0 left-0 right-0 w-full h-24 sm:h-auto bg-slate-900/98 backdrop-blur-3xl border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] flex items-center px-6 sm:px-3 sm:py-3 sm:pb-4 sm:flex-col sm:justify-start"
      >
        {songlink.map((e, i) => (
          <div key={e?.id || i} className="w-full h-full sm:h-auto flex sm:flex-col items-center justify-between gap-4 sm:gap-2">
            
            {/* 1. Left Layout: Song info + Like/Playlist */}
            <div className="flex items-center justify-between w-[30%] min-w-[280px] sm:w-full sm:min-w-0">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div 
                  onClick={() => navigate(`/songs/details/${e.id}`)}
                  className="relative group/img cursor-pointer flex-shrink-0"
                >
                  <Tooltip text="View Song Details" position="bottom">
                    <img
                      className="w-14 h-14 sm:w-12 sm:h-12 rounded-md object-cover shadow-lg border border-white/10 group-hover/img:brightness-75 transition-all"
                      src={e?.image?.[2]?.url || e?.image?.[1]?.url}
                      alt={e?.name}
                    />
                  </Tooltip>
                  {(isPlaying || partyRoom) && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 ${partyRoom ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-green-500'} rounded-full border-2 border-slate-900 animate-pulse`}></div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <Tooltip text="View Song Details" position="bottom">
                    <h3 
                      onClick={() => navigate(`/songs/details/${e.id}`)}
                      className="text-white text-sm sm:text-xs font-bold truncate hover:underline cursor-pointer"
                    >
                      {e?.name}
                    </h3>
                  </Tooltip>
                  <p className="text-zinc-400 text-xs truncate">
                    {e?.artists?.primary?.map(a => a.name).join(", ") || e?.album?.name}
                  </p>
                </div>
              </div>

              {/* Like and Add to Playlist */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                <Tooltip text={isLiked(e?.id) ? "Unlike" : "Like"}>
                  <button
                    onClick={() => toggleLike(e)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isLiked(e?.id) ? "text-red-500 hover:scale-110" : "text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <i className={`text-xl ${isLiked(e?.id) ? "ri-heart-3-fill" : "ri-heart-3-line"}`}></i>
                  </button>
                </Tooltip>
                <Tooltip text="Add to Playlist">
                  <button
                    onClick={() => setPlaylistModalSong(e)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-purple-400 hover:bg-white/10 transition-all"
                  >
                    <i className="ri-folder-add-line text-xl"></i>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* 2. Center Layout: Custom Audio Controls */}
            <div className="flex flex-col items-center justify-center flex-1 w-[40%] max-w-2xl px-4 sm:px-0 gap-1 sm:w-full">
              {/* Playback Buttons */}
              <div className="flex items-center justify-center gap-6 sm:gap-5 mt-1 sm:mt-0">
                <Tooltip text={partyRoom && !isHost ? "Only the host can skip" : "Previous Song"}>
                  <button
                    onClick={previous}
                    disabled={partyRoom && !isHost}
                    className={`transition-all ${
                      partyRoom && !isHost ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <i className="ri-skip-back-fill text-2xl"></i>
                  </button>
                </Tooltip>
                
                {/* Play/Pause */}
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  <i className={`text-xl ${isPlaying ? 'ri-pause-fill' : 'ri-play-fill ml-0.5'}`}></i>
                </button>

                <Tooltip text={partyRoom && !isHost ? "Only the host can skip" : "Next Song"}>
                  <button
                    onClick={next}
                    disabled={partyRoom && !isHost}
                    className={`transition-all ${
                      partyRoom && !isHost ? "text-zinc-600 cursor-not-allowed" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <i className="ri-skip-forward-fill text-2xl"></i>
                  </button>
                </Tooltip>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center w-full gap-3 group relative px-2 sm:px-0">
                <span className="text-[10px] text-zinc-400 font-medium w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
                
                <div className="relative flex-1 h-2 flex items-center cursor-pointer">
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeek}
                    disabled={partyRoom && !isHost}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {/* Track BG */}
                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    {/* Track Fill */}
                    <div 
                      className={`h-full transition-none ${isPlaying ? 'bg-green-500' : 'bg-green-600/70'}`} 
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    ></div>
                  </div>
                  {/* Thumb */}
                  <div 
                    className="absolute h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity z-0 pointer-events-none" 
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
                  ></div>
                </div>

                <span className="text-[10px] text-zinc-400 font-medium w-8 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            {/* 3. Right Layout: Actions (Desktop) */}
            <div className="flex items-center justify-end gap-2 w-[30%] min-w-[220px] sm:hidden">
              <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
              
              {/* Listening Party Toggle */}
              <Tooltip text={!isSocketSupported ? "Listening Party is Unavailable on Vercel" : partyRoom ? "Manage Listening Party" : "Start Listening Party"}>
                <button
                  onClick={handlePartyToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all relative ${
                    partyRoom
                      ? "bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                      : isSocketSupported 
                        ? "bg-slate-800 text-zinc-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                        : "bg-zinc-900/50 text-zinc-600 border border-white/5 cursor-not-allowed opacity-60"
                  }`}
                >
                  <i className={`text-sm ${partyRoom ? 'ri-team-fill' : 'ri-team-line'}`}></i>
                  {partyRoom && <span className="text-[10px] font-black uppercase tracking-tighter">{participants.length} LIVE</span>}
                </button>
              </Tooltip>

              <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
              
              {/* Lyrics Toggle */}
              <Tooltip text="View Lyrics">
                <button
                  onClick={() => setShowLyrics(true)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-slate-800 text-zinc-300 hover:text-green-400 hover:bg-slate-700 border border-slate-700`}
                >
                  <i className="ri-mic-2-line text-xl"></i>
                </button>
              </Tooltip>

              <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
              
              {/* 320kbps Download */}
              <div className="relative group">
                <button
                  onClick={() =>
                    handleGenerateAudio({
                      audioUrl: e?.downloadUrl?.[4]?.url,
                      imageUrl: e?.image?.[2]?.url,
                      songName: e?.name,
                      year: e?.year,
                      album: e?.album?.name,
                      artist: e?.artists?.primary?.map((artist) => artist.name).join(","),
                    })
                  }
                  className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-zinc-400 hover:text-green-400 hover:bg-green-400/10 transition-all z-10 cursor-pointer"
                >
                  <i className="ri-download-cloud-line text-xl"></i>
                  <span className="text-[8px] font-bold mt-[-3px]">MP3</span>
                </button>
                {/* Detailed Tooltip */}
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 w-48 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-slate-800 border border-slate-600 shadow-2xl rounded-xl p-3 z-[100] text-center">
                  <p className="text-green-400 font-bold text-sm">320kbps</p>
                  <p className="text-zinc-300 text-xs mt-1">High quality with poster embedded</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-600"></div>
                </div>
              </div>

              {/* FLAC Download */}
              <div className="relative group">
                <button
                  onClick={() =>
                    handleGenerateAudio2({
                      audioUrl: e?.downloadUrl?.[4]?.url,
                      imageUrl: e?.image?.[2]?.url,
                      songName: e?.name,
                      year: e?.year,
                      album: e?.album?.name,
                      artist: e?.artists?.primary?.map((artist) => artist.name).join(","),
                    })
                  }
                  className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all z-10 cursor-pointer"
                >
                  <i className="ri-vip-diamond-line text-lg"></i>
                  <span className="text-[8px] font-bold mt-[-2px]">FLAC</span>
                </button>
                {/* Detailed Tooltip */}
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 w-40 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-slate-800 border border-slate-600 shadow-2xl rounded-xl p-3 z-[100] text-center">
                  <p className="text-zinc-300 text-xs mb-1">Highest quality with</p>
                  <p className="text-blue-400 font-bold text-sm">FLAC Format</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-600"></div>
                </div>
              </div>
              
              <div className="h-6 w-px bg-slate-700/50 mx-1"></div>

              {/* Queue Toggle */}
              <Tooltip text={partyRoom && !isHost ? "Queue is managed by the host" : "Toggle Queue"}>
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  disabled={partyRoom && !isHost}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    partyRoom && !isHost ? "opacity-50 cursor-not-allowed text-zinc-500 bg-slate-800 border border-slate-700" :
                    showQueue
                      ? "bg-green-500 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      : "bg-slate-800 text-zinc-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <i className="ri-play-list-2-fill text-sm"></i>
                  <span className="text-xs font-semibold">{songsList.length}</span>
                </button>
              </Tooltip>
            </div>

            {/* Mobile Actions (Visible only on small screens) */}
            <div className="hidden sm:flex items-center justify-around w-full mt-2 pt-3 border-t border-slate-800/80">
              <Tooltip text="Download 320kbps MP3 with Metadata">
                <button
                  onClick={() =>
                    handleGenerateAudio({
                      audioUrl: e?.downloadUrl?.[4]?.url,
                      imageUrl: e?.image?.[2]?.url,
                      songName: e?.name,
                      year: e?.year,
                    })
                  }
                  className="text-zinc-400 hover:text-green-400 flex flex-col items-center gap-1 transition-colors"
                >
                  <i className="ri-download-cloud-line text-[22px] leading-none"></i>
                  <span className="text-[9px] font-bold uppercase tracking-wider">320kbps MP3</span>
                </button>
              </Tooltip>
              <Tooltip text="Download Premium FLAC Format">
                <button
                  onClick={() =>
                    handleGenerateAudio2({
                      audioUrl: e?.downloadUrl?.[4]?.url,
                      imageUrl: e?.image?.[2]?.url,
                      songName: e?.name,
                      year: e?.year,
                    })
                  }
                  className="text-zinc-400 hover:text-blue-400 flex flex-col items-center gap-1 transition-colors"
                >
                  <i className="ri-vip-diamond-line text-[22px] leading-none"></i>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Flac Format</span>
                </button>
              </Tooltip>
              <Tooltip text="View Song Lyrics">
                <button
                  onClick={() => setShowLyrics(true)}
                  className="text-zinc-400 hover:text-green-400 flex flex-col items-center gap-1 transition-colors"
                >
                  <i className="ri-mic-2-line text-[22px] leading-none"></i>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Lyrics</span>
                </button>
              </Tooltip>
              <Tooltip text={!isSocketSupported ? "Listening Party is Unavailable on Vercel" : partyRoom ? "Manage Listening Party" : "Start Listening Party"}>
                <button
                  onClick={handlePartyToggle}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    partyRoom ? "text-purple-400" : isSocketSupported ? "text-zinc-400" : "text-zinc-600 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-1 leading-none">
                    <i className={`${partyRoom ? 'ri-team-fill' : 'ri-team-line'} text-[22px]`}></i>
                    {partyRoom && <span className="text-[10px] font-bold bg-purple-500/20 px-1.5 rounded-sm">{participants.length}</span>}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Party</span>
                </button>
              </Tooltip>
              <Tooltip text={partyRoom && !isHost ? "Queue is managed by the host" : "Current Playback Queue"}>
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  disabled={partyRoom && !isHost}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    partyRoom && !isHost ? "opacity-30 cursor-not-allowed text-zinc-600" :
                    showQueue ? "text-green-400" : "text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-1 leading-none">
                    <i className="ri-play-list-2-fill text-[22px]"></i>
                    <span className="text-[10px] font-bold bg-slate-800 px-1.5 rounded-sm">{songsList.length}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Queue</span>
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Add To Playlist Modal */}
      {playlistModalSong && (
        <AddToPlaylistModal
          songs={playlistModalSong}
          onClose={() => setPlaylistModalSong(null)}
        />
      )}
    </>
  );
};

export default PlayerBar;
