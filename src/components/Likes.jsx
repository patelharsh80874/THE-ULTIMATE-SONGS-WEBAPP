import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import wavs from "../../public/wavs.gif";
import noimg from "../../public/noimg.png";
import empty from "../../public/empty3.gif";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import toast from "react-hot-toast";
import downloadSongsWithMetadataAsZip from "../utils/downloadSongsWithMetadataAsZip";
import useLikedSongs from "../hooks/useLikedSongs";
import { usePlayer } from "../context/PlayerContext";
import { AuthContext } from "../context/AuthContext";
import AddToPlaylistModal from "./AddToPlaylistModal";
import Tooltip from "./Tooltip";
import Loading from "./Loading";

const Likes = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      toast.error('Please login to view your liked songs');
    }
  }, [user, loading, navigate]);


  const { likedSongs, removeSong, reorderLikes } = useLikedSongs();
  const { playSong, songlink, isPlaying, addToQueue } = usePlayer();

  const [downloadingZip, setDownloadingZip] = useState(false);
  const [songsForDownload, setSongsForDownload] = useState([]);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  // New States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongs, setSelectedSongs] = useState(new Set());

  // Sync songs for zip download
  useEffect(() => {
    const mappedSongs = likedSongs.map((item) => ({
      title: item?.name,
      url: item?.downloadUrl?.[4]?.url,
      image: item?.image?.[2]?.url,
      album: item?.album?.name,
      artist: item?.artists?.primary?.map((a) => a.name).join(","),
      year: item?.year,
    }));
    setSongsForDownload(mappedSongs);
  }, [likedSongs]);

  const downloadDatabaseFile = () => {
    const data = localStorage.getItem("likeData");
    if (!data) return;
    const password = prompt("Set a password for your export file 🔒:");
    if (!password) return;
    try {
      const encrypted = CryptoJS.AES.encrypt(data, password).toString();
      const blob = new Blob([encrypted], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `THE-ULTIMATE-SONGS-Likes-${user?.username || "backup"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export successful! Keep your password safe.");
    } catch (err) {
      toast.error("Export failed!");
    }
  };

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
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
      const newList = [...likedSongs];
      const [movedItem] = newList.splice(dragItem.current, 1);
      newList.splice(dragOverIndex, 0, movedItem);
      reorderLikes(newList);
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const TOAST_STYLE = { borderRadius: "10px", background: "rgb(115 115 115)", color: "#fff" };

  const handleShufflePlay = () => {
    if (likedSongs.length === 0) return;
    const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], 0, shuffled);
    toast.success("Shuffling Liked Songs...", { icon: "🔀", style: TOAST_STYLE });
  };

  const toggleSelectAll = () => {
    if (selectedSongs.size === likedSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(likedSongs.map(s => s.id)));
    }
  };

  const { removeSongsBulk } = useLikedSongs();

  const handleRemoveSongsBulk = async () => {
    if (selectedSongs.size === 0) return;
    if (!window.confirm(`Are you sure you want to unlike ${selectedSongs.size} songs?`)) return;

    try {
      const idsToRemove = Array.from(selectedSongs);
      await removeSongsBulk(idsToRemove);
      setSelectedSongs(new Set());
    } catch (err) {
      toast.error("Failed to remove songs");
    }
  };

  if (loading) return <Loading customText="Syncing Favorites" />;

  const coverImage = likedSongs?.[0]?.image?.[2]?.url || noimg;

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
              LIKED SONGS
            </h1>
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] ml-0.5">{likedSongs.length} TRACKS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <Tooltip text="Share Profile" position="bottom">
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(user?.username);
                        toast.success("Username copied! Share it for others to import.");
                    }}
                    className="px-5 py-2 bg-green-500 text-slate-900 rounded-full font-black text-xs hover:scale-105 transition-all shadow-lg shadow-green-500/10 active:scale-95 flex items-center gap-2 sm:px-3"
                >
                    <i className="ri-share-line text-lg"></i>
                    <span className="sm:hidden tracking-tighter">SHARE</span>
                </button>
            </Tooltip>
            
            <Tooltip text="Download All as ZIP" position="bottom">
                <button
                    disabled={downloadingZip || likedSongs.length === 0}
                    onClick={() => downloadSongsWithMetadataAsZip(songsForDownload, setDownloadingZip)}
                    className="px-5 py-2 bg-slate-800 text-white border border-white/5 rounded-full font-black text-xs hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 sm:px-3 disabled:opacity-50"
                >
                    <i className={downloadingZip ? "ri-loader-4-line animate-spin text-lg" : "ri-download-2-line text-lg text-blue-400"}></i>
                    <span className="sm:hidden tracking-tighter uppercase">ZIP</span>
                </button>
            </Tooltip>

            <Tooltip text="Import Songs & PlayList" position="bottom">
                <button
                    onClick={() => navigate("/import")}
                    className="px-5 py-2 bg-slate-800 text-white border border-white/5 rounded-full font-black text-xs hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 sm:px-3"
                >
                    <i className="ri-download-cloud-2-line text-lg text-green-400"></i>
                    <span className="sm:hidden tracking-tighter uppercase">IMPORT TRACKS</span>
                </button>
            </Tooltip>

            {/* <Tooltip text="Export Backup" position="bottom">
                <button
                    onClick={downloadDatabaseFile}
                    className="px-5 py-2 bg-slate-800 text-white border border-white/5 rounded-full font-black text-xs hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2 sm:px-3"
                >
                    <i className="ri-upload-2-line text-lg text-purple-400"></i>
                    <span className="sm:hidden tracking-tighter uppercase">EXPORT</span>
                </button>
            </Tooltip> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-[12vh] px-12 sm:px-6 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="flex sm:flex-col gap-10 sm:gap-6 items-end sm:items-center mb-16 sm:mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative flex-shrink-0"
          >
            <div className="w-64 h-64 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-slate-800 flex items-center justify-center">
              {likedSongs.length > 0 ? (
                <img
                  className="w-full h-full object-cover"
                  src={coverImage}
                  alt="Liked Songs"
                />
              ) : (
                <i className="ri-heart-line text-6xl text-slate-700"></i>
              )}
            </div>
            {likedSongs.length > 0 && (
              <div className="absolute -bottom-6 -right-6 sm:-bottom-4 sm:-right-2 flex items-center gap-3">
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
                    onClick={() => playSong(likedSongs[0], 0, likedSongs)}
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
              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-widest">
                FAVORITES
              </span>
              <h2 className="text-5xl sm:text-2xl font-black text-white mt-4 sm:mt-2 tracking-tighter leading-tight drop-shadow-2xl">
                Your Liked Songs
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-3 text-zinc-300 font-medium sm:justify-center">
                <p className="text-xl sm:text-sm text-green-400 font-bold uppercase">
                  {user?.username}
                </p>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                <p className="text-xl sm:text-sm">{likedSongs.length} Tracks</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Controls Bar: Search & Select All */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder={`Search in ${likedSongs.length} liked songs...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-green-500/30 backdrop-blur-xl transition-all"
            />
          </div>
          
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800/40 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95 sm:w-full sm:justify-center"
          >
            <i className={selectedSongs.size === likedSongs.length ? "ri-checkbox-fill text-green-500" : "ri-checkbox-blank-line"}></i>
            {selectedSongs.size === likedSongs.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Track List */}
        <div 
          className="space-y-2 relative pb-[280px] md:pb-64"
          onDragLeave={handleDragLeave}
        >
          {likedSongs.length > 0 ? (
            likedSongs
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
                  key={song.id || i}
                  onDragOver={(e) => handleDragOver(e, i)}
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.03 }} 
                  className={`group flex items-center gap-4 sm:gap-2 p-3 sm:p-2 rounded-xl cursor-pointer transition-all duration-200 border relative ${
                    isDragging
                      ? "opacity-40 scale-95 border-dashed border-green-500/50"
                      : isDragOver
                      ? "border-t-4 border-green-500 bg-green-500/5"
                      : selectedSongs.has(song.id)
                        ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5"
                        : isActive 
                          ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/5" 
                          : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                  }`}
                  onClick={() => playSong(song, i, likedSongs)}
                >
                  {/* Selection Checkbox */}
                  <div 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const newSelected = new Set(selectedSongs);
                      if (newSelected.has(song.id)) newSelected.delete(song.id);
                      else newSelected.add(song.id);
                      setSelectedSongs(newSelected);
                    }}
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-20 transition-all ${
                      selectedSongs.has(song.id) ? "bg-purple-500 border-purple-400 scale-110 opacity-100" : "bg-slate-900 border-white/10 opacity-0 group-hover:opacity-100"
                    } sm:opacity-100 sm:w-5 sm:h-5 sm:-left-1.5`}
                  >
                    {selectedSongs.has(song.id) && <i className="ri-check-line text-white text-xs font-bold"></i>}
                  </div>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-1 flex-shrink-0">
                      {/* Drag Handle */}
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragEnd={handleDragEnd}
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-lg transition-all"
                      >
                        <i className="ri-draggable text-xl sm:text-lg text-zinc-600 group-hover:text-green-500/50 transition-colors"></i>
                      </div>

                      {/* Index / Playing Indicator */}
                      <div className="w-6 sm:w-5 text-center pointer-events-none">
                        {isActive ? (
                          <img src={wavs} alt="" className="w-4 h-4 sm:w-3 sm:h-3 mx-auto" />
                        ) : (
                          <span className="text-[10px] sm:text-[9px] font-bold text-zinc-500 group-hover:text-green-400 transition-colors">{i + 1}</span>
                        )}
                      </div>
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
                    <Tooltip text="Unlike Song">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeSong(song.id); 
                        }}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <i className="ri-heart-fill text-lg sm:text-base"></i>
                      </button>
                    </Tooltip>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div 
              onClick={() => navigate("/")}
              className="text-center w-full py-20 bg-slate-800/20 rounded-2xl border border-dashed border-white/10 cursor-pointer group"
            >
              <motion.div whileHover={{ scale: 1.05 }} className="w-48 mx-auto grayscale group-hover:grayscale-0 transition-all">
                <img className="rounded-2xl opacity-60 group-hover:opacity-100" src={empty} alt="Empty" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-6 mb-2">Your library is silent</h2>
              <p className="text-zinc-500 max-w-xs mx-auto">
                Go explore some tracks and hit the heart icon to see them here!
              </p>
              <button
                className="mt-8 bg-green-500 text-slate-900 px-8 py-3 rounded-full font-black hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
              >
                EXPLORE NOW
              </button>
            </div>
          )}
        </div>
      </div>

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
                  const songsToSet = likedSongs.filter(s => selectedSongs.has(s.id));
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
                <i className="ri-delete-bin-line"></i> <span className="sm:hidden">UNLIKE TRACKS</span><span className="hidden sm:inline">DEL</span>
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

      <AnimatePresence>
        {playlistModalSong && (
          <AddToPlaylistModal 
            songs={playlistModalSong} 
            onClose={() => setPlaylistModalSong(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Likes;
