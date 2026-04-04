import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { usePlaylist } from "../context/PlaylistContext";
import Loading from "./Loading";
import Tooltip from "./Tooltip";
import API_BASE_URL from "../config/api";
import logo from "../../public/logo3.jpg";

const API = `${API_BASE_URL}/api/playlists`;

const CreatorProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { importPlaylist } = usePlaylist();

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

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API}/user/${username}`);
            setProfileData(data);
        } catch (error) {
            console.error("Failed to fetch creator profile:", error);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchProfile();
        window.scrollTo(0, 0);
    }, [fetchProfile]);

    if (loading) return <Loading customText={`Profiling ${username}...`} />;

    const playlists = profileData?.playlists || [];

    return (
        <div className="w-full min-h-screen bg-slate-900 text-white pb-32">
            {/* Header */}
            <header className="fixed top-0 z-[100] w-full bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 py-4 px-6 sm:px-4 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">
                    <Tooltip text="Back to Community">
                        <button 
                            onClick={() => navigate("/community")}
                            className="flex items-center gap-1.5 bg-slate-900 border border-white/5 hover:bg-green-500 hover:text-slate-100 px-3 py-1.5 rounded-full transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl"
                        >
                            <i className="ri-arrow-left-line text-base"></i> <span className="sm:hidden">Back</span>
                        </button>
                    </Tooltip>
                    <div className="flex flex-col">
                        <h1 className="text-sm sm:text-[11px] font-black tracking-tighter uppercase leading-none italic text-white/50">
                            Creator Profile
                        </h1>
                    </div>
                </div>

                <Tooltip text="Go to Home">
                    <button 
                        onClick={() => navigate("/")}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full transition-all border border-white/5 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <i className="ri-home-4-line text-base text-green-500"></i> <span className="sm:hidden">Home</span>
                    </button>
                </Tooltip>
            </header>

            <main className="pt-32 sm:pt-28 px-10 sm:px-4 max-w-7xl mx-auto">
                {/* Profile Hero */}
                <div className="mb-14 text-center relative py-12 sm:py-8 px-6 rounded-[3rem] sm:rounded-[2rem] bg-slate-900/40 border border-white/5 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/5 blur-[100px] rounded-full"></div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10"
                    >
                        <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-[2rem] sm:rounded-2xl mx-auto flex items-center justify-center text-2xl sm:text-xl font-black text-slate-950 shadow-[0_15px_40px_rgba(34,197,94,0.2)] mb-6 sm:mb-4 uppercase rotate-3">
                            {username[0]}
                        </div>
                        <h2 className="text-4xl sm:text-2xl font-black tracking-tighter uppercase italic leading-none mb-3 drop-shadow-2xl">
                            {username}
                        </h2>
                        <div className="flex items-center justify-center gap-5 sm:gap-4 mt-6">
                            <div className="flex flex-col items-center">
                                <span className="text-xl sm:text-lg font-black text-white">{playlists.length}</span>
                                <span className="text-[8px] font-black text-zinc-500 tracking-[0.3em] uppercase mt-1">Playlists</span>
                            </div>
                            <div className="w-[1px] h-8 sm:h-6 bg-white/10"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-xl sm:text-lg font-black text-white">{profileData?.likedSongsCount || 0}</span>
                                <span className="text-[8px] font-black text-zinc-500 tracking-[0.3em] uppercase mt-1">Liked Tracks</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Public Discography</h3>
                    <div className="h-[1px] flex-1 mx-6 bg-white/5 sm:hidden"></div>
                </div>

                {playlists.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 gap-6 sm:gap-4"
                    >
                        {playlists.map((p, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={p._id}
                                onClick={() => navigate(`/${username}/${p._id}`)}
                                className="group bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 hover:border-green-500/20 rounded-[1.8rem] sm:rounded-2xl p-4 sm:p-3 cursor-pointer transition-all duration-300"
                            >
                                <div className="relative aspect-square rounded-[1.2rem] sm:rounded-xl overflow-hidden mb-4 bg-slate-800 shadow-xl">
                                    <div className="absolute top-2.5 left-2.5 z-10">
                                        <div className="px-2 py-0.5 bg-green-500/90 backdrop-blur-md rounded-md text-[6px] font-black tracking-[0.2em] text-slate-950 uppercase border border-white/10">
                                            Public
                                        </div>
                                    </div>
                                    <div className={`w-full h-full bg-gradient-to-br ${getGrad(p._id)} flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden`}>
                                        {/* Ghost Icon */}
                                        <i className="ri-music-2-fill absolute -bottom-4 -right-4 text-8xl opacity-20 rotate-12 text-white"></i>
                                        
                                        {/* Artistic Glass Icon Box */}
                                        <div className="relative z-10 w-14 h-14 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:-translate-y-1">
                                            <i className="ri-folder-music-fill text-3xl sm:text-2xl text-white"></i>
                                        </div>

                                        {/* Lens Flare */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                    </div>
                                    <div className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 rounded-lg text-[8px] font-black text-white border border-white/5 uppercase">
                                        {p.songs?.length} SONGS
                                    </div>
                                </div>
                                <h4 className="font-black text-white text-base sm:text-sm uppercase truncate tracking-tight group-hover:text-green-400 transition-colors">
                                    {p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 opacity-70">
                                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest bg-slate-900/60 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
                                        <i className="ri-calendar-2-line text-green-500/50"></i>
                                        {new Date(p.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>

                                {/* Final Refined Action Buttons with Optimal Spacing */}
                                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5 pb-1">
                                    <Tooltip text="Listen now" className="flex-1">
                                        <motion.button 
                                            whileHover={{ scale: 1.02, backgroundColor: "#22c55e" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/${username}/${p._id}`); }}
                                            className="w-full bg-white text-slate-950 py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-white/5 px-2"
                                        >
                                            <i className="ri-play-fill text-[11px]"></i> Play
                                        </motion.button>
                                    </Tooltip>
                                    <Tooltip text="Save to archives" className="flex-1">
                                        <motion.button 
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => { e.stopPropagation(); importPlaylist(p._id); }}
                                            className="w-full bg-slate-900/40 text-white py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-1.5 px-2"
                                        >
                                            <i className="ri-add-line text-green-500 text-[11px]"></i> Import
                                        </motion.button>
                                    </Tooltip>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-20 text-center opacity-40">
                        <i className="ri-ghost-line text-6xl block mb-4"></i>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic">This collection is currently empty</h3>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1">Check back later for fresh vibes.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreatorProfile;
