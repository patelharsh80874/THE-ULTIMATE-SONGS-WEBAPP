import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import wavs from "../../public/wavs.gif";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import InfiniteScroll from "react-infinite-scroll-component";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { searchSongs } from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";

const Songs = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requery, setRequery] = useState("");
  const [search, setSearch] = useState([]);
  const [page, setPage] = useState(1);
  const [searchclick, setSearchclick] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();
  const { isLiked, toggleLike } = useLikedSongs();

  const getSearch = async () => {
    try {
      const { data } = await searchSongs(requery, page);
      const newData = data.data.results.filter(
        (newItem) => !search.some((prevItem) => prevItem.id === newItem.id)
      );
      
      if (newData.length > 0) {
        setSearch((prev) => [...prev, ...newData]);
        setHasMore(newData.length > 0);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
        if (page > 1) {
            toast("No more songs found", { icon: "info" });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return toast.error("Please enter something to search");
    if (query === requery) return toast.error("Try a different search term");
    
    setSearch([]);
    setHasMore(true);
    setPage(1);
    setRequery(query);
    setSearchclick(!searchclick);
  };

  useEffect(() => {
    if (requery.length > 0) {
      getSearch();
    }
  }, [searchclick]);

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 overflow-x-hidden">
      {/* Header / Search Bar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/5 h-[10vh] sm:h-[8vh] px-6 sm:px-4 flex items-center gap-4"
      >
        <Tooltip text="Go Back" position="bottom">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-lg shadow-green-500/20 active:scale-95 flex-shrink-0"
          >
            <i className="ri-arrow-left-line text-2xl font-bold"></i>
          </button>
        </Tooltip>

        <div className="relative flex-1 max-w-2xl">
          <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg"></i>
          <input
            className="w-full bg-slate-800/50 rounded-full pl-12 pr-4 py-2.5 sm:py-2 text-white border border-white/5 focus:border-green-500/50 outline-none transition-all placeholder:text-zinc-500 sm:text-sm"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            value={query}
            placeholder="What do you want to listen to?"
            type="text"
          />
        </div>

        <button
          onClick={handleSearch}
          className="hidden sm:flex w-10 h-10 rounded-full bg-slate-800 border border-white/5 items-center justify-center text-white"
        >
          <i className="ri-search-2-line"></i>
        </button>

        <button
          onClick={handleSearch}
          className="sm:hidden px-6 py-2.5 bg-green-500 text-slate-900 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/10"
        >
          SEARCH
        </button>
      </motion.div>

      {/* Results Section */}
      <div className="pt-[14vh] sm:pt-[10vh] pb-32 px-8 sm:px-4 max-w-7xl mx-auto">
        {requery ? (
          <InfiniteScroll
            dataLength={search.length}
            next={getSearch}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
            endMessage={
              search.length > 0 && (
                <div className="text-center py-10 text-zinc-500 font-medium">
                  End of search results for "{requery}"
                </div>
              )
            }
          >
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  SEARCH RESULTS FOR <span className="text-green-400 capitalize">"{requery}"</span>
                </h2>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                  {search.length} TRACKS
                </span>
              </div>

              {search.map((song, i) => {
                const isActive = song.id === songlink[0]?.id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    key={song.id || i}
                    onClick={() => playSong(song, i, search)}
                    className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-300 border ${
                      isActive 
                        ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" 
                        : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                    }`}
                  >
                    <div className="w-8 sm:w-6 text-center flex-shrink-0">
                      {isActive ? (
                        <img src={wavs} alt="" className="w-5 h-5 sm:w-4 sm:h-4 mx-auto" />
                      ) : (
                        <span className="text-xs font-bold text-zinc-500 group-hover:text-green-400 transition-colors">{i + 1}</span>
                      )}
                    </div>

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

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-xs font-bold truncate ${isActive ? "text-green-400 font-black" : "text-white"}`}>
                        {song.name}
                      </h3>
                      <p className="text-xs sm:text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                        {song.album?.name} · {song.artists?.primary?.[0]?.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                      <Tooltip text="Add to Queue">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const added = addToQueue(song); 
                            if (added) toast.success("Added to queue"); 
                            else toast("Already in queue", { icon: "⚠️" }); 
                          }}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-green-400 hover:bg-green-500/10 transition-all font-bold"
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
        ) : (
          <div className="flex flex-col items-center justify-center py-32 sm:py-20 text-center">
             <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="w-48 h-48 sm:w-32 sm:h-32 bg-slate-800/50 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-2xl backdrop-blur-3xl"
             >
                <i className="ri-search-eye-line text-7xl sm:text-5xl text-zinc-700"></i>
             </motion.div>
             <h2 className="text-3xl sm:text-xl font-black text-white mb-3">Symphony of a Billion Songs</h2>
             <p className="text-zinc-500 max-w-md">
               Enter a song, artist, or album name to begin your musical journey with THE ULTIMATE SONGS.
             </p>
             <div className="mt-12 flex flex-wrap justify-center gap-3">
               {["Trending", "New Releases", "Top Charts", "Podcasts"].map(tag => (
                 <button 
                   key={tag}
                   onClick={() => { setQuery(tag); handleSearch(); }}
                   className="px-5 py-2 rounded-full bg-slate-800/40 border border-white/5 text-sm font-bold hover:bg-green-500 hover:text-slate-900 hover:border-green-500 transition-all"
                 >
                   {tag}
                 </button>
               ))}
             </div>
          </div>
        )}
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

export default Songs;
