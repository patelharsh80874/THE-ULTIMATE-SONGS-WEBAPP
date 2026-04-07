import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getSongSuggestions, getSongDetails } from "../services/api";
import { fetchLyrics } from "../services/lyricsService";
import handleGenerateAudio from "../utils/audioUtils";
import Tooltip from "./Tooltip";

const SongDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [songData, setSongData] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLyricsExpanded, setIsLyricsExpanded] = useState(false);

  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [songRes, suggestRes] = await Promise.all([
        getSongDetails(id),
        getSongSuggestions(id)
      ]);
      
      const song = songRes.data?.data?.[0];
      setSongData(song);
      setSuggestions(suggestRes.data?.data);

      // Fetch lyrics concurrently
      if (song) {
        try {
          const artistName = song.artists?.primary?.[0]?.name || "";
          const lyricsRes = await fetchLyrics(artistName, song.name, song.duration);
          setLyrics(lyricsRes);
        } catch (lErr) {
          console.warn("Lyrics fetch failed:", lErr);
        }
      }
    } catch (error) {
      console.error("Error fetching song details:", error);
      toast.error("Failed to load song details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) return <Loading />;
  if (!songData) return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
        <i className="ri-ghost-smile-line text-4xl text-zinc-500"></i>
      </div>
      <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Song not found</h2>
      <button 
        onClick={() => navigate(-1)} 
        className="px-8 py-3 bg-green-500 text-slate-900 rounded-full font-black hover:scale-105 transition-transform shadow-lg shadow-green-500/20 uppercase tracking-widest text-xs"
      >
        Go Back
      </button>
    </div>
  );

  const currentSong = songData;
  const isCurrentlyPlaying = songlink?.[0]?.id === currentSong.id;

  const handleDownload = () => {
    handleGenerateAudio({
      audioUrl: currentSong.downloadUrl?.[4]?.url || currentSong.downloadUrl?.[currentSong.downloadUrl.length - 1]?.url,
      imageUrl: currentSong.image?.[2]?.url || noimg,
      songName: currentSong.name,
      year: currentSong.year,
      album: currentSong.album?.name,
      artist: currentSong.artists?.primary?.[0]?.name,
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!", {
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden relative">
      
      {/* Dynamic Background Blur - More Immersive */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.3, scale: 1.1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 blur-[120px]"
          style={{ 
            backgroundImage: `url(${currentSong.image?.[2]?.url || noimg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900" />
      </div>

      {/* Header - Glassmorphism UI */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-slate-900/30 border-b border-white/5 h-[10vh] sm:h-[8vh] px-8 sm:px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tooltip text="Go Back" position="bottom">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-900 hover:scale-110 hover:rotate-[-10deg] transition-all shadow-xl shadow-green-500/30 active:scale-95"
            >
              <i className="ri-arrow-left-line text-2xl font-bold"></i>
            </button>
          </Tooltip>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-base text-white font-black tracking-tighter leading-none uppercase italic">
              The Ultimate
            </h1>
            <span className="text-[10px] text-green-400 font-bold tracking-[0.4em] ml-0.5 opacity-80 uppercase">Experience</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-slate-700 transition-all"
           >
            <i className="ri-share-forward-line text-xl"></i>
           </button>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content - Compact Layout */}
      <div className="relative z-10 pt-[12vh] px-8 sm:px-4 max-w-6xl mx-auto">
        
        {/* Simple Top Nav */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-white/5 group"
          >
            <i className="ri-home-5-line group-hover:scale-110 transition-transform"></i>
            Home
          </Link>
          <div className="w-1 h-1 bg-zinc-800 rounded-full" />
          <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Song Details</span>
        </div>

        {/* Compact Cinematic Hero */}
        <div className="flex xl:flex-row flex-col gap-10 xl:gap-12 items-center xl:items-end mb-16">
          {/* Cover Art - Refined Size */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative group flex-shrink-0"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-green-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <img
                className="w-72 h-72 sm:w-60 sm:h-60 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] object-cover border border-white/10 relative z-10"
                src={currentSong.image?.[2]?.url || noimg}
                alt={currentSong.name}
              />
              {isCurrentlyPlaying && isPlaying && (
                <div className="absolute top-4 left-4 bg-green-500 p-2 rounded-xl backdrop-blur-md shadow-xl border border-white/10 z-20">
                  <img src={wavs} className="w-6 h-6" alt="Playing" />
                </div>
              )}
              
              {/* Play Overlay - Compact */}
              <button 
                onClick={() => playSong(currentSong, 0, [currentSong])}
                className="absolute -bottom-4 -right-4 sm:bottom-2 sm:right-2 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-[0_15px_40px_rgba(34,197,94,0.3)] hover:scale-110 active:scale-95 transition-all z-30 group/btn"
              >
                <i className={`${isCurrentlyPlaying && isPlaying ? "ri-pause-fill" : "ri-play-fill"}`}></i>
              </button>
            </div>
          </motion.div>

          {/* Clean Song Info */}
          <div className="flex-1 flex flex-col xl:items-start items-center xl:text-left text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 sm:justify-center">
                <span className="bg-green-500/10 text-green-400 text-[9px] font-black px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-[0.2em]">
                  {currentSong.type || "Track"}
                </span>
                <span className="bg-slate-800 text-zinc-500 text-[9px] font-black px-3 py-1 rounded-full border border-white/5 uppercase tracking-[0.2em]">
                  HQ Audio
                </span>
              </div>
              
              <h2 className="text-4xl sm:text-2xl font-black text-white mt-4 sm:mt-3 tracking-tighter leading-tight drop-shadow-xl capitalize">
                {currentSong.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 sm:mt-3 text-zinc-500 font-bold sm:justify-center">
                <Link 
                  to={currentSong.album?.id ? `/albums/details/${currentSong.album.id}` : "#"}
                  className="text-base sm:text-sm hover:text-green-400 cursor-pointer transition-colors flex items-center gap-1.5 group/album"
                >
                  <i className="ri-folder-music-line text-green-500/50"></i>
                  {currentSong.album?.name}
                </Link>
                <div className="w-1 h-1 bg-slate-800 rounded-full sm:hidden" />
                <p className="text-base sm:text-sm flex items-center gap-1.5">
                  <i className="ri-calendar-event-line text-purple-400/50"></i>
                  {currentSong.year || "2024"}
                </p>
                <div className="w-1 h-1 bg-slate-800 rounded-full sm:hidden" />
                <p className="text-base sm:text-sm text-green-400/80 uppercase tracking-widest font-black italic">
                  {currentSong.language}
                </p>
              </div>
            </motion.div>

            {/* Action Hub - Compact Version */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-3 mt-8 sm:mt-6 sm:justify-center"
            >
              <button
                onClick={() => toggleLike(currentSong)}
                className={`flex items-center gap-2 px-6 py-3 sm:px-5 sm:py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border shadow-lg active:scale-95 ${
                  isLiked(currentSong.id) 
                    ? "bg-red-500 text-white border-red-400 shadow-red-500/20" 
                    : "bg-slate-800/50 backdrop-blur-xl text-zinc-400 border-white/5 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <i className={`${isLiked(currentSong.id) ? "ri-heart-3-fill" : "ri-heart-3-line"} text-lg`}></i>
                {isLiked(currentSong.id) ? "Hearted" : "Favorite"}
              </button>

              <div className="flex items-center gap-2 bg-slate-800/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-lg">
                <Tooltip text="Add to Queue">
                  <button
                    onClick={() => {
                      const added = addToQueue(currentSong);
                      if (added) toast.success("Added to queue", { position: "bottom-center" });
                    }}
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                  >
                    <i className="ri-play-list-add-line text-xl"></i>
                  </button>
                </Tooltip>

                <div className="w-px h-6 bg-white/5 mx-1" />

                <Tooltip text="Download">
                  <button
                    onClick={handleDownload}
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    <i className="ri-download-cloud-2-line text-xl"></i>
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 sm:mb-12">
          {[
            { label: "Duration", value: `${Math.floor(currentSong.duration / 60)}:${(currentSong.duration % 60).toString().padStart(2, '0')}`, icon: "ri-time-line", color: "text-blue-400" },
            { label: "Quality", value: "320kbps", icon: "ri-music-2-line", color: "text-green-400" },
            { label: "Total Plays", value: currentSong.playCount ? currentSong.playCount.toLocaleString() : "1.2K+", icon: "ri-play-circle-line", color: "text-purple-400" },
            { label: "Language", value: currentSong.language || "Hindi", icon: "ri-global-line", color: "text-yellow-400" }
          ].map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              key={idx}
              className="bg-slate-800/20 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                <i className={`${item.icon} text-lg`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</p>
                <p className="text-lg font-black text-white leading-none mt-1">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Explorer Sections */}
        <div className="space-y-32 sm:space-y-20">
          
          {/* Detailed Artists Section */}
          <section className="relative">
            <div className="flex items-center gap-4 mb-10">
               <h3 className="text-3xl sm:text-2xl font-black text-white uppercase tracking-tighter">Artists</h3>
               <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-6">
              {currentSong.artists?.primary?.map((artist, i) => (
                <motion.div
                  key={artist.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10 }}
                  onClick={() => navigate(`/artists/details/${artist.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-5 shadow-2xl border-4 border-slate-800 group-hover:border-green-500/30 transition-all">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[50%] group-hover:grayscale-0"
                      src={artist.image?.[2]?.url || noimg}
                      alt={artist.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                       <span className="bg-green-500/90 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Main</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-white text-center leading-none tracking-tight group-hover:text-green-400 transition-colors">{artist.name}</h4>
                  <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 opacity-60">Lead Performer</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Lyrics Intelligence Section */}
          {lyrics && (
            <section className="bg-slate-800/10 rounded-[3rem] border border-white/5 p-12 sm:p-6 relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center justify-between mb-12 sm:mb-8 relative z-10">
                <h3 className="text-3xl sm:text-2xl font-black text-white tracking-tighter">Song Lyrics</h3>
                <i className="ri-chat-voice-line text-5xl text-purple-500 opacity-20"></i>
              </div>

              <div className={`relative transition-all duration-700 ${isLyricsExpanded ? "max-h-none" : "max-h-[300px]"} overflow-hidden z-10`}>
                <div className="space-y-4">
                  {(lyrics.parsedSynced.length > 0 ? lyrics.parsedSynced : lyrics.plainLyrics?.split('\n')?.map(l => ({ text: l })) || [])
                    .map((line, idx) => (
                      <p key={idx} className="text-lg sm:text-base font-bold text-zinc-500 hover:text-white transition-colors cursor-default tracking-tight leading-relaxed">
                        {line.text}
                      </p>
                    ))}
                </div>
                
                {!isLyricsExpanded && (
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end justify-center pb-4">
                    <button 
                      onClick={() => setIsLyricsExpanded(true)}
                      className="px-8 py-3 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Unlock All Lyrics
                    </button>
                  </div>
                )}
              </div>

              {isLyricsExpanded && (
                <div className="mt-12 text-center relative z-10">
                  <button 
                    onClick={() => setIsLyricsExpanded(false)}
                    className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition-colors"
                  >
                    Collapse Intelligence <i className="ri-arrow-up-s-line"></i>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Similar Tracks - Grid Evolution */}
          {suggestions.length > 0 && (
            <section className="mb-32">
              <div className="flex items-center gap-4 mb-10">
                 <h3 className="text-3xl sm:text-2xl font-black text-white uppercase tracking-tighter">Recommended Songs</h3>
                 <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
              </div>
              
              <div className="flex gap-8 overflow-x-auto pb-10 -mx-1 px-1 no-scrollbar snap-x scroll-smooth">
                {suggestions.map((track, i) => {
                  const isTrackActive = songlink?.[0]?.id === track.id;
                  return (
                    <motion.div
                      key={track.id || i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      onClick={() => playSong(track, i, suggestions)}
                      className="flex-shrink-0 w-52 sm:w-44 group cursor-pointer snap-start"
                    >
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 shadow-xl border border-white/5 group-hover:border-purple-500/50 transition-all">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          src={track.image[2].url}
                          alt={track.name}
                        />
                        <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity duration-300 ${isTrackActive ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-95 ${isLiked(track.id) ? "bg-red-500 border-red-400 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
                            >
                              <i className={isLiked(track.id) ? "ri-heart-fill text-base" : "ri-heart-line text-base"}></i>
                            </button>
                            
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isTrackActive ? "bg-green-500 text-slate-900" : "bg-white/20 backdrop-blur-md text-white border border-white/20"}`}>
                              {isTrackActive && isPlaying ? (
                                <img src={wavs} className="w-6 h-6" alt="" />
                              ) : (
                                <i className="ri-play-fill text-xl ml-1"></i>
                              )}
                            </div>

                            <button 
                              onClick={(e) => { e.stopPropagation(); addToQueue(track); toast.success("Queued"); }}
                              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all active:scale-95 hover:bg-white/20"
                            >
                              <i className="ri-play-list-add-line text-base"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="px-1 text-center">
                         <h4 className={`text-base font-black leading-none truncate group-hover:text-purple-400 transition-colors ${isTrackActive ? "text-green-400" : "text-white"}`}>
                          {track.name}
                        </h4>
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-1.5 opacity-70 truncate">{track.artists?.primary?.[0]?.name}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Minimal Footer */}
          <section className="py-12 border-t border-white/5 text-center mb-24">
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">
               {currentSong.copyright || `© ${newSongYear} The Ultimate Global Music Archive`}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SongDetails;
