import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import Tooltip from "./Tooltip";
import { usePlaylist } from "../context/PlaylistContext";
import useLikedSongs from "../hooks/useLikedSongs";
import API_BASE_URL from "../config/api";

const Import = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { importPlaylist, fetchPlaylists } = usePlaylist();
  const { importLikes } = useLikedSongs();

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [browseResults, setBrowseResults] = useState(null);
  const [importingId, setImportingId] = useState(null);

  const handleSearch = async () => {
    const val = inputVal.trim();
    if (!val) return toast.error("Please enter a username or link.");
    if (user && val.toLowerCase() === user.username.toLowerCase()) {
      return toast.error("You can't import your own collection!");
    }

    setLoading(true);
    setBrowseResults(null);
    try {
      const playlistLinkMatch = val.match(/\/my-playlists\/([a-f0-9]{24})/i);
      if (playlistLinkMatch) {
        const plId = playlistLinkMatch[1];
        const result = await importPlaylist(plId);
        if (result) {
          await fetchPlaylists();
          toast.success("Playlist imported!");
          setTimeout(() => navigate("/my-playlists"), 1500);
        }
        setLoading(false);
        return;
      }
      
      const { data } = await axios.get(
        `${API_BASE_URL}/api/playlists/user/${val}`
      );

      setBrowseResults(data);
    } catch (err) {
      toast.error("User not found or content private.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportPlaylist = async (plId) => {
    setImportingId(plId);
    const result = await importPlaylist(plId);
    if (result) {
      toast.success("Playlist imported!");
      await fetchPlaylists();
    }
    setImportingId(null);
  };

  const handleImportLikes = async () => {
    if (!browseResults?.likedSongIds?.length) return;
    setImportingId("likes");
    await importLikes(browseResults.likedSongIds);
    toast.success(`${browseResults.likedSongsCount} liked songs imported!`);
    setImportingId(null);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">

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
        <h1 className="text-lg sm:text-base text-white font-black tracking-tight leading-none truncate">
          IMPORT TRACKS
        </h1>
      </div>

      {/* Content Area */}
      <div className="pt-[14vh] sm:pt-[10vh] px-8 sm:px-4 max-w-2xl mx-auto">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-slate-800/40 border border-white/5 p-10 sm:p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl"
        >
          <div className="text-center mb-10">
            <i className="ri-import-line text-6xl text-green-500 mb-4 block drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"></i>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Expand Your Library</h2>
            <p className="text-zinc-500 text-sm font-medium">
              Browse public collections by username or paste a direct playlist link.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="relative group">
              <i className="ri-user-search-line absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-lg group-focus-within:text-green-500 transition-colors"></i>
              <input
                type="text"
                placeholder="Username or playlist link..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-slate-900/50 text-white border border-white/5 rounded-2xl pl-14 pr-4 py-4 focus:outline-none focus:border-green-500/50 placeholder:text-zinc-500 transition-all font-bold text-base"
              />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full py-4 font-black text-slate-900 bg-green-500 rounded-2xl hover:bg-green-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-green-500/10 disabled:opacity-50"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin text-2xl"></i>
              ) : (
                <>SEARCH COLLECTION <i className="ri-arrow-right-line text-xl"></i></>
              )}
            </button>
          </div>

          {/* Browse Results */}
          <AnimatePresence>
            {browseResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-10 border-t border-white/5"
              >
                {/* User Info Card */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-xl font-black text-slate-900">
                    {browseResults.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-lg leading-none mb-1">{browseResults.username?.toUpperCase()}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase bg-slate-800 px-2 py-0.5 rounded border border-white/5">PROFILE FOUND</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] ml-2 mb-2">AVAILABLE FOR IMPORT</p>
                  
                  {/* Liked Songs Import */}
                  {browseResults.likedSongsCount > 0 && (
                    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-green-500/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                        <i className="ri-heart-fill text-white text-xl"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white">LIKED SONGS</p>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-tight uppercase">
                          {browseResults.likedSongsCount} TRACKS
                        </p>
                      </div>
                      <button
                        onClick={handleImportLikes}
                        disabled={importingId === "likes"}
                        className="bg-green-500 text-slate-900 px-4 py-2 rounded-xl font-black text-xs hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {importingId === "likes" ? <i className="ri-loader-4-line animate-spin"></i> : "IMPORT"}
                      </button>
                    </div>
                  )}

                  {/* Playlists Import */}
                  {browseResults.playlists.map((pl) => (
                    <div key={pl._id} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-green-500/30 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 border border-white/5">
                        <i className="ri-folder-music-fill text-green-400 text-xl"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{pl.name.toUpperCase()}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">
                          {pl.songs?.length || 0} TRACKS
                        </p>
                      </div>
                      <button
                        onClick={() => handleImportPlaylist(pl._id)}
                        disabled={importingId === pl._id}
                        className="bg-green-500 text-slate-900 px-4 py-2 rounded-xl font-black text-xs hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                      >
                         {importingId === pl._id ? <i className="ri-loader-4-line animate-spin"></i> : "IMPORT"}
                      </button>
                    </div>
                  ))}
                </div>

                {browseResults.likedSongsCount === 0 && browseResults.playlists.length === 0 && (
                  <div className="text-center py-10 bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
                    <i className="ri-ghost-line text-4xl block mb-2 text-zinc-700"></i>
                    <p className="text-sm font-bold text-zinc-500">USER HAS NO PUBLIC CONTENT</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!browseResults && !loading && (
            <div className="mt-12 p-6 bg-slate-900/30 rounded-[2rem] border border-white/5 border-dashed">
                <h4 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] mb-4 text-center">HOW IT WORKS</h4>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 text-center">
                    <div className="space-y-1">
                        <i className="ri-share-forward-line text-green-500 text-xl"></i>
                        <p className="text-[10px] font-bold text-zinc-300">GET USERNAME</p>
                        <p className="text-[9px] text-zinc-500 leading-tight">Copy your friend's username from their profile.</p>
                    </div>
                    <div className="space-y-1">
                        <i className="ri-shield-user-line text-green-500 text-xl"></i>
                        <p className="text-[10px] font-bold text-zinc-300">SEARCH & SELECT</p>
                        <p className="text-[9px] text-zinc-500 leading-tight">Browse their shared playlists and liked songs instantly.</p>
                    </div>
                </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Import;
