import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { usePlaylist } from "../context/PlaylistContext";
import useLikedSongs from "../hooks/useLikedSongs";
import toast from "react-hot-toast";
import Tooltip from "./Tooltip";
import API_BASE_URL from "../config/api";
import Loading from "./Loading";
import AISmartPlaylist from "./AISmartPlaylist";
import SpotifyBridgeModal from "./SpotifyBridgeModal";

const MyPlaylists = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const { playlists, collaborations, loadingPlaylists, createPlaylist, deletePlaylist, importPlaylist, fetchPlaylists } = usePlaylist();
  const { importLikes } = useLikedSongs();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [browseResults, setBrowseResults] = useState(null);
  const [importingId, setImportingId] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      toast.error("Please login to access your playlists");
    } else if (user) {
      fetchPlaylists();
    }
  }, [user, loading, navigate, fetchPlaylists]);


  const handleCreate = async (e) => {

    e.preventDefault();
    if (!newName.trim()) return;
    const playlist = await createPlaylist(newName, newDesc, isPublic);
    if (playlist) {
      setNewName("");
      setNewDesc("");
      setIsPublic(false);
      setShowCreate(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      await deletePlaylist(id);
      toast.success("Playlist deleted");
    }
  };

  const handleImportSearch = async () => {
    const val = importInput.trim();
    if (!val) return toast.error("Please enter a username or link");
    
    if (user && val.toLowerCase() === user.username.toLowerCase()) {
      return toast.error("You can't import your own collection!");
    }

    setImportLoading(true);
    setBrowseResults(null);
    try {
      // Matches both /my-playlists/:id and /:username/:id
      const playlistLinkMatch = val.match(/\/(?:my-playlists|[a-zA-Z0-9_\-\.]+)\/([a-f0-9]{24})/i);
      if (playlistLinkMatch) {
        const plId = playlistLinkMatch[1];
        const result = await importPlaylist(plId);
        if (result) {
          setShowImport(false);
          setImportInput("");
          await fetchPlaylists();
          toast.success("Playlist imported!");
        }
        setImportLoading(false);
        return;
      }
      
      const { data } = await axios.get(
        `${API_BASE_URL}/api/playlists/user/${val}`
      );

      setBrowseResults(data);
    } catch (err) {
      toast.error("User not found or content private.");
    } finally {
      setImportLoading(false);
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

  const totalSongs = playlists.reduce((acc, pl) => acc + (pl.songs?.length || 0), 0);

  if (loading) return <Loading customText="Verifying Identity" />;

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
        
        <h1 className="text-xl sm:text-base text-white font-black tracking-tight flex items-baseline gap-2">
           MY LIBRARY <span className="text-[10px] text-zinc-500 tracking-widest uppercase sm:hidden">{playlists.length} COLLECTIONS</span>
        </h1>

        <div className="ml-auto flex items-center gap-3 sm:gap-2">
            <Tooltip text="Sync Latest Changes" position="bottom">
                <button
                    onClick={() => fetchPlaylists()}
                    disabled={loadingPlaylists}
                    className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-green-400 hover:border-green-500/30 transition-all active:scale-90 shadow-lg ${loadingPlaylists ? 'animate-spin' : ''}`}
                >
                    <i className="ri-refresh-line text-lg sm:text-base"></i>
                </button>
            </Tooltip>
            <Tooltip text="Import songs from friends or backups" position="bottom">
                <button
                    onClick={() => { setShowImport(true); setBrowseResults(null); setImportInput(""); }}
                    className="px-6 py-2 sm:px-2.5 sm:py-1.5 bg-slate-800 border border-white/10 rounded-full text-white font-black text-sm hover:bg-slate-700 hover:border-white/20 transition-all shadow-lg shadow-black/20 active:scale-95 flex items-center gap-2"
                >
                    <i className="ri-download-cloud-2-line text-sm text-green-400"></i>
                    <span className="sm:hidden uppercase tracking-tight">IMPORT TRACKS</span>
                </button>
            </Tooltip>
            <Tooltip text="Spotify & YouTube Playlist Bridge" position="bottom">
                <button
                    onClick={() => setShowBridgeModal(true)}
                    className="px-6 py-2 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-red-500/10 border border-white/10 rounded-full font-black text-sm hover:from-green-500/20 hover:to-red-500/20 transition-all shadow-lg shadow-black/20 active:scale-95 flex items-center gap-3"
                >
                    <div className="flex items-center -space-x-1.5">
                        <i className="ri-spotify-fill text-green-500 text-sm"></i>
                        <i className="ri-youtube-fill text-red-600 text-sm"></i>
                    </div>
                    <span className="sm:hidden uppercase tracking-tight">PLAYLIST BRIDGE</span>
                </button>
            </Tooltip>
            <Tooltip text="AI Smart Playlist Generator" position="bottom">
                <button
                    onClick={() => setShowAIModal(true)}
                    className="px-6 py-2 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2 border border-white/10"
                >
                    <i className="ri-magic-line text-sm animate-pulse"></i>
                    <span className="sm:hidden uppercase tracking-tight">AI MAGIC</span>
                </button>
            </Tooltip>
            <Tooltip text="Create New Playlist" position="bottom">
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-6 py-2 sm:px-3 sm:py-1.5 bg-green-500 text-slate-900 rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/10 active:scale-95"
                >
                    <span className="sm:hidden">NEW PLAYLIST</span>
                    <i className="ri-add-line hidden sm:block text-xl"></i>
                </button>
            </Tooltip>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-[14vh] sm:pt-[10vh] px-8 sm:px-4 max-w-7xl mx-auto">
        
        {/* Library Hero / Stats */}
        <div className="mb-10 p-10 sm:p-6 rounded-[2.5rem] bg-gradient-to-br from-green-500/10 via-slate-800/20 to-transparent border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 text-green-400 mb-2">
                    <i className="ri-account-circle-line text-2xl"></i>
                    <span className="text-xs font-black tracking-[0.2em] uppercase">{user?.username || "GUEST"}</span>
                </div>
                <h2 className="text-4xl sm:text-3xl font-black text-white tracking-tighter mb-4">Your Musical Archives</h2>
                <div className="flex items-center gap-6 text-sm font-bold text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xl">{playlists.length}</span> PLAYLISTS
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xl">{totalSongs}</span> TRACKS
                    </div>
                </div>
            </div>
        </div>

        {/* Playlists Grid */}
        {loadingPlaylists ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : playlists.length > 0 || collaborations.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {playlists.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-zinc-500 tracking-[0.2em] ml-2 mb-2 uppercase">Your Collections</p>
                {playlists.map((pl, i) => (
                  <motion.div
                    key={pl._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/${user?.username || "user"}/${pl._id}`)}
                    className="group flex items-center gap-5 sm:gap-3 p-4 sm:p-3 rounded-2xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/80 hover:border-white/10 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-black/40"
                  >
                    <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-green-500/30 transition-all shadow-inner">
                      <i className="ri-play-list-2-fill text-3xl sm:text-xl text-green-500/80 group-hover:text-green-400"></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg sm:text-sm font-black text-white tracking-tight truncate group-hover:text-green-400 transition-colors uppercase leading-none">{pl.name}</h3>
                        {pl.collaborators?.length > 0 && <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">SHARED</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors tracking-tight">
                            {pl.songs?.length || 0} TRACKS
                        </span>
                        {pl.description && (
                            <span className="text-[10px] text-zinc-600 truncate max-w-[200px] italic">" {pl.description} "</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                        pl.isPublic 
                          ? "bg-green-500/10 border-green-500/20 text-green-400" 
                          : "bg-zinc-800 border-white/5 text-zinc-500"
                      }`}>
                        {pl.isPublic ? "PUBLIC ARCHIVE" : "PRIVATE"}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(pl._id, pl.name);
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                      >
                        <i className="ri-delete-bin-7-line text-lg"></i>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {collaborations.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-purple-500 tracking-[0.2em] ml-2 mb-2 uppercase flex items-center gap-2">
                  <i className="ri-group-line"></i> Collaborations
                </p>
                {collaborations.map((pl, i) => (
                  <motion.div
                    key={pl._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/${pl.owner.username}/${pl._id}`)}
                    className="group flex items-center gap-5 sm:gap-3 p-4 sm:p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-purple-900/20 flex items-center justify-center flex-shrink-0 border border-purple-500/10 group-hover:border-purple-400 transition-all shadow-inner">
                      <i className="ri-team-fill text-3xl sm:text-xl text-purple-400"></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-sm font-black text-white tracking-tight truncate group-hover:text-purple-400 transition-colors uppercase leading-none">{pl.name}</h3>
                        {pl.collaborators?.length > 0 && <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">SHARED</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors tracking-tight uppercase">
                            BY {pl.owner.username} • {pl.songs?.length || 0} TRACKS
                        </span>
                      </div>
                    </div>

                    <i className="ri-arrow-right-s-line text-xl text-zinc-600 group-hover:text-purple-400 transition-all mr-2"></i>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-800/20 rounded-[3rem] border border-dashed border-white/5">
            <i className="ri-play-list-add-line text-7xl text-zinc-700 mb-6 block"></i>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">Your Library is Empty</h2>
            <p className="text-zinc-500 mb-10 max-w-sm mx-auto text-sm">Start building your collection by creating a new playlist or importing from friends.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-500 text-slate-900 px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/10 active:scale-95"
              >
                CREATE PLAYLIST
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-purple-500 to-blue-500"></div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 leading-none">
                  <i className="ri-folder-add-fill text-green-500"></i> NEW PLAYLIST
                </h2>
                <button 
                  onClick={() => setShowCreate(false)}
                  className="text-zinc-500 hover:text-white transition-colors p-2 -mr-2"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] ml-2">PLAYLIST NAME</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:border-green-500/50 transition-all font-bold"
                    placeholder="E.g. MIDNIGHT DRIVE"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] ml-2">DESCRIPTION</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:border-green-500/50 transition-all font-bold"
                    placeholder="Add a vibe..."
                  />
                </div>

                <div className="flex items-center justify-between px-2 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white tracking-widest uppercase">Public View</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">{isPublic ? "Visible to Everyone" : "Only me (Private)"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${isPublic ? 'bg-green-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 text-slate-900 font-black py-4 rounded-2xl hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-green-500/10 mt-4 tracking-widest"
                >
                  CREATE NOW
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMPORT MODAL */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowImport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header & Search */}
              <div className="p-8 pb-0 shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
                    <i className="ri-share-forward-2-fill text-green-500"></i> Find Friends' Music 
                  </h2>
                  <button onClick={() => setShowImport(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
                
                <p className="text-[10px] text-zinc-500 font-bold mb-6 leading-relaxed uppercase tracking-wider">
                  Type a <span className="text-green-500">username</span> or paste a <span className="text-green-500">link</span> to find and copy playlists from other users.
                </p>

                <div className="relative group mb-5">
                  <i className="ri-search-2-line absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 text-base group-focus-within:text-green-500 transition-colors"></i>
                  <input
                    type="text"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImportSearch()}
                    className="w-full bg-slate-800/50 text-white border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-green-500/50 placeholder:text-zinc-700 transition-all font-bold text-sm shadow-inner"
                    placeholder="Username or link..."
                  />
                </div>

                <button
                  onClick={handleImportSearch}
                  disabled={importLoading}
                  className="w-full bg-slate-800 text-white font-black py-3.5 rounded-2xl hover:bg-green-500 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 tracking-widest shadow-xl text-xs"
                >
                  {importLoading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : "FETCH COLLECTION"}
                </button>
              </div>

              {/* Scrollable Results Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
                <AnimatePresence>
                  {browseResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                       {/* User Header */}
                       <div className="flex items-center gap-3 mb-5 bg-slate-800/30 p-3 rounded-2xl border border-white/5 shadow-inner">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-black text-slate-900 text-xs">{browseResults.username?.charAt(0).toUpperCase()}</div>
                          <p className="text-white font-black uppercase tracking-tight text-xs">{browseResults.username}'S REPOSITORY</p>
                       </div>

                      {browseResults.likedSongsCount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-2xl border border-white/5 group hover:border-green-500/30 transition-all">
                          <div className="flex items-center gap-3">
                             <i className="ri-heart-fill text-red-500 text-lg"></i>
                             <div>
                               <p className="text-[10px] font-black text-white">LIKED TRACKS</p>
                               <p className="text-[8px] text-zinc-500 font-bold">{browseResults.likedSongsCount} SONGS</p>
                             </div>
                          </div>
                          <button
                            onClick={handleImportLikes}
                            disabled={importingId === "likes"}
                            className="bg-green-500 text-slate-900 px-3 py-1 rounded-lg font-black text-[9px] tracking-widest uppercase hover:scale-105 transition-all shadow-lg shadow-green-500/10"
                          >
                            IMPORT
                          </button>
                        </div>
                      )}

                      {browseResults.playlists.map((pl) => (
                        <div key={pl._id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-2xl border border-white/5 group hover:border-green-500/30 transition-all">
                          <div className="flex items-center gap-3">
                             <i className="ri-folder-music-fill text-green-400 text-lg"></i>
                             <div>
                               <p className="text-[10px] font-black text-white truncate max-w-[120px] uppercase tracking-tight">{pl.name}</p>
                               <p className="text-[8px] text-zinc-500 font-bold">{pl.songs?.length || 0} SONGS</p>
                             </div>
                          </div>
                          <button
                            onClick={() => handleImportPlaylist(pl._id)}
                            disabled={importingId === pl._id}
                            className="bg-green-500 text-slate-900 px-3 py-1 rounded-lg font-black text-[9px] tracking-widest uppercase hover:scale-105 transition-all shadow-lg shadow-green-500/10"
                          >
                            IMPORT
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Smart Playlist Modal */}
      <AnimatePresence>
        {showAIModal && (
          <AISmartPlaylist 
            onClose={() => setShowAIModal(false)} 
            onSaveSuccess={fetchPlaylists}
          />
        )}
      </AnimatePresence>

      {/* Spotify Bridge Modal */}
      <AnimatePresence>
        {showBridgeModal && (
          <SpotifyBridgeModal 
            onClose={() => setShowBridgeModal(false)} 
            onSuccess={fetchPlaylists}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPlaylists;
