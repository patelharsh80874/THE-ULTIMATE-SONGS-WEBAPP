import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import toast from "react-hot-toast";
import Tooltip from "./Tooltip";

const Playlist = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requery, setRequery] = useState("");
  const [page, setPage] = useState(1);
  const [playlists, setPlaylists] = useState([]);
  const [searchClickState, setSearchClickState] = useState(false);

  const getPlaylists = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/search/playlists?query=${query}&page=${page}&limit=12`
      );

      const items = data?.data?.results || [];
      if (items.length > 0) {
        setPlaylists((prev) => [...prev, ...items]);
        localStorage.setItem("playlist", JSON.stringify([...playlists, ...items]));
      } else if (page > 1) {
        toast("No more playlists found", { icon: "info" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return toast.error("Enter something to search");
    if (query === requery) return toast.error("Already showing results for this search");
    
    setRequery(query);
    setPlaylists([]);
    setPage(1);
    setSearchClickState(!searchClickState);
  };

  const loadMoreData = () => {
    if (playlists.length > 0 && page < 10) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (requery.length > 0) {
      getPlaylists();
    }
  }, [searchClickState, page]);

  useEffect(() => {
    const cached = localStorage.getItem("playlist");
    if (cached) {
      setPlaylists(JSON.parse(cached));
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Header / Search */}
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
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg"></i>
          <input
            className="w-full bg-slate-800/50 rounded-full pl-12 pr-4 py-2.5 sm:py-2 text-white border border-white/5 focus:border-green-500/50 outline-none transition-all placeholder:text-zinc-500 sm:text-sm"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            value={query}
            placeholder="Search playlists (e.g. Chill, Rock...)"
            type="text"
          />
        </div>

        <button
          onClick={handleSearch}
          className="hidden sm:flex w-10 h-10 rounded-full bg-slate-800 border border-white/5 items-center justify-center text-white hover:border-green-500/50 transition-all font-bold"
        >
          <i className="ri-search-line"></i>
        </button>

        <button
          onClick={handleSearch}
          className="sm:hidden px-6 py-2.5 bg-green-500 text-slate-900 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/10"
        >
          SEARCH
        </button>

      </motion.div>

      {/* Grid Content */}
      <div className="pt-[14vh] sm:pt-[10vh] px-8 sm:px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
                {requery ? `Playlists for "${requery}"` : "Explore Playlists"}
            </h2>
            {requery && (
                <button 
                    onClick={loadMoreData}
                    className="text-xs font-bold text-green-400 hover:underline tracking-widest"
                >
                    LOAD MORE
                </button>
            )}
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-6 sm:gap-4 pb-20">
            {playlists.map((pl, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                key={`${pl.id}-${i}`}
                onClick={() => navigate(`/playlist/details/${pl.id}`)}
                className="group relative bg-slate-800/30 border border-white/5 p-3 rounded-2xl cursor-pointer hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg mb-3">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={pl.image[2]?.url}
                    alt={pl.name}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <i className="ri-play-fill ml-1"></i>
                     </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white truncate group-hover:text-green-400 transition-colors leading-tight mb-1">
                    {pl.name}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest line-clamp-1">
                    {pl.description || "Collection"}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
             <i className="ri-play-list-2-fill text-7xl mb-4"></i>
             <p className="font-bold">No playlists found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlist;
