import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { usePlaylist } from "../context/PlaylistContext";
import { usePlayer } from "../context/PlayerContext";
import useLikedSongs from "../hooks/useLikedSongs";
import Loading from "./Loading";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import toast from "react-hot-toast";
import AddToPlaylistModal from "./AddToPlaylistModal";
import EditPlaylistModal from "./EditPlaylistModal";
import Tooltip from "./Tooltip";
import API_BASE_URL from "../config/api";

const API = `${API_BASE_URL}/api/playlists`;

const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };

const MyPlaylistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { removeSongFromPlaylist, importPlaylist, togglePlaylistVisibility, reorderSongs } = usePlaylist();
  const { toggleLike, isLiked } = useLikedSongs();
  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [hydratedSongs, setHydratedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null); // { status: number, message: string }

  // New States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Global Search & Hydration
  const [allHydratedSongs, setAllHydratedSongs] = useState([]);
  const [isHydratingAll, setIsHydratingAll] = useState(false);
  const [hydrationProgress, setHydrationProgress] = useState(0);

  const isOwner = user && (playlist?.owner?._id === user._id || playlist?.owner === user._id);
  const isCollaborator = user && playlist?.collaborators?.some(c => (c._id || c) === user._id);
  const canEdit = isOwner || isCollaborator;

  const fetchPlaylist = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      const { data } = await axios.get(`${API}/${id}?page=${pageNum}&limit=50`, {
        withCredentials: true,
      });
      setPlaylist(data);
      setTotalPages(data.totalPages);
      
      if (data.songs && data.songs.length > 0) {
        const idsString = data.songs.join(",");
        const saavnRes = await axios.get(
          `https://jiosaavn-roan.vercel.app/api/songs?ids=${idsString}`
        );
        if (append) {
          setHydratedSongs((prev) => [...prev, ...saavnRes.data.data]);
        } else {
          setHydratedSongs(saavnRes.data.data);
        }
      } else if (!append) {
        setHydratedSongs([]);
      }
    } catch (err) {
      console.error("[DEBUG] Fetch Error:", err);
      if (err.response?.status === 403) {
        setError({ status: 403, message: "This playlist is strictly private. Only the owner and invited contributors can build this vibe." });
      } else if (err.response?.status === 404) {
        setError({ status: 404, message: "This archive doesn't exist anymore. It might have been deleted or moved." });
      } else {
        setError({ status: 500, message: "Something went wrong while loading this collection." });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPlaylist(1);
    window.scrollTo(0, 0);
  }, [id]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPlaylist(nextPage, true);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await axios.post(`${API}/${id}/collaborators`, { username: inviteUsername.trim() }, { withCredentials: true });
      toast.success("Collaborator added!", { style: TOAST_STYLE });
      setInviteUsername("");
      fetchPlaylist(1); // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add collaborator");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await axios.delete(`${API}/${id}/collaborators/${userId}`, { withCredentials: true });
      toast.success("Collaborator removed", { style: TOAST_STYLE });
      fetchPlaylist(1); // Refresh
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!canEdit) return;
    await removeSongFromPlaylist(id, songId);
    setHydratedSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleImport = async () => {
    const result = await importPlaylist(id);
    if (result) {
      navigate("/my-playlists");
    }
  };

  const handleShare = async () => {
    const username = playlist?.owner?.username || "user";
    const playlistName = playlist?.name || "My Playlist";
    const shareUrl = `${window.location.origin}/${username}/${id}`;
    const shareText = `Check out "${playlistName}" by ${username} on THE ULTIMATE SONGS: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: playlistName,
          text: `Check out "${playlistName}" by ${username} on THE ULTIMATE SONGS`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareText);
          toast.success("Share link copied!", { style: TOAST_STYLE });
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share link copied!", { style: TOAST_STYLE });
    }
  };
  
  const handleShufflePlay = () => {
    if (hydratedSongs.length === 0) return;
    // Fisher-Yates Shuffle
    const shuffled = [...hydratedSongs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    playSong(shuffled[0], 0, shuffled);
    toast.success("Shuffling Vibe...", { icon: "🔀", style: TOAST_STYLE });
  };

  // Global Hydration for Search
  const hydrateAllSongs = async () => {
    if (isHydratingAll || allHydratedSongs.length === playlist?.totalSongs) return;
    
    setIsHydratingAll(true);
    const allIds = playlist?.allSongIds || [];
    if (allIds.length === 0) {
      setIsHydratingAll(false);
      return;
    }

    const CHUNK_SIZE = 50;
    const total = allIds.length;
    let results = [];
    
    try {
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = allIds.slice(i, i + CHUNK_SIZE);
        const idsString = chunk.join(",");
        const res = await axios.get(`https://jiosaavn-roan.vercel.app/api/songs?ids=${idsString}`);
        results = [...results, ...res.data.data];
        setAllHydratedSongs([...results]);
        setHydrationProgress(Math.round(((i + chunk.length) / total) * 100));
      }
    } catch (err) {
      console.error("Hydration Failed:", err);
      toast.error("Failed to load full playlist for search", { style: TOAST_STYLE });
    } finally {
      setIsHydratingAll(false);
    }
  };

  // Trigger hydration on search focus or first type
  useEffect(() => {
    if (searchQuery && allHydratedSongs.length === 0 && !isHydratingAll) {
      hydrateAllSongs();
    }
  }, [searchQuery]);

  // Bulk Removal
  const handleRemoveSongsBulk = async () => {
    if (!canEdit || selectedSongs.size === 0) return;
    if (!window.confirm(`Are you sure you want to remove ${selectedSongs.size} songs?`)) return;

    try {
      const idsToRemove = Array.from(selectedSongs);
      await axios.delete(`${API}/${id}/songs-bulk`, {
        data: { songIds: idsToRemove },
        withCredentials: true
      });
      
      setHydratedSongs(prev => prev.filter(s => !selectedSongs.has(s.id)));
      setSelectedSongs(new Set());
      toast.success("Songs removed successfully!", { style: TOAST_STYLE });
    } catch (err) {
      toast.error("Failed to remove songs");
    }
  };

  // Inline Update
  const handleUpdatePlaylist = async (field, value) => {
    if (!canEdit) return;
    try {
      const { data } = await axios.put(`${API}/${id}`, { [field]: value }, { withCredentials: true });
      setPlaylist(prev => ({ ...prev, [field]: value }));
      setIsEditingName(false);
      setIsEditingDesc(false);
      toast.success("Playlist updated!", { style: TOAST_STYLE });
    } catch (err) {
      toast.error("Failed to update playlist");
    }
  };

  const toggleSelectSong = (songId) => {
    setSelectedSongs(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const listToSelectFrom = allHydratedSongs.length > 0 ? allHydratedSongs : hydratedSongs;
    if (selectedSongs.size === listToSelectFrom.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(listToSelectFrom.map(s => s.id)));
    }
  };

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  const handleDragStart = (e, index) => {
    if (!canEdit) return;
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOverIndex(index);

    // Auto-scroll logic — scroll when close to top or bottom edges
    const threshold = 120; // px from edge
    const speed = 15;     // px per scroll
    if (e.clientY < threshold) {
      window.scrollBy(0, -speed);
    } else if (window.innerHeight - e.clientY < threshold) {
      window.scrollBy(0, speed);
    }
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      const newList = [...hydratedSongs];
      const [movedItem] = newList.splice(dragItem.current, 1);
      newList.splice(dragOverIndex, 0, movedItem);
      
      setHydratedSongs(newList); // Optimistic UI update
      const songIds = newList.map(s => s.id);
      reorderSongs(id, songIds); // Sync to backend
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  if (loading) return <Loading />;
  
  if (error) {
    return (
      <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full bg-slate-800/40 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl text-center shadow-2xl relative z-10"
        >
          <div className="w-24 h-24 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center mb-8 border border-white/5 shadow-inner">
            <i className={`text-5xl ${error.status === 403 ? "ri-lock-password-fill text-yellow-500" : error.status === 404 ? "ri-ghost-2-fill text-zinc-600" : "ri-error-warning-fill text-red-500"}`}></i>
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 leading-none">
            {error.status === 403 ? "ACCESS DENIED" : error.status === 404 ? "NOT FOUND" : "ERROR OCCURRED"}
          </h2>
          
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-10 opacity-70 leading-relaxed italic">
            "{error.message}"
          </p>

          <div className="flex flex-col gap-3">
            {!user && error.status === 403 && (
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-green-500 text-slate-900 font-black rounded-2xl hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20 uppercase tracking-widest text-xs"
              >
                Sign In to Access
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest text-xs"
            >
              Go Back Home
            </button>
          </div>
          
          <p className="mt-8 text-[9px] text-zinc-600 font-black tracking-[0.3em] uppercase">
            Protocol Error {error.status}
          </p>
        </motion.div>
      </div>
    );
  }

  const coverImage = hydratedSongs[0]?.image?.[2]?.url || noimg;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-zinc-300 pb-32 overflow-x-hidden">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-20 scale-110 blur-[100px]"
          style={{ 
            backgroundImage: `url(${coverImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/90 to-slate-900" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/5 h-[10vh] sm:h-[8vh] px-6 sm:px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Tooltip text="Go Back" position="bottom">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-lg shadow-green-500/20 active:scale-95"
            >
              <i className="ri-arrow-left-line text-2xl font-bold"></i>
            </button>
          </Tooltip>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-base text-white font-black tracking-tight leading-none truncate uppercase">
              {playlist?.name || "PLAYLIST"}
            </h1>
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] ml-0.5">COLLECTION</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Sync Button */}
          <Tooltip text="Sync Latest Changes" position="bottom">
            <button
              onClick={() => fetchPlaylist(1)}
              disabled={loading || loadingMore}
              className={`w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-green-400 hover:border-green-500/30 transition-all active:scale-90 shadow-xl ${loading || loadingMore ? 'animate-spin' : ''}`}
            >
              <i className="ri-refresh-line text-xl"></i>
            </button>
          </Tooltip>

          {isOwner && (
            <Tooltip text={playlist?.isPublic ? "Make Private" : "Make Public"} position="bottom">
              <button
                onClick={async () => {
                  const result = await togglePlaylistVisibility(id, !playlist.isPublic);
                  if (result) {
                    setPlaylist(prev => ({ ...prev, isPublic: result.isPublic }));
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-2 active:scale-95 border ${
                  playlist?.isPublic
                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                }`}
              >
                <i className={playlist?.isPublic ? "ri-earth-fill" : "ri-lock-fill"}></i>
                <span className="sm:hidden text-[10px] uppercase tracking-wider">{playlist?.isPublic ? "Public View" : "Only Me"}</span>
              </button>
            </Tooltip>
          )}

          {playlist?.isPublic && (
            <Tooltip text="Copy link to share this playlist" position="bottom">
              <button
                onClick={handleShare}
                className="px-5 py-2 bg-slate-800 text-white border border-white/5 rounded-full font-black text-xs hover:bg-slate-700 hover:border-white/20 transition-all active:scale-95 flex items-center gap-2 sm:px-3 shadow-lg shadow-black/20"
              >
                <i className="ri-link text-sm text-blue-400"></i>
                <span className="sm:hidden tracking-tighter uppercase">Share Link</span>
              </button>
            </Tooltip>
          )}

          {!isOwner && playlist?.isPublic && (
            <Tooltip text={user ? "Import to My Library" : "Login to Import"} position="bottom">
              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Please login to import playlists");
                    navigate("/login");
                    return;
                  }
                  handleImport();
                }}
                className="px-6 py-2 bg-green-500 text-slate-900 rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center gap-2 sm:px-4"
              >
                <i className="ri-import-fill text-sm"></i>
                <span className="sm:hidden uppercase tracking-tight">Add to Collection</span>
              </button>
            </Tooltip>
          )}
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
            <div className="w-64 h-64 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-slate-800 flex items-center justify-center">
              {hydratedSongs.length > 0 ? (
                <img
                  className="w-full h-full object-cover"
                  src={coverImage}
                  alt={playlist?.name}
                />
              ) : (
                <i className="ri-music-2-line text-6xl text-slate-600"></i>
              )}
            </div>
            {hydratedSongs.length > 0 && (
              <div className="absolute -bottom-6 -right-6 sm:-bottom-4 sm:-right-2 flex items-center gap-3">
                {canEdit && (
                  <Tooltip text="Edit Details" position="top">
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-12 h-12 sm:w-11 sm:h-11 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-zinc-400 text-xl shadow-2xl hover:bg-slate-700 hover:text-white hover:scale-110 active:scale-90 transition-all"
                    >
                      <i className="ri-edit-box-line"></i>
                    </button>
                  </Tooltip>
                )}

                <Tooltip text="Shuffle and Play" position="top">
                  <button 
                    onClick={handleShufflePlay}
                    className="w-12 h-12 sm:w-11 sm:h-11 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white text-xl shadow-2xl hover:bg-slate-700 hover:scale-110 active:scale-90 transition-all"
                  >
                    <i className="ri-shuffle-line"></i>
                  </button>
                </Tooltip>
                
                <Tooltip text="Play All" position="top">
                  <button 
                    onClick={() => playSong(hydratedSongs[0], 0, hydratedSongs)}
                    className="w-16 h-16 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 active:scale-90 transition-transform"
                  >
                    <i className="ri-play-fill text-2xl"></i>
                  </button>
                </Tooltip>
              </div>
            )}
          </motion.div>

          <div className="flex-1 flex flex-col sm:items-center sm:text-center pb-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
                {isCollaborator ? "COLLABORATIVE PLAYLIST" : "PERSONAL PLAYLIST"}
              </span>
              <h2 className="text-5xl sm:text-2xl font-black text-white mt-4 sm:mt-2 tracking-tighter leading-tight drop-shadow-2xl uppercase">
                {playlist?.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-3 text-zinc-300 font-medium sm:justify-center">
                <p className="text-xl sm:text-sm text-green-400 font-bold uppercase">
                  {playlist?.owner?.username}
                </p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm">{playlist?.totalSongs || 0} Tracks</p>
              </div>
              <div className="mt-4">
                <p className="text-zinc-500 italic text-sm max-w-xl line-clamp-2">
                  "{playlist?.description || "No description added."}"
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Collaborators Section */}
        {(isOwner || (playlist?.collaborators && playlist.collaborators.length > 0)) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-slate-800/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md"
          >
            <div className="flex xl:flex-row flex-col justify-between items-center xl:items-start gap-6">
              <div className="flex flex-col gap-1 w-full">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <i className="ri-group-line text-green-500"></i> Contributors
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase opacity-70 leading-relaxed max-w-2xl">
                  Invite friends to build this archive together. Collaborators can also invite others and add or remove tracks in real-time. 
                  Even if this playlist is set to private, all contributors will always maintain full access to the vibe!
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-full border border-green-500/30 flex items-center gap-2">
                    <i className="ri-vip-crown-fill text-xs"></i> OWNER: {playlist?.owner?.username}
                  </div>
                  {playlist?.collaborators?.map(collab => (
                    <div key={collab._id || collab} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-zinc-300 text-[10px] font-bold rounded-full border border-white/10">
                      <i className="ri-user-line text-zinc-500"></i>
                      {collab.username || "User"}
                      {isOwner && (
                        <Tooltip text="Remove Contributor">
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${collab.username || 'this user'} from contributors?`)) {
                                handleRemoveCollaborator(collab._id || collab);
                              }
                            }}
                            className="ml-1 w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                          >
                            <i className="ri-close-line text-xs font-bold"></i>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {canEdit && (
                <form onSubmit={handleAddCollaborator} className="flex items-center gap-2 w-full max-w-sm">
                  <div className="relative flex-1">
                    <i className="ri-user-add-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                    <input 
                      type="text"
                      placeholder="Invite by username..."
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-xs font-bold focus:border-green-500/50 focus:outline-none transition-all placeholder:text-zinc-700"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={inviting}
                    className="p-2.5 bg-green-500 hover:bg-green-400 text-slate-900 rounded-full transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-green-500/20"
                  >
                    {inviting ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-add-line font-bold"></i>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* Controls Bar: Search & Select All */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder={`Search in all ${playlist?.totalSongs || 0} tracks...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if(allHydratedSongs.length === 0) hydrateAllSongs(); }}
              className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 backdrop-blur-xl transition-all"
            />
            {isHydratingAll && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[9px] font-black text-green-500 tracking-tighter">{hydrationProgress}%</span>
                <i className="ri-loader-4-line animate-spin text-green-500"></i>
              </div>
            )}
          </div>
          
          {canEdit && (
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95 sm:w-full sm:justify-center"
            >
              <i className={selectedSongs.size === (allHydratedSongs.length > 0 ? allHydratedSongs.length : hydratedSongs.length) ? "ri-checkbox-fill text-green-500" : "ri-checkbox-blank-line"}></i>
              {selectedSongs.size === (allHydratedSongs.length > 0 ? allHydratedSongs.length : hydratedSongs.length) ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        {/* Track List */}
        <div 
          className="space-y-2 relative pb-[280px] md:pb-64"
          onDragLeave={handleDragLeave}
        >
          {(allHydratedSongs.length > 0 || hydratedSongs.length > 0) ? (
            <>
              {(allHydratedSongs.length > 0 ? allHydratedSongs : hydratedSongs)
              .filter(song => 
                song.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                song.artists?.primary?.[0]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.album?.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((song, i) => {
                const isActive = song.id === songlink[0]?.id;
                const isDragging = dragIndex === i;
                const isDragOver = dragOverIndex === i;

                return (
                  <motion.div 
                    key={song.id + i}
                    onDragOver={(e) => handleDragOver(e, i)}
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }} 
                    onClick={() => playSong(song, i, hydratedSongs)}
                    className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-200 border relative ${
                      selectedSongs.has(song.id) ? "bg-purple-500/10 border-purple-500/30" :
                      isDragging
                        ? "opacity-40 scale-95 border-dashed border-green-500/50"
                        : isDragOver
                        ? "border-t-4 border-green-500 bg-green-500/5"
                        : isActive 
                          ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" 
                          : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {canEdit && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); toggleSelectSong(song.id); }}
                        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-20 transition-all ${
                          selectedSongs.has(song.id) ? "bg-purple-500 border-purple-400 scale-110 opacity-100" : "bg-slate-900 border-white/10 opacity-0 group-hover:opacity-100"
                        } sm:opacity-100 sm:w-5 sm:h-5 sm:-left-1.5`}
                      >
                        {selectedSongs.has(song.id) && <i className="ri-check-line text-white text-xs font-bold"></i>}
                      </div>
                    )}

                    {/* Drag Handle / Index / Playing Indicator */}
                    <div className="flex items-center gap-2 sm:gap-1 flex-shrink-0">
                      {canEdit && (
                        <div 
                          draggable
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragEnd={handleDragEnd}
                          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-lg transition-all"
                        >
                          <i className="ri-draggable text-xl sm:text-2xl text-zinc-600 group-hover:text-green-500/50 transition-colors"></i>
                        </div>
                      )}
                      
                      <div className="w-6 sm:w-5 text-center pointer-events-none">
                        {isActive ? (
                          <img src={wavs} alt="" className="w-4 h-4 sm:w-3 sm:h-3 mx-auto" />
                        ) : (
                          <span className="text-[10px] sm:text-[9px] font-bold text-zinc-500 group-hover:text-green-400 transition-colors">{i + 1}</span>
                        )}
                      </div>
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
                            if (added) toast.success("Added to queue", { style: TOAST_STYLE }); 
                            else toast("Already in queue", { icon: "⚠️", style: TOAST_STYLE }); 
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
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all font-bold"
                        >
                          <i className="ri-folder-add-line text-lg sm:text-base"></i>
                        </button>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip text="Remove from Playlist">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleRemoveSong(song.id); 
                            }}
                            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <i className="ri-close-circle-line text-lg sm:text-base"></i>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Load More */}
              {page < totalPages && (
                <div className="w-full flex justify-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold border border-white/5 hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <><i className="ri-loader-4-line animate-spin"></i> LOADING...</>
                    ) : (
                      <><i className="ri-arrow-down-s-line"></i> LOAD MORE SONGS</>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center w-full py-20 bg-slate-800/20 rounded-2xl border border-dashed border-white/10">
              <i className="ri-music-line text-6xl text-slate-700 mb-4 block"></i>
              <h2 className="text-2xl font-bold text-white mb-2 uppercase">Empty Playlist</h2>
              <p className="text-zinc-500 max-w-sm mx-auto">
                {isOwner
                  ? "Go explore songs and add them here to build your collection!"
                  : "No songs have been added yet."}
              </p>
              {isOwner && (
                <button
                  onClick={() => navigate("/")}
                  className="mt-8 bg-green-500 text-slate-900 px-8 py-3 rounded-full font-black hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                >
                  FIND MUSIC
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Bulk Action Bar */}
        <AnimatePresence>
          {selectedSongs.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-[230px] md:bottom-28 left-0 right-0 mx-auto w-[calc(100%-2rem)] md:w-max max-w-lg md:max-w-none z-[110] flex items-center gap-4 bg-slate-900 border border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl backdrop-blur-2xl sm:px-3 sm:py-3 sm:gap-2"
            >
              <div className="flex items-center gap-3 sm:gap-2">
                <div className="w-10 h-10 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20 text-xs sm:text-[10px]">
                  {selectedSongs.size}
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Tracks</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight opacity-50 italic sm:hidden">Multi-vibe action bar</p>
                </div>
              </div>

              <div className="h-10 w-px bg-white/5 mx-2 sm:mx-1 sm:h-8" />

              <div className="flex items-center gap-3 sm:gap-1.5">
                <button
                  onClick={() => {
                    const source = allHydratedSongs.length > 0 ? allHydratedSongs : hydratedSongs;
                    const songsToSet = source.filter(s => selectedSongs.has(s.id));
                    setPlaylistModalSong(songsToSet);
                  }}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 sm:px-3 sm:py-2 sm:text-[9px]"
                >
                  <i className="ri-folders-line text-blue-400"></i> <span className="sm:hidden">ADD TO PLAYLISTS</span><span className="hidden sm:inline">ADD TO PL</span>
                </button>
                <button
                  onClick={handleRemoveSongsBulk}
                  className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-2 sm:px-3 sm:py-2 sm:text-[9px]"
                >
                  <i className="ri-delete-bin-line"></i> <span className="sm:hidden">REMOVE</span><span className="hidden sm:inline">DEL</span>
                </button>
                <button
                  onClick={() => setSelectedSongs(new Set())}
                  className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-2xl sm:text-xl"></i>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {playlistModalSong && (
          <AddToPlaylistModal 
            songs={playlistModalSong} 
            onClose={() => setPlaylistModalSong(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <EditPlaylistModal 
            playlist={playlist}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={(updated) => setPlaylist(prev => ({ ...prev, name: updated.name, description: updated.description }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPlaylistDetails;
