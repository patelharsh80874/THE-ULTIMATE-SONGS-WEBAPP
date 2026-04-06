import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getPlaylistDetails } from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";

const PlaylistDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const finalid = location.pathname.split("/")[3];

  const [playlistData, setPlaylistData] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data } = await getPlaylistDetails(finalid);
      setPlaylistData(data?.data);
      setSongs(data?.data?.songs || []);
    } catch (error) {
      console.error("Error fetching playlist details:", error);
      toast.error("Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    window.scrollTo(0, 0);
  }, [finalid]);

  if (loading) return <Loading />;
  if (!playlistData) return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-green-500 rounded-full font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 scale-110 blur-[100px]"
          style={{ 
            backgroundImage: `url(${playlistData.image?.[2]?.url || noimg})`,
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
            PLAYLIST
          </h1>
          <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] ml-0.5">{songs.length} TRACKS</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-[12vh] px-8 sm:px-4 max-w-7xl mx-auto">
        
        {/* Playlist Hero */}
        <div className="flex sm:flex-col gap-10 sm:gap-6 items-end sm:items-center mb-16 sm:mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative flex-shrink-0"
          >
            <img
              className="w-64 h-64 sm:w-56 sm:h-56 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover border border-white/10"
              src={playlistData.image?.[2]?.url || noimg}
              alt={playlistData.name}
            />
            <button 
              onClick={() => playSong(songs[0], 0, songs)}
              className="absolute -bottom-4 -right-4 sm:bottom-2 sm:right-2 w-16 h-16 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 active:scale-90 transition-transform"
            >
              <i className="ri-play-fill"></i>
            </button>
          </motion.div>

          <div className="flex-1 flex flex-col sm:items-center sm:text-center pb-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
                CURATED PLAYLIST
              </span>
              <h2 className="text-5xl sm:text-2xl font-black text-white mt-4 sm:mt-2 tracking-tighter leading-tight drop-shadow-2xl">
                {playlistData.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-3 text-zinc-300 font-medium sm:justify-center">
                <p className="text-xl sm:text-sm font-bold opacity-80 uppercase">
                  {playlistData.type}
                </p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm">{songs.length} Tracks</p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm text-green-400 font-bold uppercase">{playlistData.language || "Multi"}</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-2">
          {songs.map((song, i) => {
            const isActive = song.id === songlink[0]?.id;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.03 }} 
                key={song.id || i}
                onClick={() => playSong(song, i, songs)}
                className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-300 border ${
                  isActive 
                    ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" 
                    : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                }`}
              >
                {/* Index / Playing Indicator */}
                <div className="w-8 sm:w-6 text-center flex-shrink-0">
                  {isActive ? (
                    <img src={wavs} alt="" className="w-5 h-5 sm:w-4 sm:h-4 mx-auto" />
                  ) : (
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-green-400 transition-colors">{i + 1}</span>
                  )}
                </div>

                {/* Song Cover */}
                <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 relative shadow-md">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={song.image?.[1]?.url || song.image?.[2]?.url} 
                    alt={song.name} 
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <i className={`text-xl text-white ${isPlaying ? "ri-pause-fill" : "ri-play-fill"}`}></i>
                    </div>
                  )}
                </div>

                {/* Song Name & Details */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-xs font-bold truncate ${isActive ? "text-green-400 font-black" : "text-white"}`}>
                    {song.name}
                  </h3>
                  <p className="text-xs sm:text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                    {song.album?.name} · {song.artists?.primary?.[0]?.name}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                  <Tooltip text="Add to Queue">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const added = addToQueue(song); 
                        if (added) toast.success("Added to queue"); 
                        else toast("Already in queue", { icon: "⚠️" }); 
                      }}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-green-400 hover:bg-green-500/10 transition-all"
                    >
                      <i className="ri-play-list-add-line text-lg sm:text-base"></i>
                    </button>
                  </Tooltip>
                  <Tooltip text={isLiked(song?.id) ? "Unlike" : "Like"}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleLike(song); 
                      }}
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                        isLiked(song?.id) ? "text-red-500" : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <i className={`${isLiked(song?.id) ? "ri-heart-fill" : "ri-heart-line"} text-lg sm:text-base`}></i>
                    </button>
                  </Tooltip>
                  <Tooltip text="Add to Playlist">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setPlaylistModalSong(song); 
                      }}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                    >
                      <i className="ri-folder-add-line text-lg sm:text-base"></i>
                    </button>
                  </Tooltip>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {playlistModalSong && (
        <AddToPlaylistModal 
          songs={playlistModalSong} 
          onClose={() => setPlaylistModalSong(null)} 
        />
      )}
    </div>
  );
};

export default PlaylistDetails;
