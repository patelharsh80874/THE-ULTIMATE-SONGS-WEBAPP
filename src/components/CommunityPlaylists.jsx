import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePlaylist } from "../context/PlaylistContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import Tooltip from "./Tooltip";
import logo from "../../public/logo3.jpg";

const CommunityPlaylists = () => {
    const navigate = useNavigate();
    const { fetchCommunityPlaylists, importPlaylist } = usePlaylist();
    const { user: currentUser } = useContext(AuthContext);

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("updatedAt");
    const gradientPairs = [
        "from-emerald-500/30 via-slate-900 to-emerald-900/40",
        "from-blue-500/30 via-slate-900 to-blue-900/40",
        "from-purple-500/30 via-slate-900 to-fuchsia-900/40",
        "from-orange-500/30 via-slate-900 to-red-900/40",
        "from-pink-500/30 via-slate-900 to-rose-900/40",
        "from-cyan-500/30 via-slate-900 to-cyan-900/40",
        "from-yellow-500/30 via-slate-900 to-amber-900/40",
    ];
    const getGrad = (id) => gradientPairs[id.charCodeAt(id.length - 1) % gradientPairs.length];

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const loadPlaylists = useCallback(async (isNewSearch = false) => {
        if (isNewSearch) {
            setLoading(true);
            setPage(1);
        } else {
            setLoadingMore(true);
        }

        const currentPage = isNewSearch ? 1 : page;
        const result = await fetchCommunityPlaylists(currentPage, debouncedSearch, sortBy);

        if (result) {
            if (isNewSearch) setPlaylists(result.playlists);
            else setPlaylists(prev => [...prev, ...result.playlists]);
            setHasMore(result.hasMore);
            setPage(currentPage + 1);
        }

        setLoading(false);
        setLoadingMore(false);
    }, [debouncedSearch, sortBy, page, fetchCommunityPlaylists]);

    useEffect(() => {
        loadPlaylists(true);
    }, [debouncedSearch, sortBy]);

    const handleImport = async (e, id) => {
        e.stopPropagation();
        if(!currentUser) {
            toast.error("Please login to import playlists");
            navigate("/login");
            return;
        }
        await importPlaylist(id);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const SkeletonCard = () => (
        <div className="bg-slate-800/20 rounded-3xl p-4 border border-white/5 animate-pulse">
            <div className="aspect-square bg-slate-800/40 rounded-2xl mb-4"></div>
            <div className="h-5 bg-slate-800/40 rounded-full w-3/4 mb-3"></div>
            <div className="h-3 bg-slate-800/40 rounded-full w-1/2"></div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-slate-900 text-white pb-32">
            {/* Premium Header */}
            <header className="fixed top-0 z-[100] w-full bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 py-4 px-6 sm:px-4 shadow-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate("/")}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-green-500 hover:text-slate-950 px-3 py-1.5 rounded-full transition-all border border-white/10 font-bold text-[10px] uppercase tracking-widest"
                        >
                            <i className="ri-arrow-left-line"></i> <span className="sm:hidden">Back</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-xl shadow-2xl group-hover:scale-110 transition-transform duration-500" src={logo} alt="Logo" />
                            <div className="flex flex-col decoration-green-500/50 underline underline-offset-4">
                                <h1 className="text-sm sm:text-[11px] font-black tracking-tighter leading-none italic uppercase text-white">
                                    Community
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Search Center */}
                    <div className="hidden sm:hidden md:flex flex-1 max-w-xl relative group">
                        <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors"></i>
                        <input
                            type="text"
                            placeholder="Find vibes, creators, or collections..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-2 pl-11 pr-5 focus:outline-none focus:border-green-500/30 transition-all text-xs font-medium placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-900/40 border border-white/5 p-0.5 rounded-lg">
                            {[
                                { id: "updatedAt", icon: "ri-time-line", label: "Newest" },
                                { id: "name", icon: "ri-sort-alphabet-asc", label: "A-Z" }
                            ].map(opt => (
                                <Tooltip key={opt.id} text={`Sort by ${opt.label}`}>
                                    <button
                                        onClick={() => setSortBy(opt.id)}
                                        className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${sortBy === opt.id ? "bg-green-500 text-slate-950 shadow-lg shadow-green-500/10" : "text-zinc-500 hover:text-white"}`}
                                    >
                                        <i className={opt.icon}></i> <span className="sm:hidden">{opt.label}</span>
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Search - Visible only on small screens */}
                <div className="hidden sm:block relative group w-full">
                    <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Search vibes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-11 pr-5 focus:outline-none focus:border-green-500/30 transition-all text-xs font-medium"
                    />
                </div>
            </header>

            <main className="pt-32 sm:pt-40 px-10 sm:px-4 max-w-[1600px] mx-auto">
                {/* Hero Section */}
                <div className="mb-14 sm:mb-8 relative overflow-hidden p-10 sm:p-6 rounded-[2.5rem] bg-slate-900/40 border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 blur-[120px] -mr-48 -mt-48 rounded-full"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-2xl font-black mb-3 tracking-tighter uppercase leading-none italic text-white flex items-center gap-3">
                            <i className="ri-community-line text-green-500"></i> Community Vault
                        </h2>
                        <p className="text-zinc-400 max-w-xl text-sm sm:text-xs font-medium leading-relaxed tracking-wide">
                            Discover and import unique public playlists from creators around the world. Your next favorite vibe is just a click away.
                        </p>
                    </div>
                </div>

                {loading && page === 1 ? (
                    <div className="grid grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 gap-8 sm:gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)}
                    </div>
                ) : (
                    <>
                        {playlists.length > 0 ? (
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 gap-8 sm:gap-4"
                            >
                                {playlists.map((p) => (
                                    <motion.div
                                        key={p._id}
                                        variants={itemVariants}
                                        whileHover={{ y: -5 }}
                                        onClick={() => navigate(`/${p.owner.username}/${p._id}`)}
                                        className="group relative bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 hover:border-green-500/20 rounded-[2rem] p-4 cursor-pointer transition-all duration-300"
                                    >
                                        {/* Cover Art */}
                                        <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 shadow-2xl bg-slate-800">
                                            <div className="absolute top-3 left-3 z-10">
                                                <div className="px-2 py-0.5 bg-green-500/90 backdrop-blur-md rounded-md text-[7px] font-black tracking-[0.2em] text-slate-950 uppercase shadow-lg border border-white/20">
                                                    Public
                                                </div>
                                            </div>
                                            <div className={`w-full h-full bg-gradient-to-br ${getGrad(p._id)} flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:scale-110 group-hover:rotate-3`}>
                                                {/* Ghost Icon */}
                                                <i className="ri-music-2-fill absolute -bottom-4 -right-4 text-9xl opacity-20 rotate-12 text-white"></i>
                                                
                                                {/* Artistic Glass Icon Box */}
                                                <div className="relative z-10 w-16 h-16 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:-translate-y-1">
                                                    <i className="ri-play-list-2-fill text-3xl sm:text-2xl text-white drop-shadow-2xl"></i>
                                                </div>
                                                
                                                {/* Lens Flare / Shine Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                            </div>

                                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                                <div className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.15em] flex items-center gap-1.5 px-2 bg-slate-900/40 py-1 rounded-md border border-white/5">
                                                    <i className="ri-history-line text-green-500/60"></i>
                                                    {new Date(p.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-1">
                                            <h3 className="font-black text-white truncate text-base sm:text-sm group-hover:text-green-400 transition-colors uppercase tracking-tight leading-none mb-2 mt-1">
                                                {p.name}
                                            </h3>
                                            
                                            <Tooltip text="View creator profile" className="w-fit">
                                                <div 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        navigate(`/profile/${p.owner.username}`); 
                                                    }}
                                                    className="flex items-center gap-2 hover:bg-green-500/10 p-1 px-2 -ml-2 rounded-full transition-all cursor-pointer group/user border border-transparent hover:border-green-500/10"
                                                >
                                                    <div className="w-5 h-5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[8px] font-black text-green-400 uppercase group-hover/user:bg-green-500 group-hover/user:text-slate-950">
                                                        {p.owner?.username?.[0]}
                                                    </div>
                                                    <span className="text-[10px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-wider group-hover/user:text-green-400 transition-colors flex items-center gap-1.5">
                                                        {p.owner?.username}
                                                        <i className="ri-external-link-line text-[9px] opacity-100 sm:opacity-0 group-hover/user:opacity-100 text-green-500/50"></i>
                                                    </span>
                                                </div>
                                            </Tooltip>

                                            {/* Final Refined Action Buttons with Optimal Spacing */}
                                            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5 pb-1">
                                                <Tooltip text="Listen now" className="flex-1">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.02, backgroundColor: "#22c55e" }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/${p.owner.username}/${p._id}`); }}
                                                        className="w-full bg-white text-slate-950 py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-white/5 px-2"
                                                    >
                                                        <i className="ri-play-fill text-[11px]"></i> Play
                                                    </motion.button>
                                                </Tooltip>
                                                <Tooltip text="Save to archives" className="flex-1">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={(e) => handleImport(e, p._id)}
                                                        className="w-full bg-slate-900/40 text-white py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-1.5 px-2"
                                                    >
                                                        <i className="ri-add-line text-green-500 text-[11px]"></i> Import
                                                    </motion.button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center">
                                <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
                                <div className="flex items-center gap-2">
                                    <i className="ri-global-line text-green-500 text-xl sm:text-lg animate-pulse"></i>
                                    <h1 className="text-xl sm:text-sm font-black text-white tracking-tighter uppercase">Community</h1>
                                </div>
                                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/5 mb-8 shadow-inner">
                                    <i className="ri-ghost-2-line text-5xl text-zinc-800"></i>
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Shadow Realm</h3>
                                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] opacity-60">No collections matching your query were found.</p>
                                <button 
                                    onClick={() => { setSearch(""); setSortBy("updatedAt"); }}
                                    className="mt-8 px-8 py-3 bg-white text-slate-950 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest uppercase"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}

                        {hasMore && (
                            <div className="flex justify-center mt-20">
                                <button
                                    onClick={() => loadPlaylists(false)}
                                    disabled={loadingMore}
                                    className="relative group px-12 py-4 rounded-3xl overflow-hidden active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-green-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                    <div className="absolute inset-0 border border-green-500/30 rounded-3xl group-hover:border-green-500/50 transition-colors"></div>
                                    <div className="relative flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-green-400 group-hover:text-green-300 transition-all">
                                        {loadingMore ? (
                                            <><i className="ri-loader-4-line animate-spin text-xl"></i> Loading Stream</>
                                        ) : (
                                            <><i className="ri-arrow-down-s-line text-xl"></i> Load more collections</>
                                        )}
                                    </div>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
            
        </div>
    );
};

export default CommunityPlaylists;
