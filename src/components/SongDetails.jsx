import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import toast from "react-hot-toast";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getSongSuggestions, getSongDetails } from "../services/api";
import Tooltip from "./Tooltip";

const SongDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [songRes, suggestRes] = await Promise.all([
        getSongDetails(id),
        getSongSuggestions(id)
      ]);
      setSongData(songRes.data?.data?.[0]);
      setSuggestions(suggestRes.data?.data);
    } catch (error) {
      console.error("Error fetching song details:", error);
      toast.error("Failed to load song details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <Loading />;
  if (!songData) return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-bold mb-4">Song not found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-green-500 rounded-full font-bold">Go Back</button>
    </div>
  );

  const currentSong = songData;
  const isCurrentlyPlaying = songlink?.[0]?.id === currentSong.id;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 scale-110 blur-[100px]"
          style={{ 
            backgroundImage: `url(${currentSong.image?.[2]?.url || noimg})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/90 to-slate-900" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/5 h-[10vh] sm:h-[8vh] px-6 sm:px-4 flex items-center gap-4">
        <Tooltip text="Go Back" position="bottom">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-lg shadow-green-500/20 active:scale-95"
          >
            <i className="ri-arrow-left-line text-2xl font-bold"></i>
          </button>
        </Tooltip>
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-base text-white font-black tracking-tight leading-none">
            ULTIMATE SONGS
          </h1>
          <span className="text-[10px] text-green-400 font-bold tracking-[0.2em] ml-0.5">DETAILS</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-[12vh] px-8 sm:px-4 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="flex sm:flex-col gap-10 sm:gap-6 items-end sm:items-center">
          {/* Cover Art */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative group flex-shrink-0"
          >
            <img
              className="w-72 h-72 sm:w-60 sm:h-60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover border border-white/10"
              src={currentSong.image?.[2]?.url || noimg}
              alt={currentSong.name}
            />
            {isCurrentlyPlaying && isPlaying && (
              <div className="absolute top-4 left-4 bg-green-500/90 p-2 rounded-lg backdrop-blur-md shadow-lg border border-white/10">
                <img src={wavs} className="w-6 h-6" alt="Playing" />
              </div>
            )}
            <button 
              onClick={() => playSong(currentSong, 0, [currentSong])}
              className="absolute -bottom-4 -right-4 sm:bottom-2 sm:right-2 w-16 h-16 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 active:scale-90 transition-transform"
            >
              <i className={isCurrentlyPlaying && isPlaying ? "ri-pause-fill" : "ri-play-fill"}></i>
            </button>
          </motion.div>

          {/* Song Info */}
          <div className="flex-1 flex flex-col sm:items-center sm:text-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-purple-500/20 text-purple-400 text-[10px] sm:text-[9px] font-bold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
                {currentSong.type || "Song"}
              </span>
              <h2 className="text-6xl sm:text-3xl font-black text-white mt-4 sm:mt-2 tracking-tighter leading-tight drop-shadow-2xl">
                {currentSong.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-3 text-zinc-300 font-medium sm:justify-center">
                <p 
                  onClick={() => currentSong.album?.id && navigate(`/albums/details/${currentSong.album.id}`)}
                  className="text-xl sm:text-sm hover:text-green-400 cursor-pointer transition-colors"
                >
                  {currentSong.album?.name}
                </p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm">{currentSong.year || "Unknown"}</p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm text-green-400 font-bold uppercase">{currentSong.language}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mt-8 sm:mt-6"
            >
              <Tooltip text={isLiked(currentSong.id) ? "Unlike" : "Like"} position="bottom">
                <button
                  onClick={() => toggleLike(currentSong)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all border ${
                    isLiked(currentSong.id) 
                      ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20" 
                      : "bg-slate-800 text-zinc-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <i className={isLiked(currentSong.id) ? "ri-heart-3-fill" : "ri-heart-3-line"}></i>
                  {isLiked(currentSong.id) ? "Liked" : "Like"}
                </button>
              </Tooltip>
              <Tooltip text="Add to Queue" position="bottom">
                <button
                  onClick={() => {
                    const added = addToQueue(currentSong);
                    if (added) toast.success("Added to queue");
                    else toast("Already in queue", { icon: "⚠️" });
                  }}
                  className="w-11 h-11 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <i className="ri-play-list-add-line text-xl"></i>
                </button>
              </Tooltip>
            </motion.div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 sm:mt-10">
          {[
            { label: "Duration", value: `${Math.floor(currentSong.duration / 60)}:${(currentSong.duration % 60).toString().padStart(2, '0')} min`, icon: "ri-time-line" },
            { label: "Quality", value: "320kbps / FLAC", icon: "ri-music-2-line" },
            { label: "Format", value: "MP3 / M4A", icon: "ri-file-music-line" },
            { label: "Play Count", value: currentSong.playCount ? currentSong.playCount.toLocaleString() : "1,240+", icon: "ri-play-circle-line" }
          ].map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              key={idx}
              className="bg-slate-800/40 backdrop-blur-md border border-white/5 p-4 rounded-xl flex items-start gap-3 hover:border-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                <i className={item.icon}></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-white font-bold leading-tight mt-0.5">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-20 space-y-20 sm:mt-12 sm:space-y-12">
          
          {/* Artists */}
          <section>
            <div className="flex items-center justify-between mb-6 sm:mb-4 px-1">
              <h3 className="text-2xl sm:text-xl font-black text-white flex items-center gap-3">
                Artists
                <span className="w-8 h-[2px] bg-green-500" />
              </h3>
            </div>
            
            <motion.div className="flex gap-6 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide no-scrollbar">
              {currentSong.artists?.primary?.map((artist, i) => (
                <motion.div
                  key={artist.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/artists/details/${artist.id}`)}
                  className="flex-shrink-0 w-44 sm:w-36 group cursor-pointer"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-green-500/50 transition-colors">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={artist.image?.[2]?.url || noimg}
                      alt={artist.name}
                    />
                  </div>
                  <h4 className="text-white font-bold text-center truncate group-hover:text-green-400 transition-colors">{artist.name}</h4>
                  <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest mt-1">Primary Artist</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Similar Songs */}
          {suggestions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6 sm:mb-4 px-1">
                <h3 className="text-2xl sm:text-xl font-black text-white flex items-center gap-3">
                  Similar Tracks
                  <span className="w-8 h-[2px] bg-purple-500" />
                </h3>
              </div>
              
              <div className="flex gap-6 overflow-x-auto pb-6 -mx-1 px-1 no-scrollbar">
                {suggestions.map((track, i) => {
                  const isTrackActive = songlink?.[0]?.id === track.id;
                  return (
                    <motion.div
                      key={track.id || i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -5 }}
                      onClick={() => playSong(track, i, suggestions)}
                      className="flex-shrink-0 w-48 group cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5 group-hover:border-purple-500/50 transition-colors">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          src={track.image[2].url}
                          alt={track.name}
                        />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isTrackActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isTrackActive ? "bg-green-500 text-slate-900" : "bg-white/20 backdrop-blur-md text-white"}`}>
                            {isTrackActive && isPlaying ? (
                              <img src={wavs} className="w-6 h-6" alt="" />
                            ) : (
                              <i className="ri-play-fill text-2xl"></i>
                            )}
                          </div>
                        </div>
                      </div>
                      <h4 className={`text-sm font-bold truncate group-hover:text-purple-400 transition-colors mt-1 ${isTrackActive ? "text-green-400" : "text-white"}`}>
                        {track.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase truncate mt-0.5">{track.album.name}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Copyright Info */}
          <section className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 sm:p-4 text-center">
            <p className="text-zinc-500 text-xs sm:text-[10px] font-medium italic">
              {currentSong.copyright || "Copyright info not available."}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SongDetails;
