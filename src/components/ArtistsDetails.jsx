import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import InfiniteScroll from "react-infinite-scroll-component";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { getArtistSongs } from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";

const ArtistsDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const finalid = location.pathname.split("/")[3];

  const [songs, setSongs] = useState([]);
  const [artistInfo, setArtistInfo] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();
  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  const fetchDetails = async () => {
    try {
      const { data } = await getArtistSongs(finalid, page);
      const songList = data.data.songs || [];
      
      // Filter out duplicates
      const newData = songList.filter((n) => !songs.some((p) => p.id === n.id));
      setSongs((prev) => [...prev, ...newData]);
      
      // Set artist info from the first song if available
      if (!artistInfo && songList.length > 0) {
        const primaryArtist = songList[0].artists?.primary?.[0];
        if (primaryArtist) setArtistInfo(primaryArtist);
      }
      
      setHasMore(newData.length > 0);
      setPage(page + 1);
      
      if (page === 0 && songList.length === 0) {
        // If first page is empty, maybe go back
        // navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching artist songs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    window.scrollTo(0, 0);
  }, [finalid]);

  if (loading && page === 0) return <Loading />;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 scale-110 blur-[100px]"
          style={{ 
            backgroundImage: `url(${artistInfo?.image?.[2]?.url || noimg})`,
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
          <h1 className="text-lg sm:text-base text-white font-black tracking-tight leading-none uppercase">
            {artistInfo?.name || "ARTIST"}
          </h1>
          <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] ml-0.5">DISCOGRAPHY</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-[12vh] px-8 sm:px-4 max-w-7xl mx-auto">
        
        {/* Artist Hero */}
        <div className="flex sm:flex-col gap-10 sm:gap-6 items-center mb-16 sm:mb-10 text-center sm:text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex-shrink-0"
          >
            <div className="w-56 h-56 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
               <img
                className="w-full h-full object-cover"
                src={artistInfo?.image?.[2]?.url || noimg}
                alt={artistInfo?.name}
              />
            </div>
            <button 
              onClick={() => songs.length > 0 && playSong(songs[0], 0, songs)}
              className="absolute bottom-2 right-2 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-2xl shadow-2xl hover:scale-110 active:scale-90 transition-transform"
            >
              <i className="ri-play-fill"></i>
            </button>
          </motion.div>

          <div className="flex-1 flex flex-col items-center sm:items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-6xl sm:text-3xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl uppercase">
                {artistInfo?.name}
              </h2>
              <div className="flex items-center gap-3 mt-4 sm:mt-3 text-zinc-400 font-bold justify-center">
                <span className="bg-slate-800 px-3 py-1 rounded-full text-xs border border-white/5 uppercase tracking-widest text-green-400">Verified Artist</span>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-lg sm:text-sm">{songs.length}+ Tracks</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Infinite Scroll Track List */}
        <InfiniteScroll
          dataLength={songs.length}
          next={fetchDetails}
          hasMore={hasMore}
          scrollThreshold={0.9}
          loader={
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
          endMessage={
            <div className="py-16 text-center border-t border-white/5 mt-10">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">End of Discography</p>
            </div>
          }
        >
          <div className="space-y-2">
            {songs.map((song, i) => {
              const isActive = song.id === songlink[0]?.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }} 
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
                      {song.album?.name}
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
        </InfiniteScroll>
      </div>

      {playlistModalSong && (
        <AddToPlaylistModal 
          song={playlistModalSong} 
          onClose={() => setPlaylistModalSong(null)} 
        />
      )}
    </div>
  );
};

export default ArtistsDetails;
