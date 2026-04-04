import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Circ } from "gsap/all";
import toast from "react-hot-toast";
import Tooltip from "./Tooltip";

const Artists = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requery, setRequery] = useState("");
  const [artists, setArtists] = useState([]);
  const [searchClickState, setSearchClickState] = useState(false);

  const getArtists = async () => {
    try {
      const { data } = await axios.get(
        `https://jiosaavn-roan.vercel.app/api/search/artists?query=${query}&limit=50`
      );
      setArtists(data?.data?.results || []);
      localStorage.setItem("artists", JSON.stringify(data?.data?.results || []));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return toast.error("Enter an artist name");
    if (query === requery) return toast.error("Already showing results for this search");
    
    setRequery(query);
    setArtists([]);
    setSearchClickState(!searchClickState);
  };

  useEffect(() => {
    if (requery.length > 0) {
      getArtists();
    }
  }, [searchClickState]);

  useEffect(() => {
    const cached = localStorage.getItem("artists");
    if (cached) {
      setArtists(JSON.parse(cached));
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
            placeholder="Search artists..."
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
                {requery ? `Artists for "${requery}"` : "Explore Artists"}
            </h2>
        </div>

        {artists.length > 0 ? (
          <div className="grid grid-cols-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-8 sm:gap-4 pb-20">
            {artists.map((art, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                key={`${art.id}-${i}`}
                onClick={() => navigate(`/artists/details/${art.id}`)}
                className="group flex flex-col items-center text-center cursor-pointer"
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-full shadow-2xl mb-4 border-4 border-slate-800 group-hover:border-green-500/50 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={art.image[2]?.url}
                    alt={art.name}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <i className="ri-user-heart-fill text-white text-3xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"></i>
                  </div>
                </div>
                <h3 className="text-sm font-black text-white px-2 group-hover:text-green-400 transition-colors tracking-tight line-clamp-1">
                    {art.name.toUpperCase()}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
                    {art.role || "Artist"}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          !requery && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
               <i className="ri-mic-line text-7xl mb-4"></i>
               <p className="font-bold uppercase tracking-widest text-xs">Search for your favorite artists</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Artists;
