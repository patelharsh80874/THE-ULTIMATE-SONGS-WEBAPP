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

  const isOwner = user && playlist?.owner?._id === user._id;

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
    } catch (error) {
      console.error(error);
      toast.error("Playlist not found");
      navigate(-1);
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

  const handleRemoveSong = async (songId) => {
    await removeSongFromPlaylist(id, songId);
    setHydratedSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleImport = async () => {
    const result = await importPlaylist(id);
    if (result) {
      navigate("/my-playlists");
    }
  };

  const handleShare = () => {
    const username = playlist?.owner?.username || "user";
    const shareUrl = `${window.location.origin}/${username}/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!", { style: TOAST_STYLE });
  };

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  const handleDragStart = (e, index) => {
    if (!isOwner) return;
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    if (!isOwner) return;
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
              <button 
                onClick={() => playSong(hydratedSongs[0], 0, hydratedSongs)}
                className="absolute -bottom-4 -right-4 sm:bottom-2 sm:right-2 w-16 h-16 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center text-slate-900 text-3xl shadow-2xl hover:scale-110 active:scale-90 transition-transform"
              >
                <i className="ri-play-fill"></i>
              </button>
            )}
          </motion.div>

          <div className="flex-1 flex flex-col sm:items-center sm:text-center pb-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
                PERSONAL PLAYLIST
              </span>
              <h2 className="text-5xl sm:text-2xl font-black text-white mt-4 sm:mt-2 tracking-tighter leading-tight drop-shadow-2xl">
                {playlist?.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-3 text-zinc-300 font-medium sm:justify-center">
                <p className="text-xl sm:text-sm text-green-400 font-bold uppercase">
                  {playlist?.owner?.username}
                </p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm">{playlist?.totalSongs || 0} Tracks</p>
              </div>
              {playlist?.description && (
                <p className="mt-4 text-zinc-500 italic text-sm max-w-xl line-clamp-2">"{playlist.description}"</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Track List */}
        <div 
          className="space-y-2"
          onDragLeave={handleDragLeave}
        >
          {hydratedSongs.length > 0 ? (
            <>
              {hydratedSongs.map((song, i) => {
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
                    className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isDragging
                        ? "opacity-40 scale-95 border-dashed border-green-500/50"
                        : isDragOver
                        ? "border-t-4 border-green-500 bg-green-500/5"
                        : isActive 
                          ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" 
                          : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                    }`}
                  >
                    {/* Drag Handle / Index / Playing Indicator */}
                    <div className="w-8 sm:w-6 text-center flex-shrink-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        {isOwner && (
                          <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragEnd={handleDragEnd}
                            className="cursor-grab active:cursor-grabbing p-1"
                          >
                            <i className="ri-draggable text-xl text-zinc-600 group-hover:text-green-500/50 transition-colors"></i>
                          </div>
                        )}
                        {isActive ? (
                          <img src={wavs} alt="" className="w-4 h-4 sm:w-3 sm:h-3 mx-auto" />
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500 group-hover:text-green-400 transition-colors">{i + 1}</span>
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
                      {isOwner && (
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
      </div>

      <AnimatePresence>
        {playlistModalSong && (
          <AddToPlaylistModal 
            song={playlistModalSong} 
            onClose={() => setPlaylistModalSong(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPlaylistDetails;
